/**
 * analytics/data-layer.ts — Real YouTube analytics provider.
 *
 * Data comes exclusively from the connected channel's own YouTube APIs:
 * - Daily series (views / watch time / subscriber growth): YouTube Analytics API,
 *   using the channel's stored OAuth token (yt-analytics.readonly scope).
 * - Top videos: YouTube Analytics API (real views + watch time), titles via the
 *   YouTube Data API.
 *
 * When the Analytics connection is unavailable the provider returns EMPTY series
 * with a clear message — never fabricated numbers.
 */

import { prisma } from "@/lib/db/prisma";
import { decryptSecret } from "@/lib/admin/secrets";
import { refreshAccessToken } from "@/lib/youtube/oauth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface VideoStat {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  /** null when the metric genuinely isn't available for this video */
  watchTimeMinutes: number | null;
  publishedAt: string;
}

export interface ChannelAnalytics {
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
  videoCount: number;
  views: TimeSeriesPoint[];
  subscriberGrowth: TimeSeriesPoint[];
  watchTimeMinutes: TimeSeriesPoint[];
  estimatedRevenue: TimeSeriesPoint[];
  topVideos: VideoStat[];
  /** The channel has usable OAuth tokens. */
  connected: boolean;
  /** Real daily series were returned by the YouTube Analytics API. */
  trendsAvailable: boolean;
  message?: string;
}

export type DateRangePreset = '7d' | '30d' | '90d';

