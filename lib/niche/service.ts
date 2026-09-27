import { prisma } from "@/lib/db/prisma";
import { getResearchProvider, type ResearchFinding } from "./research";

export class KnowledgeBaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeBaseUnavailableError";
  }
}

export function isKnowledgeBaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function assertConfigured(): void {
  if (!isKnowledgeBaseConfigured()) {
    throw new KnowledgeBaseUnavailableError(
      "DATABASE_URL is not configured — the niche knowledge base requires PostgreSQL."
    );
  }
}

export function normalizeNicheName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

export interface NicheKnowledge {
  id: string;
  name: string;
  description: string | null;
  lastResearchedAt: Date | null;
  bestPractices: {
    id: string;
    title: string;
    description: string;
    source: string | null;
  }[];
  thingsToAvoid: {
    id: string;
    title: string;
    description: string;
    source: string | null;
  }[];
  mistakeLogs: {
    id: string;
    title: string;
    description: string;
    correction: string;
    channelId: string | null;
    occurredAt: Date;
  }[];
}

/**
 * Get an existing niche record for this category, or create it and
 * immediately kick off the initial research pass to populate it.
 * Every channel in the same niche links to the same record.
 */
export async function getOrCreateNiche(name: string, description?: string) {
  assertConfigured();
  const key = normalizeNicheName(name);

  const existing = await prisma.niche.findUnique({ where: { name: key } });
  if (existing) {
    return { niche: existing, isNew: false };
  }

  const created = await prisma.niche.create({
    data: { name: key, description: description ?? null },
  });

  await researchAndUpdateNiche(created.id, "initial");

  return { niche: created, isNew: true };
}

/**
 * Link a channel to its niche's knowledge-base record.
 */
export async function linkChannelToNiche(
  channelId: string,
  nicheName: string
) {
  assertConfigured();
  const key = normalizeNicheName(nicheName);
  const niche = await prisma.niche.findUnique({ where: { name: key } });
  if (!niche) return null;

  return prisma.channel.update({
    where: { id: channelId },
    data: { nicheId: niche.id, niche: key },
  });
}

/**
 * Run the research provider for a niche and merge findings into the
 * knowledge base, skipping anything already recorded (dedup).
 */
export async function researchAndUpdateNiche(
  nicheId: string,
  mode: "initial" | "daily"
) {
  const niche = await prisma.niche.findUniqueOrThrow({ where: { id: nicheId } });
  const provider = getResearchProvider();
  const findings = await provider.research(niche.name, mode);

  let bestPracticesAdded = 0;
  let thingsToAvoidAdded = 0;

  for (const f of findings.bestPractices) {
    if (await addBestPracticeIfNew(nicheId, f)) bestPracticesAdded++;
  }
  for (const f of findings.thingsToAvoid) {
    if (await addThingToAvoidIfNew(nicheId, f)) thingsToAvoidAdded++;
  }

  await prisma.niche.update({
    where: { id: nicheId },
    data: { lastResearchedAt: new Date() },
  });

  return { bestPracticesAdded, thingsToAvoidAdded };
}

async function addBestPracticeIfNew(
  nicheId: string,
  finding: ResearchFinding
): Promise<boolean> {
  const title = normalizeTitle(finding.title);
  const exists = await prisma.bestPractice.findFirst({
    where: { nicheId, title: { equals: title, mode: "insensitive" } },
    select: { id: true },
  });
  if (exists) return false;

  try {
    await prisma.bestPractice.create({
      data: {
        nicheId,
        title,
        description: finding.description,
        source: finding.source,
      },
    });
    return true;
  } catch (error) {
    // Unique-constraint race: another run added the same title first.
    if (isPrismaError(error, "P2002")) return false;
    throw error;
  }
}

async function addThingToAvoidIfNew(
  nicheId: string,
  finding: ResearchFinding
): Promise<boolean> {
  const title = normalizeTitle(finding.title);
  const exists = await prisma.thingToAvoid.findFirst({
    where: { nicheId, title: { equals: title, mode: "insensitive" } },
    select: { id: true },
  });
  if (exists) return false;

  try {
    await prisma.thingToAvoid.create({
      data: {
        nicheId,
        title,
        description: finding.description,
        source: finding.source,
      },
    });
    return true;
  } catch (error) {
    if (isPrismaError(error, "P2002")) return false;
    throw error;
  }
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}

/**
 * Write an AI mistake into the niche's Mistake Log. Knowledge is shared
 * across every channel in the niche, so the same mistake is not repeated
 * on this channel or any other channel in the same niche.
 */
export async function logMistake(input: {
  nicheName: string;
  channelId?: string;
  title: string;
  description: string;
  correction: string;
}) {
  assertConfigured();
  const key = normalizeNicheName(input.nicheName);

  const niche =
    (await prisma.niche.findUnique({ where: { name: key } })) ??
    (await prisma.niche.create({ data: { name: key } }));

  return prisma.mistakeLog.create({
    data: {
      nicheId: niche.id,
      channelId: input.channelId ?? null,
      title: input.title,
      description: input.description,
      correction: input.correction,
    },
  });
}

/**
 * The reference payload the AI reads before generating content for a
 * channel: everything learned for that niche so far.
 */
export async function getNicheKnowledge(
  nicheName: string
): Promise<NicheKnowledge | null> {
  assertConfigured();
  const key = normalizeNicheName(nicheName);

  const niche = await prisma.niche.findUnique({
    where: { name: key },
    include: {
      bestPractices: { orderBy: { discoveredAt: "desc" } },
      thingsToAvoid: { orderBy: { discoveredAt: "desc" } },
      mistakeLogs: { orderBy: { occurredAt: "desc" }, take: 100 },
    },
  });

  if (!niche) return null;

  return {
    id: niche.id,
    name: niche.name,
    description: niche.description,
    lastResearchedAt: niche.lastResearchedAt,
    bestPractices: niche.bestPractices.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      source: b.source,
    })),
    thingsToAvoid: niche.thingsToAvoid.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      source: t.source,
    })),
    mistakeLogs: niche.mistakeLogs.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      correction: m.correction,
      channelId: m.channelId,
      occurredAt: m.occurredAt,
    })),
  };
}

export interface DailyResearchSummary {
  processed: number;
  bestPracticesAdded: number;
  thingsToAvoidAdded: number;
  niches: string[];
}

/**
 * Daily scheduled job: refresh the knowledge base for every active
 * niche (a niche with at least one connected channel).
 */
export async function runDailyResearch(): Promise<DailyResearchSummary> {
  assertConfigured();

  const activeNiches = await prisma.niche.findMany({
    where: { channels: { some: {} } },
    select: { id: true, name: true },
  });

  const summary: DailyResearchSummary = {
    processed: 0,
    bestPracticesAdded: 0,
    thingsToAvoidAdded: 0,
    niches: [],
  };

  for (const niche of activeNiches) {
    const result = await researchAndUpdateNiche(niche.id, "daily");
    summary.processed += 1;
    summary.bestPracticesAdded += result.bestPracticesAdded;
    summary.thingsToAvoidAdded += result.thingsToAvoidAdded;
    summary.niches.push(niche.name);
  }

  return summary;
}
