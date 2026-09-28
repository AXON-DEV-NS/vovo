/**
 * scheduling/planner.ts — Real publishing-plan builder.
 *
 * Combines three genuinely-available signals:
 * 1. Audience activity by day-of-week — the channel's own YouTube Analytics
 *    views for the last 28 days (when the Analytics connection is available).
 * 2. Audience prime-time hours — derived from the audience choice saved during
 *    onboarding (Arabic / international / both), documented as a policy.
 * 3. Competition — the real publish times (UTC weekday × hour) of recent
 *    videos in the same niche, fetched from the YouTube Data API.
 *
 * Nothing here is randomly generated: when a signal is unavailable the plan
 * says so explicitly instead of inventing numbers.
 */

import { getAnalyticsProvider, type AnalyticsChannelRow } from "@/lib/analytics/data-layer";
import { prisma } from "@/lib/db/prisma";
import {
  getRecentUploadDistribution,
  isYouTubeDataConfigured,
} from "@/lib/youtube/data-api";

export interface PlannedSlot {
  dateISO: string;
  weekday: number;
  weekdayLabel: string;
  hourUTC: number;
  audienceScore: number;
  competitionScore: number;
  score: number;
  reason: string;
}

export interface PublishingPlan {
  channelId: string;
  channelTitle: string;
  generatedAt: string;
  audience: "ar" | "en" | "both";
  trendsAvailable: boolean;
  competitionAvailable: boolean;
  sampleSize: number;
  bestDays: { weekday: number; label: string; avgViews: number | null }[];
  primeHoursUTC: number[];
  notes: string[];
  slots: PlannedSlot[];
}

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const PLAN_TTL_MS = 6 * 60 * 60 * 1000;

/** Documented audience windows (UTC) — Arabic prime time vs international. */
function primeHoursFor(audience: "ar" | "en" | "both"): number[] {
  if (audience === "ar") return [17, 18, 19, 20]; // ~20:00–23:00 in the Gulf (UTC+3)
  if (audience === "both") return [15, 16, 17, 18, 19, 20];
  return [15, 16, 17, 18]; // late afternoon / early evening UTC
}

