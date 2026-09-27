import { prisma } from "@/lib/db/prisma";
import type { NicheMemory } from "@/lib/ai-providers/deepseek";

const EMPTY_MEMORY: NicheMemory = {
  positivePatterns: [],
  negativePitfalls: [],
  webInsights: [],
};

/**
 * Loads the shared niche memory (what works / what to avoid / logged mistakes)
 * in the compact shape the DeepSeek prompt expects.
 *
 * Returns an empty memory when the knowledge base is not configured, so the
 * brain still works without a database.
 */
export async function loadNicheMemory(nicheName: string): Promise<NicheMemory> {
  if (!process.env.DATABASE_URL) return EMPTY_MEMORY;

  const key = (nicheName || "").trim().toLowerCase().replace(/\s+/g, "-");
  if (!key) return EMPTY_MEMORY;

  try {
    const niche = await prisma.niche.findUnique({
      where: { name: key },
      include: {
        bestPractices: { orderBy: { discoveredAt: "desc" }, take: 10 },
        thingsToAvoid: { orderBy: { discoveredAt: "desc" }, take: 10 },
        mistakeLogs: { orderBy: { occurredAt: "desc" }, take: 5 },
      },
    });
    if (!niche) return EMPTY_MEMORY;

    const positivePatterns = niche.bestPractices.map((b) => `${b.title}: ${b.description}`);

    const webInsights = niche.bestPractices
      .filter((b) => {
        const src = (b.source || "").toLowerCase();
        return src.includes("daily") || src.includes("web") || src.includes("http");
      })
      .map((b) => `${b.title}: ${b.description}`);

    const negativePitfalls = [
      ...niche.thingsToAvoid.map((t) => `${t.title}: ${t.description}`),
      ...niche.mistakeLogs.map((m) => `${m.title} → ${m.correction}`),
    ];

    return { positivePatterns, negativePitfalls, webInsights };
  } catch (err) {
    console.warn("[NicheMemory] Failed to load memory:", err);
    return EMPTY_MEMORY;
  }
}
