import { prisma } from "@/lib/db/prisma";
import { readEnvLocal } from "@/lib/admin/secrets";

/**
 * YouTube Data API v3 service layer (public service key — no user OAuth).
 *
 * Quota discipline (free tier = 10,000 units/day):
 *   search.list          100 units  → cached 60 min
 *   videos.list            1 unit   → cached 6 h
 *   channels.list          1 unit   → cached 24 h
 *   playlistItems.list     1 unit   → cached 3 h
 *   commentThreads.list    1 unit   → cached 12 h
 * Every call goes through `cached()` (memory → database → API), so repeated
 * searches never spend quota twice within the TTL window.
 */

const API_BASE = "https://www.googleapis.com/youtube/v3";

const TTL = {
  search: 60 * 60 * 1000,
  videos: 6 * 60 * 60 * 1000,
  channels: 24 * 60 * 60 * 1000,
  uploads: 3 * 60 * 60 * 1000,
  comments: 12 * 60 * 60 * 1000,
};

// ─── Cache ───────────────────────────────────────────────────────────────────

const globalForYt = globalThis as unknown as {
  __vovoYtCache?: Map<string, { payload: unknown; expiresAt: number }>;
};
const memoryCache = globalForYt.__vovoYtCache ?? new Map<string, { payload: unknown; expiresAt: number }>();
globalForYt.__vovoYtCache = memoryCache;

async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();

  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > now) return mem.payload as T;

  if (process.env.DATABASE_URL) {
    try {
      const row = await prisma.youTubeCache.findUnique({ where: { key } });
      if (row && row.expiresAt.getTime() > now) {
        memoryCache.set(key, { payload: row.payload, expiresAt: row.expiresAt.getTime() });
        return row.payload as T;
      }
    } catch {
      // cache read is best-effort
    }
  }

  const payload = await fetcher();
  memoryCache.set(key, { payload, expiresAt: now + ttlMs });

  if (process.env.DATABASE_URL) {
    try {
      const json = JSON.parse(JSON.stringify(payload));
      await prisma.youTubeCache.upsert({
        where: { key },
        update: { payload: json, expiresAt: new Date(now + ttlMs) },
        create: { key, payload: json, expiresAt: new Date(now + ttlMs) },
      });
    } catch {
      // cache write is best-effort
    }
  }

  return payload;
}

// ─── Key resolution ──────────────────────────────────────────────────────────

function resolveApiKey(): string | null {
  const direct = process.env.YOUTUBE_API_KEY?.trim();
  if (direct) return direct;
  try {
    return readEnvLocal().YOUTUBE_API_KEY?.trim() || null;
  } catch {
    return null;
  }
}

export function isYouTubeDataConfigured(): boolean {
  return Boolean(resolveApiKey());
}