export async function buildPublishingPlan(
  channel: AnalyticsChannelRow & { markets: string[]; niche: string | null },
  options?: { horizonDays?: number; slotsPerWeek?: number }
): Promise<PublishingPlan> {
  const horizonDays = options?.horizonDays ?? 14;
  const slotsPerWeek = options?.slotsPerWeek ?? 3;

  const markets = channel.markets ?? [];
  const audience: "ar" | "en" | "both" =
    markets.includes("ar") && markets.includes("en")
      ? "both"
      : markets.includes("ar")
        ? "ar"
        : "en";
  const primeHoursUTC = primeHoursFor(audience);
  const notes: string[] = [];

  // ── 1) Real audience activity by weekday (last 28 days of real views) ──
  let avgByWeekday = Array.from({ length: 7 }, () => 0);
  let trendsAvailable = false;
  if (channel.accessToken) {
    try {
      const provider = getAnalyticsProvider();
      const to = new Date();
      const from = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
      const analytics = await provider.getChannelAnalytics({ channel, from, to });
      if (analytics.trendsAvailable && analytics.views.length > 0) {
        const sums = Array.from({ length: 7 }, () => 0);
        const counts = Array.from({ length: 7 }, () => 0);
        for (const point of analytics.views) {
          const day = new Date(`${point.date}T00:00:00Z`).getUTCDay();
          sums[day] += point.value;
          counts[day] += 1;
        }
        avgByWeekday = sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
        trendsAvailable = true;
        notes.push(
          "Preferred days come from your channel's real view activity over the last 28 days."
        );
      }
    } catch {
      // Analytics unavailable — handled below
    }
  }
  if (!trendsAvailable) {
    notes.push(
      "Day-of-week preference will become personalized once YouTube Analytics data arrives; days are currently weighted evenly."
    );
  }

  notes.push(
    audience === "ar"
      ? "Publishing hours target Arabic-speaking prime time (approx. 20:00–23:00 Gulf time)."
      : audience === "both"
        ? "Publishing hours cover both Arabic prime time and international evening windows."
        : "Publishing hours target the international evening window (afternoon/evening UTC)."
  );

  // ── 2) Real competition signal: recent upload times in the niche ──
  let competitionCounts: number[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  let competitionAvailable = false;
  let sampleSize = 0;
  const competitionQuery = `${channel.niche || channel.title} youtube`;
  if (isYouTubeDataConfigured()) {
    try {
      const dist = await getRecentUploadDistribution(competitionQuery);
      if (dist.total > 0) {
        competitionCounts = dist.counts;
        competitionAvailable = true;
        sampleSize = dist.total;
        notes.push(
          `Competition: measured from ${dist.total} real videos published in your niche over the last 30 days — slots with fewer uploads are preferred.`
        );
      }
    } catch {
      // competition signal is best-effort
    }
  }
  if (!competitionAvailable) {
    notes.push(
      "Competition data is currently unavailable — slots are chosen from audience activity only."
    );
  }

  // ── 3) Score every candidate (weekday × prime hour) ──
  const maxViews = Math.max(...avgByWeekday, 1);
  let maxCompetition = 0;
  for (const row of competitionCounts) {
    for (const cell of row) maxCompetition = Math.max(maxCompetition, cell);
  }
  maxCompetition = Math.max(maxCompetition, 1);

  interface Candidate {
    weekday: number;
    hour: number;
    audienceScore: number;
    competitionScore: number;
    score: number;
  }
  const candidates: Candidate[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (const hour of primeHoursUTC) {
      const audienceScore = trendsAvailable
        ? avgByWeekday[weekday] / maxViews
        : 1;
      const competitionScore = competitionAvailable
        ? competitionCounts[weekday][hour] / maxCompetition
        : 0;
      // Favor times the audience is active (and prime hours), penalize crowded slots.
      const score = audienceScore * 0.62 - competitionScore * 0.38;
      candidates.push({ weekday, hour, audienceScore, competitionScore, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  // Pick up to `slotsPerWeek` distinct weekdays, best score first.
  const chosen: Candidate[] = [];
  const usedDays = new Set<number>();
  for (const c of candidates) {
    if (chosen.length >= slotsPerWeek) break;
    if (usedDays.has(c.weekday)) continue;
    usedDays.add(c.weekday);
    chosen.push(c);
  }
  chosen.sort((a, b) => a.weekday - b.weekday);

  // ── 4) Materialize slots for the horizon ──
  const now = Date.now();
  const slots: PlannedSlot[] = [];
  for (let offset = 0; offset < horizonDays; offset++) {
    const day = new Date(now + offset * 24 * 60 * 60 * 1000);
    const weekday = day.getUTCDay();
    const slot = chosen.find((c) => c.weekday === weekday);
    if (!slot) continue;

    const date = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), slot.hour, 0, 0)
    );
    if (date.getTime() <= now) continue;

    const reasons: string[] = [];
    if (trendsAvailable) {
      reasons.push(`your audience is most active on ${DAY_LABELS[weekday]}s`);
    }
    if (competitionAvailable) {
      reasons.push(`fewer niche uploads around ${String(slot.hour).padStart(2, "0")}:00 UTC`);
    }
    if (reasons.length === 0) {
      reasons.push("audience prime-time window");
    }

    slots.push({
      dateISO: date.toISOString(),
      weekday,
      weekdayLabel: DAY_LABELS[weekday],
      hourUTC: slot.hour,
      audienceScore: Number(slot.audienceScore.toFixed(3)),
      competitionScore: Number(slot.competitionScore.toFixed(3)),
      score: Number(slot.score.toFixed(3)),
      reason: reasons.join(" · "),
    });
  }

  return {
    channelId: channel.id,
    channelTitle: channel.title,
    generatedAt: new Date().toISOString(),
    audience,
    trendsAvailable,
    competitionAvailable,
    sampleSize,
    bestDays: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      label: DAY_LABELS[weekday],
      avgViews: trendsAvailable ? Math.round(avgByWeekday[weekday]) : null,
    }))
      .sort((a, b) => (b.avgViews ?? 0) - (a.avgViews ?? 0))
      .slice(0, 3),
    primeHoursUTC,
    notes,
    slots,
  };
}


/**
 * Cached plan access — shared by the scheduling API and content creation.
 * The plan is cached for 6 hours (per channel + niche + audience).
 */
export async function getOrBuildPlan(channel: {
  id: string;
  title: string;
  youtubeId: string;
  subscriberCount: number;
  videoCount: number;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  markets: string[];
  niche: string | null;
}): Promise<PublishingPlan> {
  const key = `publishing-plan:${channel.id}:${channel.niche ?? "-"}:${(channel.markets ?? []).join("+")}`;

  if (process.env.DATABASE_URL) {
    try {
      const row = await prisma.youTubeCache.findUnique({ where: { key } });
      if (row && row.expiresAt.getTime() > Date.now()) {
        return row.payload as unknown as PublishingPlan;
      }
    } catch {
      // cache read is best-effort
    }
  }

  const plan = await buildPublishingPlan(channel);

  if (process.env.DATABASE_URL) {
    try {
      const payload = JSON.parse(JSON.stringify(plan)) as object;
      const expiresAt = new Date(Date.now() + PLAN_TTL_MS);
      await prisma.youTubeCache.upsert({
        where: { key },
        create: { key, payload, expiresAt },
        update: { payload, expiresAt },
      });
    } catch {
      // cache write is best-effort
    }
  }

  return plan;
}
