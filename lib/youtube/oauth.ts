import { prisma } from "@/lib/db/prisma";
import { encryptSecret, decryptSecret } from "@/lib/admin/secrets";
import { resolveRuntimeKey } from "@/lib/admin/runtime-keys";

/**
 * YouTube channel connection (OAuth 2.0, offline access).
 *
 * Scopes requested now cover everything the platform needs later:
 * - youtube                 → upload, schedule, manage the channel
 * - yt-analytics.readonly   → post-publish performance & retention
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

export const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function youtubeRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}/api/youtube/callback`;
}

async function resolveClientId(): Promise<string> {
  return (
    (await resolveRuntimeKey("youtube_client_id", "GOOGLE_CLIENT_ID")) ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

async function resolveClientSecret(): Promise<string> {
  return (await resolveRuntimeKey("youtube_client_secret", "GOOGLE_CLIENT_SECRET")) || "";
}

export async function isYouTubeOAuthConfigured(): Promise<boolean> {
  const id = await resolveClientId();
  const secret = await resolveClientSecret();
  return Boolean(id && secret);
}

export async function getYouTubeAuthUrl(state: string): Promise<string> {
  const clientId = await resolveClientId();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: youtubeRedirectUri(),
    response_type: "code",
    scope: YOUTUBE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export interface YouTubeTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export async function exchangeYouTubeCode(code: string): Promise<YouTubeTokens> {
  const clientId = await resolveClientId();
  const clientSecret = await resolveClientSecret();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: youtubeRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`YOUTUBE_TOKEN_EXCHANGE_FAILED: ${res.status} ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<YouTubeTokens> {
  const clientId = await resolveClientId();
  const clientSecret = await resolveClientSecret();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("YOUTUBE_REFRESH_FAILED");
  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  };
}

export interface YouTubeChannelInfo {
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
}

export async function fetchMyChannel(accessToken: string): Promise<YouTubeChannelInfo | null> {
  const res = await fetch(
    `${CHANNELS_URL}?part=snippet,statistics&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`YOUTUBE_CHANNEL_FETCH_FAILED: ${res.status} ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const item = data?.items?.[0];
  if (!item) return null;

  return {
    youtubeId: item.id,
    title: item.snippet?.title ?? "YouTube Channel",
    thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? null,
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
    videoCount: Number(item.statistics?.videoCount ?? 0),
  };
}

/** Encrypts tokens before they touch the database. */
export function encryptTokens(tokens: YouTubeTokens): {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date;
} {
  return {
    accessToken: encryptSecret(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
    tokenExpiresAt: tokens.expiresAt,
  };
}

export function decryptToken(stored: string): string {
  return decryptSecret(stored);
}

/**
 * Sessions identify users by email; the database uses a cuid. Resolve or
 * create the real user row so channels can be linked correctly.
 */
export { ensureDbUser } from "@/lib/auth/db-user";
