/**
 * Single-use token tracker for magic links.
 *
 * In *production* this should be backed by Redis (Upstash) so tokens stay
 * single-use across instances. In development, a process-local in-memory
 * store is used.
 */
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);

const usedLocal = new Map<string, number>();

function cleanupWindow(ttlMs: number): void {
  const cutoff = Date.now() - ttlMs;
  usedLocal.forEach((t, k) => {
    if (t < cutoff) usedLocal.delete(k);
  });
}

/** Returns true if this token was already used (replay). */
export async function isTokenUsed(jti: string): Promise<boolean> {
  if (HAS_REDIS) {
    const client = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string });
    const got = await client.get<string>(`magic-link:used:${jti}`);
    return got != null;
  }
  cleanupWindow(TOKEN_TTL_MS);
  return usedLocal.has(jti);
}

/** Marks this token as used. */
export async function markTokenUsed(jti: string): Promise<void> {
  if (HAS_REDIS) {
    const client = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string });
    // Keep the tombstone slightly longer than the token's TTL (15 min).
    await client.set(`magic-link:used:${jti}`, "1", { ex: 16 * 60 });
    return;
  }
  usedLocal.set(jti, Date.now());
}

const TOKEN_TTL_MS = 15 * 60 * 1000;
