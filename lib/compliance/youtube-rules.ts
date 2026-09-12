import { runAgentJson } from "@/lib/ai-providers/agents";

/**
 * Mandatory YouTube compliance gate (policies 2026).
 *
 * Nothing is produced, scheduled, or published before this review passes.
 * The condensed rules below are injected into the compliance agent so every
 * decision is grounded in the actual platform policy.
 */

export const YOUTUBE_RULES = {
  communityGuidelines: [
    "لا كراهية ولا تهديد ولا تحرش ولا إيذاء موجّه.",
    "لا عنف صادم أو محتوى خطير أو أنشطة غير قانونية.",
    "لا استغلال للأطفال أو محتوى يهدد القاصرين.",
    "لا محتوى جنسي مخالف أو استغلالي.",
    "لا احتيال أو تضليل أو رسائل مزعجة.",
    "لا معلومات مضللة جسيمة ولا تلاعب بأنظمة يوتيوب.",
  ],
  copyright: [
    "لا يُرفع إلا محتوى مملوك أو مرخّص.",
    "إعادة رفع محتوى الآخرين (أفلام، مسلسلات، موسيقى، تيك توك، ريلز، فيديوهات) ممنوعة.",
    "الإشارة للمصدر لا تمنح إذنًا، وعبارة 'no copyright intended' لا تحمي.",
    "الاستخدام العادل ليس تلقائيًا ويخضع للقانون.",
  ],
  reusedContent: [
    "تجنّب إعادة استخدام محتوى الآخرين أو التجميعات بلا إضافة أصلية.",
    "يوتيوب يتوقع قيمة أصلية ذات معنى للربح.",
  ],
  aiContent: [
    "محتوى AI ليس ممنوعًا تلقائيًا من الربح.",
    "ممنوع الإنتاج الكمي لفيديوهات شبه متطابقة أو قوالب بأقل تنويع أو سكريبتات آلية بلا قيمة أصلية.",
    "المطلوب: أفكار وسكريبتات أصلية، سرد/تحليل/تعليم/ترفيه حقيقي، شخصيات وتوجيه إبداعي أصلي، وكل فيديو مختلف فعليًا.",
  ],
  alteredContent: [
    "الإفصاح عن المحتوى المعدّل/الاصطناعي الواقعي عند الحاجة.",
    "لا انتحال أشخاص أو أحداث واقعية مضللة بالذكاء الاصطناعي.",
  ],
  advertiserFriendly: [
    "تجنّب: الألفاظ النابية المفرطة، الجنس، العنف الصادم، المحتوى الصادم، الأفعال الخطرة، المخدرات، المواضيع الحساسة.",
    "العناوين والصور المصغرة يجب أن تكون دقيقة وغير مضللة.",
  ],
  metadata: [
    "لا صور مصغرة مضللة أو صور مشاهير مزيفة أو ادعاءات كاذبة أو كليك-بايت لا يقدمه الفيديو.",
    "العنوان والوصف والوسوم تعكس الفيديو الفعلي بدقة.",
  ],
  music: [
    "موسيقى من إنشائك أو مرخّصة بترخيص تجاري أو من مصادر يوتيوب المرخّصة.",
    "لا يُفترض أن موسيقى تيك توك/إنستغرام/يوتيوب مجانية للاستخدام التجاري.",
  ],
  madeForKids: [
    "تحديد 'مخصص للأطفال' بدقة عند الحاجة.",
    "لا محتوى يستغل أو يستهدف الأطفال بشكل مضلل.",
  ],
  fakeEngagement: [
    "ممنوع شراء المشتركين/المشاهدات/الإعجابات أو استخدام البوتات أو الزيارات الآلية.",
  ],
} as const;

function rulesBlock(): string {
  const sections: string[] = [];
  for (const [key, rules] of Object.entries(YOUTUBE_RULES)) {
    sections.push(`${key}:\n${rules.map((r) => `- ${r}`).join("\n")}`);
  }
  return sections.join("\n\n");
}

export interface ComplianceInput {
  title: string;
  description?: string;
  tags?: string[];
  scriptText?: string;
  visualPrompts?: string[];
  thumbnailPrompt?: string;
  musicNote?: string;
}

export interface ComplianceResult {
  decision: "APPROVE" | "REJECT";
  violations: { rule: string; detail: string }[];
  requiredFixes: string[];
}

const COMPLIANCE_SHAPE =
  '{"decision":"APPROVE|REJECT","violations":[{"rule":string,"detail":string}],"requiredFixes":string[]}';

/**
 * Reviews a piece of content against YouTube policy. Returns APPROVE only when
 * there is no policy risk. On failure it lists the exact fixes required.
 */
export async function reviewYouTubeCompliance(
  input: ComplianceInput
): Promise<ComplianceResult> {
  const user = [
    `قواعد يوتيوب الإلزامية:\n${rulesBlock()}`,
    "",
    "راجع المحتوى التالي بدقة وقرر:",
    `العنوان: ${input.title}`,
    input.description ? `الوصف: ${input.description}` : "",
    input.tags?.length ? `الوسوم: ${input.tags.join(", ")}` : "",
    input.thumbnailPrompt ? `وصف الصورة المصغرة: ${input.thumbnailPrompt}` : "",
    input.visualPrompts?.length
      ? `أوامر المشاهد البصرية:\n${input.visualPrompts.map((p) => `- ${p}`).join("\n")}`
      : "",
    input.musicNote ? `الموسيقى: ${input.musicNote}` : "",
    input.scriptText ? `السكريبت:\n${input.scriptText.slice(0, 4000)}` : "",
    "",
    `أخرج JSON فقط بهذا الشكل: ${COMPLIANCE_SHAPE}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await runAgentJson<ComplianceResult>("compliance", user, {
    maxTokens: 900,
    temperature: 0.2,
  });

  const decision = result?.decision === "APPROVE" ? "APPROVE" : "REJECT";
  return {
    decision,
    violations: Array.isArray(result?.violations) ? result.violations.slice(0, 10) : [],
    requiredFixes: Array.isArray(result?.requiredFixes) ? result.requiredFixes.slice(0, 10) : [],
  };
}
