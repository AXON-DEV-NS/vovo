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
    "No hate, threats, harassment, or targeted harm.",
    "No shocking violence, dangerous content, or illegal activities.",
    "No child exploitation or content that endangers minors.",
    "No disallowed or exploitative sexual content.",
    "No scams, deceptive practices, or spam.",
    "No serious misinformation and no tampering with YouTube systems.",
  ],
  copyright: [
    "Only owned or licensed content may be uploaded.",
    "Re-uploading other people's content (movies, series, music, TikTok, Reels, videos) is prohibited.",
    "Crediting the source does not grant permission, and 'no copyright intended' does not protect you.",
    "Fair use is not automatic and is subject to the law.",
  ],
  reusedContent: [
    "Avoid reusing others' content or compilations without original additions.",
    "YouTube expects meaningful original value for monetization.",
  ],
  aiContent: [
    "AI content is not automatically banned from monetization.",
    "Mass-producing near-identical videos, templates with minimal variation, or automated scripts with no original value is prohibited.",
    "What's required: original ideas and scripts, real narration/analysis/teaching/entertainment, original characters and creative direction, and each video genuinely different.",
  ],
  alteredContent: [
    "Disclose realistic altered/synthetic content when required.",
    "No impersonating real people or misleadingly depicting real events with AI.",
  ],
  advertiserFriendly: [
    "Avoid: excessive profanity, sex, shocking violence, disturbing content, dangerous acts, drugs, sensitive topics.",
    "Titles and thumbnails must be accurate and not misleading.",
  ],
  metadata: [
    "No misleading thumbnails, fake celebrity images, false claims, or clickbait the video doesn't deliver.",
    "Title, description, and tags must accurately reflect the actual video.",
  ],
  music: [
    "Music must be self-created, licensed for commercial use, or from YouTube's licensed sources.",
    "TikTok/Instagram/YouTube music should not be assumed free for commercial use.",
  ],
  madeForKids: [
    "Accurately mark 'made for kids' when required.",
    "No content that exploits or misleadingly targets children.",
  ],
  fakeEngagement: [
    "Buying subscribers/views/likes or using bots or automated visits is prohibited.",
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
    `Mandatory YouTube rules:\n${rulesBlock()}`,
    "",
    "Review the following content carefully and decide:",
    `Title: ${input.title}`,
    input.description ? `Description: ${input.description}` : "",
    input.tags?.length ? `Tags: ${input.tags.join(", ")}` : "",
    input.thumbnailPrompt ? `Thumbnail description: ${input.thumbnailPrompt}` : "",
    input.visualPrompts?.length
      ? `Visual scene prompts:\n${input.visualPrompts.map((p) => `- ${p}`).join("\n")}`
      : "",
    input.musicNote ? `Music: ${input.musicNote}` : "",
    input.scriptText ? `Script:\n${input.scriptText.slice(0, 4000)}` : "",
    "",
    `Output JSON only in this shape: ${COMPLIANCE_SHAPE}`,
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
