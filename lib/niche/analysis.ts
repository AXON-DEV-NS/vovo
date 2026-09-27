import { runAgentJson } from "@/lib/ai-providers/agents";

/**
 * The strategist persona analyses a niche BEFORE any idea or video is made:
 * audience, current trends, competitors, opportunities, risks, and whether
 * the content needs a fixed avatar/character (visual identity).
 */

export interface NicheAnalysis {
  summary: string;
  audience: string[];
  trends: string[];
  competitors: string[];
  opportunities: string[];
  contentAngles: string[];
  risks: string[];
  requiresAvatar: boolean;
  avatarNotes: string;
  dos: string[];
  donts: string[];
  verdict: string;
}

export interface AnalyzeNicheInput {
  niche: string;
  description?: string;
  referenceVideoUrl?: string;
  referenceChannelUrl?: string;
  audience?: string;
  language?: "ar" | "en";
  /** Live web-search context (Tavily/Serper) injected into the analysis */
  webContext?: string;
}

const ANALYSIS_SHAPE =
  '{"summary":string,"audience":string[],"trends":string[],"competitors":string[],"opportunities":string[],"contentAngles":string[],"risks":string[],"requiresAvatar":boolean,"avatarNotes":string,"dos":string[],"donts":string[],"verdict":string}';

export async function analyzeNiche(input: AnalyzeNicheInput): Promise<NicheAnalysis> {
  const user = [
    `Niche: ${input.niche}`,
    input.description ? `Client's description of the content: ${input.description}` : "",
    input.audience ? `Target audience: ${input.audience}` : "",
    input.referenceVideoUrl ? `Reference video (same content type): ${input.referenceVideoUrl}` : "",
    input.referenceChannelUrl ? `Competing channel working in the same content: ${input.referenceChannelUrl}` : "",
    input.webContext
      ? `Recent web search results (use them to back up the analysis):\n${input.webContext}`
      : "",
    "",
    "Analyze the market, audience, trends, and competitors for this niche before producing any video.",
    "Answer in English in all text fields.",
    "Clearly determine whether the content needs a fixed character/avatar across all videos (requiresAvatar).",
    "If it needs an avatar, specify in avatarNotes the reference image required from the client",
    "(Character Turnaround Sheet: front, back, both sides, expressions, clothing details).",
    "If there isn't enough data about competitors or trends, say so plainly in verdict.",
    `Output JSON only in this shape: ${ANALYSIS_SHAPE}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await runAgentJson<Partial<NicheAnalysis>>("strategist", user, {
    maxTokens: 1400,
    temperature: 0.5,
  });

  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 12) : [];

  return {
    summary: typeof result.summary === "string" ? result.summary : "",
    audience: arr(result.audience),
    trends: arr(result.trends),
    competitors: arr(result.competitors),
    opportunities: arr(result.opportunities),
    contentAngles: arr(result.contentAngles),
    risks: arr(result.risks),
    requiresAvatar: Boolean(result.requiresAvatar),
    avatarNotes: typeof result.avatarNotes === "string" ? result.avatarNotes : "",
    dos: arr(result.dos),
    donts: arr(result.donts),
    verdict: typeof result.verdict === "string" ? result.verdict : "",
  };
}
