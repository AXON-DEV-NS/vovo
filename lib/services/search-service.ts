import { prisma } from "@/lib/db/prisma";
import { readEnvLocal } from "@/lib/admin/secrets";

/**
 * Web Search Service — Tavily (primary) with automatic Serper failover.
 *
 * Rules implemented:
 * 1. Every request goes to Tavily first.
 * 2. On Tavily quota exhaustion (429 / quota message) it is skipped until the
 *    first day of next month (free quota renews monthly) and Serper takes over.
 * 3. Serper is a one-time balance: on 429 / zero-balance it is disabled
 *    permanently and never called again.
 * 4. If both providers are unavailable the service degrades gracefully:
 *    it returns `degraded: true` with an empty result set — callers fall back
 *    to model knowledge / stored memory instead of failing.
 * 5. Every query is cached (memory → DB) so repeated searches cost nothing.
 */

const TAVILY_URL = "https://api.tavily.com/search";
const SERPER_URL = "https://google.serper.dev/search";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_RESULTS = 8;

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface WebSearchResponse {
  ok: boolean;
  provider: "tavily" | "serper" | "cache" | "none";
  results: SearchResult[];
  /** true when no provider was available — use internal knowledge instead */
  degraded: boolean;
}

// ─── Provider state ──────────────────────────────────────────────────────────

interface ProviderState {
  exhaustedUntil: Date | null;
  disabled: boolean;
}

const globalForSearch = globalThis as unknown as {
  __vovoSearchState?: Map<string, ProviderState>;
};
const memoryState =
  globalForSearch.__vovoSearchState ?? new Map<string, ProviderState>();
globalForSearch.__vovoSearchState = memoryState;

function nextMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
}

async function getProviderState(provider: "tavily" | "serper"): Promise<ProviderState> {
  const mem = memoryState.get(provider);
  if (mem) return mem;

  let state: ProviderState = { exhaustedUntil: null, disabled: false };
  if (process.env.DATABASE_URL) {
    try {
      const row = await prisma.searchProviderState.findUnique({ where: { provider } });
      if (row) {
        state = { exhaustedUntil: row.exhaustedUntil, disabled: row.disabled };
      }
    } catch {
      // state read is best-effort
    }
  }
  memoryState.set(provider, state);
  return state;
}

async function updateProviderState(
  provider: "tavily" | "serper",
  patch: Partial<ProviderState> & { lastError?: string }
): Promise<void> {
  const current = await getProviderState(provider);
  const next: ProviderState = {
    exhaustedUntil: patch.exhaustedUntil !== undefined ? patch.exhaustedUntil : current.exhaustedUntil,
    disabled: patch.disabled !== undefined ? patch.disabled : current.disabled,
  };
  memoryState.set(provider, next);

  if (process.env.DATABASE_URL) {
    try {
      await prisma.searchProviderState.upsert({
        where: { provider },
        update: {
          exhaustedUntil: next.exhaustedUntil,
          disabled: next.disabled,
          lastError: patch.lastError ?? null,
        },
        create: {
          provider,
          exhaustedUntil: next.exhaustedUntil,
          disabled: next.disabled,
          lastError: patch.lastError ?? null,
        },
      });
    } catch {
      // state write is best-effort
    }
  }
}

function isUsable(state: ProviderState): boolean {
  if (state.disabled) return false;
  if (state.exhaustedUntil && state.exhaustedUntil.getTime() > Date.now()) return false;
  return true;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

const globalForCache = globalThis as unknown as {
  __vovoSearchCache?: Map<string, { payload: SearchResult[]; expiresAt: number }>;
};
const memoryCache =
  globalForCache.__vovoSearchCache ?? new Map<string, { payload: SearchResult[]; expiresAt: number }>();
globalForCache.__vovoSearchCache = memoryCache;

function cacheKey(query: string, maxResults: number): string {
  return `search:${query.trim().toLowerCase().replace(/\s+/g, " ")}:${maxResults}`;
}

async function readCache(key: string): Promise<SearchResult[] | null> {
  const now = Date.now();
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > now) return mem.payload;

  if (process.env.DATABASE_URL) {
    try {
      const row = await prisma.searchCache.findUnique({ where: { key } });
      if (row && row.expiresAt.getTime() > now) {
        const payload = row.payload as unknown as SearchResult[];
        memoryCache.set(key, { payload, expiresAt: row.expiresAt.getTime() });
        return payload;
      }
    } catch {
      // cache read is best-effort
    }
  }
  return null;
}

async function writeCache(key: string, results: SearchResult[]): Promise<void> {
  const expiresAt = Date.now() + CACHE_TTL_MS;
  memoryCache.set(key, { payload: results, expiresAt });

  if (process.env.DATABASE_URL) {
    try {
      const json = JSON.parse(JSON.stringify(results));
      await prisma.searchCache.upsert({
        where: { key },
        update: { payload: json, expiresAt: new Date(expiresAt) },
        create: { key, payload: json, expiresAt: new Date(expiresAt) },
      });
    } catch {
      // cache write is best-effort
    }
  }
}

// ─── Keys ────────────────────────────────────────────────────────────────────

function resolveKey(name: "TAVILY_API_KEY" | "SERPER_API_KEY"): string | null {
  const direct = process.env[name]?.trim();
  if (direct) return direct;
  try {
    return readEnvLocal()[name]?.trim() || null;
  } catch {
    return null;
  }
}

