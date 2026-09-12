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
  const language = input.language === "en" ? "English" : "Arabic";

  const user = [
    `النيتش: ${input.niche}`,
    input.description ? `وصف العميل للمحتوى: ${input.description}` : "",
    input.audience ? `الجمهور المستهدف: ${input.audience}` : "",
    input.referenceVideoUrl ? `فيديو مرجعي (نفس نوع المحتوى): ${input.referenceVideoUrl}` : "",
    input.referenceChannelUrl ? `قناة منافسة تعمل في نفس المحتوى: ${input.referenceChannelUrl}` : "",
    input.webContext
      ? `نتائج بحث حديثة من الويب (استخدمها لتدعيم التحليل):\n${input.webContext}`
      : "",
    "",
    "حلّل السوق والجمهور والتريندات والمنافسين لهذا النيتش قبل إنتاج أي فيديو.",
    "أجب بالعربية في الحقول النصية.",
    "حدد بوضوح هل يحتاج المحتوى شخصية/أفاتار ثابتة في كل الفيديوهات (requiresAvatar).",
    "إن كان يحتاج أفاتارًا فاذكر في avatarNotes مواصفات صورة مرجعية مطلوبة من العميل",
    "(Character Turnaround Sheet: أمام، خلف، جانبان، تعبيرات، تفاصيل ملابس).",
    "إن لم تتوفر بيانات كافية عن المنافسين أو التريندات فاذكر ذلك بصراحة في verdict.",
    `أخرج JSON فقط بهذا الشكل: ${ANALYSIS_SHAPE}`,
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
