import { readEnvLocal } from "@/lib/admin/secrets";
import type { VideoPlan } from "@/lib/ai-providers/deepseek";

/**
 * ElevenLabs voice engine.
 *
 * Prepared for Phase 2 (voice generation). It activates automatically once
 * ELEVENLABS_API_KEY is present in the environment / .env.local — no other
 * code change is required.
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_MODEL = "eleven_multilingual_v2";
const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

export interface TtsResult {
  audioBase64: string;
  mimeType: string;
  voiceId: string;
  modelId: string;
}

function resolveKey(): string | null {
  const direct = process.env.ELEVENLABS_API_KEY?.trim();
  if (direct) return direct;
  try {
    return readEnvLocal().ELEVENLABS_API_KEY?.trim() || null;
  } catch {
    return null;
  }
}

export function isElevenLabsConfigured(): boolean {
  return Boolean(resolveKey());
}

export function planToNarration(plan: VideoPlan): string {
  return plan.segments.map((s) => s.narration.trim()).filter(Boolean).join("\n\n");
}

/**
 * Generates a studio-quality voiceover for the given text.
 */
export async function synthesizeSpeech(params: {
  text: string;
  voiceId?: string;
  modelId?: string;
}): Promise<TtsResult> {
  const apiKey = resolveKey();
  if (!apiKey) throw new Error("ELEVENLABS_NOT_CONFIGURED");

  const voiceId = params.voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const modelId = params.modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL;

  const res = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: params.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
      signal: AbortSignal.timeout(120_000),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ELEVENLABS_HTTP_${res.status}: ${detail.slice(0, 300)}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`[ElevenLabs] voiceover generated | ${buffer.length} bytes | voice=${voiceId}`);

  return {
    audioBase64: buffer.toString("base64"),
    mimeType: "audio/mpeg",
    voiceId,
    modelId,
  };
}

/**
 * Generates the full voiceover for a production plan.
 */
export async function synthesizePlan(plan: VideoPlan): Promise<TtsResult> {
  const narration = planToNarration(plan);
  if (!narration) throw new Error("ELEVENLABS_EMPTY_NARRATION");
  return synthesizeSpeech({ text: narration });
}