export function isWebSearchConfigured(): boolean {
  return Boolean(resolveKey("TAVILY_API_KEY") || resolveKey("SERPER_API_KEY"));
}

// ─── Providers ───────────────────────────────────────────────────────────────

function looksLikeQuotaError(status: number, body: string): boolean {
  if (status === 429) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("usage limit") ||
    lower.includes("rate limit") ||
    lower.includes("exceeded") ||
    lower.includes("insufficient")
  );
}

async function searchTavily(
  query: string,
  maxResults: number
): Promise<{ results: SearchResult[]; quotaExceeded: boolean }> {
  const key = resolveKey("TAVILY_API_KEY");
  if (!key) throw new Error("TAVILY_NOT_CONFIGURED");

  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const bodyText = await res.text().catch(() => "");

  if (!res.ok) {
    if (looksLikeQuotaError(res.status, bodyText)) {
      return { results: [], quotaExceeded: true };
    }
    throw new Error(`TAVILY_HTTP_${res.status}: ${bodyText.slice(0, 200)}`);
  }

  let data: { results?: Array<Record<string, unknown>> } = {};
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("TAVILY_INVALID_JSON");
  }

  const results = (data.results ?? []).map((r) => ({
    title: String(r.title ?? ""),
    url: String(r.url ?? ""),
    snippet: String(r.content ?? "").slice(0, 500),
    score: typeof r.score === "number" ? r.score : undefined,
  }));

  return { results, quotaExceeded: false };
}

async function searchSerper(
  query: string,
  maxResults: number
): Promise<{ results: SearchResult[]; balanceGone: boolean }> {
  const key = resolveKey("SERPER_API_KEY");
  if (!key) throw new Error("SERPER_NOT_CONFIGURED");

  const res = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": key,
    },
    body: JSON.stringify({ q: query, num: maxResults }),
    signal: AbortSignal.timeout(25_000),
  });

  const bodyText = await res.text().catch(() => "");

  if (!res.ok) {
    if (looksLikeQuotaError(res.status, bodyText)) {
      return { results: [], balanceGone: true };
    }
    throw new Error(`SERPER_HTTP_${res.status}: ${bodyText.slice(0, 200)}`);
  }

  let data: { organic?: Array<Record<string, unknown>> } = {};
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("SERPER_INVALID_JSON");
  }

  const results = (data.organic ?? []).slice(0, maxResults).map((r) => ({
    title: String(r.title ?? ""),
    url: String(r.link ?? ""),
    snippet: String(r.snippet ?? "").slice(0, 500),
  }));

  return { results, balanceGone: false };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function webSearch(
  query: string,
  options: { maxResults?: number; skipCache?: boolean } = {}
): Promise<WebSearchResponse> {
  const clean = query.trim();
  if (!clean) return { ok: false, provider: "none", results: [], degraded: true };

  const maxResults = Math.min(Math.max(options.maxResults ?? 6, 1), MAX_RESULTS);
  const key = cacheKey(clean, maxResults);

  if (!options.skipCache) {
    const cached = await readCache(key);
    if (cached) return { ok: true, provider: "cache", results: cached, degraded: false };
  }

  // 1) Tavily first — unless exhausted for this month.
  const tavilyState = await getProviderState("tavily");
  if (isUsable(tavilyState) && resolveKey("TAVILY_API_KEY")) {
    try {
      const { results, quotaExceeded } = await searchTavily(clean, maxResults);
      if (!quotaExceeded) {
        if (results.length > 0) await writeCache(key, results);
        return { ok: true, provider: "tavily", results, degraded: false };
      }
      // Monthly quota exhausted — skip Tavily until the 1st of next month.
      await updateProviderState("tavily", {
        exhaustedUntil: nextMonthStart(),
        lastError: "quota_exceeded",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      // Network/transient errors do not disable the provider; just fall through.
      console.warn("[search] Tavily error, falling back to Serper:", message);
      await updateProviderState("tavily", { lastError: message.slice(0, 200) });
    }
  }

  // 2) Serper fallback — only while its one-time balance lasts.
  const serperState = await getProviderState("serper");
  if (isUsable(serperState) && resolveKey("SERPER_API_KEY")) {
    try {
      const { results, balanceGone } = await searchSerper(clean, maxResults);
      if (!balanceGone) {
        if (results.length > 0) await writeCache(key, results);
        return { ok: true, provider: "serper", results, degraded: false };
      }
      // One-time balance exhausted — disable permanently.
      await updateProviderState("serper", {
        disabled: true,
        lastError: "balance_exhausted",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.warn("[search] Serper error:", message);
      await updateProviderState("serper", { lastError: message.slice(0, 200) });
    }
  }

  // 3) Emergency: both sources unavailable → degrade gracefully.
  console.warn(
    "[search] Both providers unavailable — continuing with internal model knowledge."
  );
  return { ok: false, provider: "none", results: [], degraded: true };
}

/** Compact text block for injection into AI prompts (token-efficient). */
export function formatSearchContext(results: SearchResult[], maxItems = 5): string {
  return results
    .slice(0, maxItems)
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.snippet.slice(0, 220)} (${r.url})`)
    .join("\n");
}