async function ytFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const key = resolveApiKey();
  if (!key) throw new Error("YOUTUBE_API_NOT_CONFIGURED");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  qs.set("key", key);

  const res = await fetch(`${API_BASE}/${path}?${qs.toString()}`, {
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`YOUTUBE_API_${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  durationSeconds: number;
  /** views gained per hour since publishing — rising topics have high velocity */
  velocityPerHour: number;
}

export interface YouTubeChannel {
  channelId: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string | null;
}

export interface MetadataMining {
  topTags: { tag: string; count: number }[];
  titlePatterns: string[];
  averageViews: number;
  averageVelocity: number;
  totalVideosAnalyzed: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return 0;
  const [, d, h, mi, s] = m;
  return (
    (Number(d) || 0) * 86400 +
    (Number(h) || 0) * 3600 +
    (Number(mi) || 0) * 60 +
    (Number(s) || 0)
  );
}

export function computeVelocity(views: number, publishedAt: string): number {
  const hours = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 3_600_000);
  return Math.round(views / hours);
}

// ─── 1) Trend detection ──────────────────────────────────────────────────────

export interface SearchTrendingParams {
  query: string;
  /** look-back window in days (1 = last 24h) */
  days?: number;
  regionCode?: string;
  maxResults?: number;
  order?: "viewCount" | "relevance" | "date";
}

export async function searchTrendingVideos(
  params: SearchTrendingParams
): Promise<YouTubeVideo[]> {
  const days = Math.min(Math.max(params.days ?? 7, 1), 30);
  const maxResults = Math.min(Math.max(params.maxResults ?? 12, 1), 25);
  const order = params.order ?? "viewCount";
  const publishedAfter = new Date(Date.now() - days * 86_400_000).toISOString();

  const cacheKey = `yt:search:${params.query.toLowerCase()}:${days}:${params.regionCode ?? ""}:${maxResults}:${order}`;

  return cached(cacheKey, TTL.search, async () => {
    const search = await ytFetch<{ items?: Array<Record<string, any>> }>("search", {
      part: "snippet",
      q: params.query,
      type: "video",
      order,
      publishedAfter,
      regionCode: params.regionCode,
      maxResults,
      safeSearch: "moderate",
    });

    const ids = (search.items ?? [])
      .map((i) => i?.id?.videoId)
      .filter((id): id is string => typeof id === "string");

    if (ids.length === 0) return [];

    const details = await getVideoDetails(ids);
    const byId = new Map(details.map((v) => [v.videoId, v]));

    return ids
      .map((id) => byId.get(id))
      .filter((v): v is YouTubeVideo => Boolean(v));
  });
}

// ─── 2) Video details (statistics, tags, duration) ───────────────────────────

export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
  const ids = videoIds.slice(0, 50);
  if (ids.length === 0) return [];

  const cacheKey = `yt:videos:${ids.slice().sort().join(",")}`;

  return cached(cacheKey, TTL.videos, async () => {
    const data = await ytFetch<{ items?: Array<Record<string, any>> }>("videos", {
      part: "snippet,statistics,contentDetails",
      id: ids.join(","),
    });

    return (data.items ?? []).map((item) => {
      const publishedAt = item.snippet?.publishedAt ?? new Date().toISOString();
      const views = Number(item.statistics?.viewCount ?? 0);
      return {
        videoId: item.id,
        title: item.snippet?.title ?? "",
        description: item.snippet?.description ?? "",
        channelId: item.snippet?.channelId ?? "",
        channelTitle: item.snippet?.channelTitle ?? "",
        publishedAt,
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.default?.url ??
          null,
        tags: Array.isArray(item.snippet?.tags) ? item.snippet.tags : [],
        views,
        likes: Number(item.statistics?.likeCount ?? 0),
        comments: Number(item.statistics?.commentCount ?? 0),
        durationSeconds: parseDuration(item.contentDetails?.duration ?? ""),
        velocityPerHour: computeVelocity(views, publishedAt),
      };
    });
  });
}

// ─── 3) Competitor analysis ──────────────────────────────────────────────────

export async function getChannelDetails(input: {
  channelId?: string;
  handle?: string;
  username?: string;
}): Promise<YouTubeChannel | null> {
  const cacheKey = `yt:channel:${input.channelId ?? input.handle ?? input.username ?? ""}`;

  return cached(cacheKey, TTL.channels, async () => {
    const data = await ytFetch<{ items?: Array<Record<string, any>> }>("channels", {
      part: "snippet,statistics",
      id: input.channelId,
      forHandle: input.handle,
      forUsername: input.username,
    });

    const item = data.items?.[0];
    if (!item) return null;

    return {
      channelId: item.id,
      title: item.snippet?.title ?? "",
      description: item.snippet?.description ?? "",
      subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
      videoCount: Number(item.statistics?.videoCount ?? 0),
      viewCount: Number(item.statistics?.viewCount ?? 0),
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.default?.url ??
        null,
    };
  });
}

export async function getChannelUploads(
  channelId: string,
  maxResults = 12
): Promise<YouTubeVideo[]> {
  const limit = Math.min(Math.max(maxResults, 1), 25);
  const cacheKey = `yt:uploads:${channelId}:${limit}`;

  return cached(cacheKey, TTL.uploads, async () => {
    const channel = await ytFetch<{ items?: Array<Record<string, any>> }>("channels", {
      part: "contentDetails",
      id: channelId,
    });
    const uploadsPlaylist = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) return [];

    const playlist = await ytFetch<{ items?: Array<Record<string, any>> }>(
      "playlistItems",
      { part: "contentDetails", playlistId: uploadsPlaylist, maxResults: limit }
    );

    const ids = (playlist.items ?? [])
      .map((i) => i?.contentDetails?.videoId)
      .filter((id): id is string => typeof id === "string");

    return getVideoDetails(ids);
  });
}

// ─── 4) Audience sentiment (comments) ────────────────────────────────────────

export interface VideoComment {
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export async function getVideoComments(
  videoId: string,
  maxResults = 50
): Promise<VideoComment[]> {
  const limit = Math.min(Math.max(maxResults, 1), 100);
  const cacheKey = `yt:comments:${videoId}:${limit}`;

  return cached(cacheKey, TTL.comments, async () => {
    const data = await ytFetch<{ items?: Array<Record<string, any>> }>(
      "commentThreads",
      {
        part: "snippet",
        videoId,
        maxResults: limit,
        order: "relevance",
        textFormat: "plainText",
      }
    );

    return (data.items ?? []).map((item) => {
      const c = item.snippet?.topLevelComment?.snippet ?? {};
      return {
        author: c.authorDisplayName ?? "",
        text: c.textDisplay ?? "",
        likeCount: Number(c.likeCount ?? 0),
        publishedAt: c.publishedAt ?? "",
      };
    });
  });
}

// ─── 5) Metadata mining (no quota — pure analysis of fetched videos) ─────────

export function mineMetadata(videos: YouTubeVideo[]): MetadataMining {
  const tagCount = new Map<string, number>();
  for (const v of videos) {
    for (const tag of v.tags) {
      const clean = tag.trim().toLowerCase();
      if (clean) tagCount.set(clean, (tagCount.get(clean) ?? 0) + 1);
    }
  }

  const topTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  const patterns = new Set<string>();
  for (const v of videos) {
    const t = v.title;
    if (/\d/.test(t)) patterns.add("يحتوي رقمًا (قوائم/سنوات/أرقام)");
    if (t.includes("?")) patterns.add("صيغة سؤال مباشر");
    if (/[\[\](){}]/.test(t)) patterns.add("استخدام أقواس لعنصر إضافي");
    if (/\b(how|why|what|best|top|vs)\b/i.test(t) || /(كيف|لماذا|أفضل|أقوى|مقارنة)/.test(t))
      patterns.add("كلمات استفهامية/مقارنة");
    if (t.length <= 60) patterns.add("عنوان قصير مركز");
  }

  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  return {
    topTags,
    titlePatterns: [...patterns].slice(0, 8),
    averageViews: avg(videos.map((v) => v.views)),
    averageVelocity: avg(videos.map((v) => v.velocityPerHour)),
    totalVideosAnalyzed: videos.length,
  };
}

/** Extract a channel handle/id from any YouTube URL or raw value. */
export function parseChannelReference(input: string): { channelId?: string; handle?: string } {
  const value = input.trim();
  if (!value) return {};

  const handleMatch = value.match(/youtube\.com\/@([A-Za-z0-9._-]+)/);
  if (handleMatch) return { handle: `@${handleMatch[1]}` };

  const channelMatch = value.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]+)/);
  if (channelMatch) return { channelId: channelMatch[1] };

  if (value.startsWith("UC") && value.length > 20) return { channelId: value };
  if (value.startsWith("@")) return { handle: value };

  return {};
}

/** Extract a video id from any YouTube URL or raw value. */
export function parseVideoReference(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  const short = value.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (short) return short[1];

  const watch = value.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (watch) return watch[1];

  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  return null;
}
