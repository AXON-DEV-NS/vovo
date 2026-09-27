import { readEnvLocal } from "@/lib/admin/secrets";

/**
 * DeepSeek — the production brain of the platform.
 *
 * Token-efficiency rules (the API is paid):
 * - One single JSON call returns the whole production plan (no multi-step chat).
 * - `max_tokens` is derived from the requested duration and hard-capped.
 * - Niche memory is trimmed to the most recent top items and truncated.
 * - `response_format: json_object` prevents wasted prose.
 * - Token usage is logged so cost can be monitored.
 */

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";
const MAX_TOKENS_CAP = 4096;
const MEMORY_LIMIT = 6;
const MEMORY_CHARS = 160;

export interface NicheMemory {
  positivePatterns: string[];
  negativePitfalls: string[];
  webInsights: string[];
}

export interface VideoSegment {
  narration: string;
  visualPrompt: string;
  voiceDirection: string;
  durationSeconds: number;
}

export interface VideoPlan {
  hook: string;
  title: string;
  titleOptions: string[];
  description: string;
  tags: string[];
  thumbnailPrompt: string;
  segments: VideoSegment[];
  estimatedDurationSeconds: number;
}

export interface GeneratePlanParams {
  title: string;
  niche: string;
  language?: "ar" | "en";
  targetDurationSeconds?: number;
  memory?: NicheMemory;
}

function resolveKey(): string | null {
  const direct = process.env.DEEPSEEK_API_KEY?.trim();
  if (direct) return direct;
  try {
    return readEnvLocal().DEEPSEEK_API_KEY?.trim() || null;
  } catch {
    return null;
  }
}

export function isDeepSeekConfigured(): boolean {
  return Boolean(resolveKey());
}

function clamp(text: string, max = MEMORY_CHARS): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function memoryBlock(memory?: NicheMemory): string {
  if (!memory) return "";
  const parts: string[] = [];

  const pos = memory.positivePatterns.slice(0, MEMORY_LIMIT).map((p) => `- ${clamp(p)}`);
  const neg = memory.negativePitfalls.slice(0, MEMORY_LIMIT).map((p) => `- ${clamp(p)}`);
  const web = memory.webInsights.slice(0, 4).map((p) => `- ${clamp(p)}`);

  if (pos.length) parts.push(`PROVEN PATTERNS (must apply):\n${pos.join("\n")}`);
  if (neg.length) parts.push(`FORBIDDEN PITFALLS (must avoid):\n${neg.join("\n")}`);
  if (web.length) parts.push(`CURRENT MARKET NOTES:\n${web.join("\n")}`);

  return parts.join("\n\n");
}

function normalizePlan(raw: Record<string, unknown>, params: GeneratePlanParams): VideoPlan {
  const segments = Array.isArray(raw.segments) ? raw.segments : [];
  const normalizedSegments: VideoSegment[] = segments
    .map((s) => {
      const seg = (s ?? {}) as Record<string, unknown>;
      return {
        narration: typeof seg.narration === "string" ? seg.narration.trim() : "",
        visualPrompt: typeof seg.visualPrompt === "string" ? seg.visualPrompt.trim() : "",
        voiceDirection: typeof seg.voiceDirection === "string" ? seg.voiceDirection.trim() : "",
        durationSeconds:
          typeof seg.durationSeconds === "number" && seg.durationSeconds > 0
            ? Math.round(seg.durationSeconds)
            : 6,
      };
    })
    .filter((s) => s.narration.length > 0);

  const estimated = normalizedSegments.reduce((sum, s) => sum + s.durationSeconds, 0);

  return {
    hook: typeof raw.hook === "string" ? raw.hook.trim() : "",
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : params.title,
    titleOptions: Array.isArray(raw.titleOptions)
      ? (raw.titleOptions as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 3)
      : [],
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    tags: Array.isArray(raw.tags)
      ? (raw.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 12)
      : [],
    thumbnailPrompt: typeof raw.thumbnailPrompt === "string" ? raw.thumbnailPrompt.trim() : "",
    segments: normalizedSegments,
    estimatedDurationSeconds: estimated || (params.targetDurationSeconds ?? 420),
  };
}

/**
 * Generic, token-capped completion for internal assistants (guardian, critic…).
 * Prefer the specialized helpers above when possible.
 */
export async function askDeepSeek(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  const apiKey = resolveKey();
  if (!apiKey) throw new Error("DEEPSEEK_NOT_CONFIGURED");

  const maxTokens = Math.min(params.maxTokens ?? 700, 1500);

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      ...(params.json ? { response_format: { type: "json_object" } } : {}),
      temperature: params.temperature ?? 0.4,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DEEPSEEK_HTTP_${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("DEEPSEEK_EMPTY_RESPONSE");

  const usage = data?.usage;
  if (usage) {
    console.log(
      `[DeepSeek] reply generated | prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`
    );
  }

  return content.trim();
}

/**
 * Generates the complete production plan for one video:
 * hook + narration + Higgsfield visual prompts + ElevenLabs voice directions,
 * constrained by the shared niche memory.
 */
export async function generateVideoPlan(params: GeneratePlanParams): Promise<VideoPlan> {
  const apiKey = resolveKey();
  if (!apiKey) throw new Error("DEEPSEEK_NOT_CONFIGURED");

  const duration = Math.min(Math.max(params.targetDurationSeconds ?? 420, 120), 900);
  const language = params.language === "ar" ? "Arabic" : "English";
  // ~7 tokens per second of narration, hard-capped to control cost.
  const maxTokens = Math.min(MAX_TOKENS_CAP, Math.max(900, Math.round(duration * 7)));

  const system = [
    "You are the production brain of an autonomous YouTube channel.",
    "You write retention-first scripts and precise production directions.",
    "Reply with ONE JSON object only — no markdown, no commentary.",
    'Shape: {"hook":string,"title":string,"titleOptions":string[3],"description":string,"tags":string[10],"thumbnailPrompt":string,"estimatedDurationSeconds":number,"segments":[{"narration":string,"visualPrompt":string,"voiceDirection":string,"durationSeconds":number}]}',
    `Rules: narration in ${language}; hook within the first 3 seconds; each segment 3-8 seconds of narration;`,
    "visualPrompt = a cinematic English prompt for an AI video generator with consistent character/scene references;",
    "voiceDirection = a short tone/pacing note for the voice engine.",
  ].join(" ");

  const user = [
    `Niche: ${params.niche}`,
    `Video title: ${params.title}`,
    `Target duration: ${duration} seconds`,
    memoryBlock(params.memory),
    `Write the full production plan now, keeping total narration close to ${duration} seconds.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DEEPSEEK_HTTP_${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("DEEPSEEK_EMPTY_RESPONSE");

  const usage = data?.usage;
  if (usage) {
    console.log(
      `[DeepSeek] plan generated | prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("DEEPSEEK_INVALID_JSON");
  }

  return normalizePlan(parsed, params);
}