export interface AnalyticsChannelRow {
  id: string;
  title: string;
  youtubeId: string;
  subscriberCount: number;
  videoCount: number;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

export interface AnalyticsQueryParams {
  channel: AnalyticsChannelRow;
  from: Date;
  to: Date;
}

export interface AnalyticsDataProvider {
  getChannelAnalytics(params: AnalyticsQueryParams): Promise<ChannelAnalytics>;
}

// ─── Constants & helpers ─────────────────────────────────────────────────────

const ANALYTICS_URL = "https://youtubeanalytics.googleapis.com/v2/reports";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function emptyResult(channel: AnalyticsChannelRow, message: string): ChannelAnalytics {
  return {
    channelId: channel.id,
    channelTitle: channel.title,
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    views: [],
    subscriberGrowth: [],
    watchTimeMinutes: [],
    estimatedRevenue: [],
    topVideos: [],
    connected: true,
    trendsAvailable: false,
    message,
  };
}

async function readCache(key: string): Promise<ChannelAnalytics | null> {
  try {
    const row = await prisma.youTubeCache.findUnique({ where: { key } });
    if (row && new Date(row.expiresAt).getTime() > Date.now()) {
      return row.payload as unknown as ChannelAnalytics;
    }
  } catch {
    // cache is best-effort
  }
  return null;
}

async function writeCache(key: string, payload: ChannelAnalytics): Promise<void> {
  try {
    const value = JSON.parse(JSON.stringify(payload)) as object;
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await prisma.youTubeCache.upsert({
      where: { key },
      create: { key, payload: value, expiresAt },
      update: { payload: value, expiresAt },
    });
  } catch {
    // cache is best-effort
  }
}

async function resolveAccessToken(channel: AnalyticsChannelRow): Promise<string | null> {
  if (!channel.accessToken) return null;
  try {
    const token = decryptSecret(channel.accessToken);
    const expires = channel.tokenExpiresAt ? new Date(channel.tokenExpiresAt).getTime() : 0;
    // Refresh five minutes before expiry when a refresh token exists.
    if (expires && expires - Date.now() < 5 * 60 * 1000 && channel.refreshToken) {
      const refreshed = await refreshAccessToken(decryptSecret(channel.refreshToken));
      return refreshed.accessToken;
    }
    return token;
  } catch {
    return null;
  }
}

// ─── Real provider ────────────────────────────────────────────────────────────

class YouTubeAnalyticsProvider implements AnalyticsDataProvider {
  async getChannelAnalytics(params: AnalyticsQueryParams): Promise<ChannelAnalytics> {
    const { channel, from, to } = params;
    const cacheKey = `analytics:${channel.id}:${fmtDate(from)}:${fmtDate(to)}`;
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    const token = await resolveAccessToken(channel);
    if (!token) {
      return emptyResult(
        channel,
        "This channel needs to be reconnected before analytics can load."
      );
    }

    const startDate = fmtDate(from);
    const endDate = fmtDate(to);

    // 1) Daily series — YouTube Analytics API.
    let views: TimeSeriesPoint[] = [];
    let watchTimeMinutes: TimeSeriesPoint[] = [];
    let subscriberGrowth: TimeSeriesPoint[] = [];
    let trendsAvailable = false;
    let message: string | undefined;

    try {
      const qs = new URLSearchParams({
        ids: "channel==MINE",
        startDate,
        endDate,
        metrics: "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
        dimensions: "day",
        sort: "day",
      });
      const res = await fetch(`${ANALYTICS_URL}?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          columnHeaders?: { name: string }[];
          rows?: (string | number)[][];
        };
        const headers = (data.columnHeaders ?? []).map((h) => h.name);
        const idx = (name: string) => headers.indexOf(name);
        const rows = data.rows ?? [];

        const dayRows = rows.map((r) => ({
          date: String(r[idx("day")] ?? ""),
          views: Number(r[idx("views")] ?? 0),
          minutes: Number(r[idx("estimatedMinutesWatched")] ?? 0),
          gained: Number(r[idx("subscribersGained")] ?? 0),
          lost: Number(r[idx("subscribersLost")] ?? 0),
        }));

        views = dayRows.map((r) => ({ date: r.date, value: r.views }));
        watchTimeMinutes = dayRows.map((r) => ({ date: r.date, value: r.minutes }));

        // Cumulative subscriber count ending at the current real count.
        const totalNet = dayRows.reduce((sum, r) => sum + (r.gained - r.lost), 0);
        let running = Math.max(0, channel.subscriberCount - totalNet);
        subscriberGrowth = dayRows.map((r) => {
          running += r.gained - r.lost;
          return { date: r.date, value: Math.max(0, Math.round(running)) };
        });

        trendsAvailable = true;
      } else if (res.status === 401 || res.status === 403) {
        message = "YouTube Analytics access expired — reconnect your channel to restore daily trends.";
      } else {
        message = "YouTube Analytics is temporarily unavailable. Please try again later.";
      }
    } catch {
      message = "Could not reach YouTube Analytics. Please try again later.";
    }

    // 2) Top videos — real views & watch time from the Analytics API.
    let topVideos: VideoStat[] = [];
    if (trendsAvailable) {
      try {
        const qs = new URLSearchParams({
          ids: "channel==MINE",
          startDate,
          endDate,
          metrics: "views,estimatedMinutesWatched",
          dimensions: "video",
          sort: "-views",
          maxResults: "5",
        });
        const res = await fetch(`${ANALYTICS_URL}?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            columnHeaders?: { name: string }[];
            rows?: (string | number)[][];
          };
          const headers = (data.columnHeaders ?? []).map((h) => h.name);
          const idx = (name: string) => headers.indexOf(name);
          const rows = data.rows ?? [];
          const videoIds = rows.map((r) => String(r[idx("video")] ?? "")).filter(Boolean);

          if (videoIds.length > 0) {
            const apiKey = process.env.YOUTUBE_API_KEY?.trim();
            const details = new Map<
              string,
              { title: string; thumbnailUrl: string; publishedAt: string }
            >();
            if (apiKey) {
              const vres = await fetch(
                `${VIDEOS_URL}?part=snippet&id=${encodeURIComponent(
                  videoIds.join(",")
                )}&key=${apiKey}`,
                { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
              );
              if (vres.ok) {
                const vdata = (await vres.json().catch(() => ({}))) as {
                  items?: {
                    id: string;
                    snippet?: {
                      title?: string;
                      publishedAt?: string;
                      thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
                    };
                  }[];
                };
                for (const item of vdata.items ?? []) {
                  details.set(item.id, {
                    title: item.snippet?.title ?? "Untitled",
                    thumbnailUrl:
                      item.snippet?.thumbnails?.medium?.url ??
                      item.snippet?.thumbnails?.default?.url ??
                      "",
                    publishedAt: item.snippet?.publishedAt ?? "",
                  });
                }
              }
            }

            topVideos = rows
              .map((r) => {
                const id = String(r[idx("video")] ?? "");
                const detail = details.get(id);
                return {
                  id,
                  title: detail?.title ?? "Video",
                  thumbnailUrl: detail?.thumbnailUrl ?? "",
                  views: Number(r[idx("views")] ?? 0),
                  watchTimeMinutes: Number(r[idx("estimatedMinutesWatched")] ?? 0),
                  publishedAt: detail?.publishedAt ?? "",
                };
              })
              .filter((v) => v.id);
          }
        }
      } catch {
        // top videos are best-effort — the series above are still real
      }
    }

    const result: ChannelAnalytics = {
      channelId: channel.id,
      channelTitle: channel.title,
      subscriberCount: channel.subscriberCount,
      videoCount: channel.videoCount,
      views,
      subscriberGrowth,
      watchTimeMinutes,
      // Revenue requires the monetary analytics scope, which is not requested yet.
      estimatedRevenue: [],
      topVideos,
      connected: true,
      trendsAvailable,
      message,
    };

    await writeCache(cacheKey, result);
    return result;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getAnalyticsProvider(): AnalyticsDataProvider {
  return new YouTubeAnalyticsProvider();
}

/** Convenience: resolve a preset to a {from, to} range */
export function resolveDateRange(preset: DateRangePreset): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  from.setDate(from.getDate() - days);
  return { from, to };
}
