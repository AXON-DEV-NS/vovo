import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { analyzeNiche } from "@/lib/niche/analysis";
import { normalizeNicheName } from "@/lib/niche/service";
import { prisma } from "@/lib/db/prisma";

/**
 * Onboarding market analysis: the strategist persona studies the niche,
 * audience, trends, and competitors, then stores the result in the shared
 * niche memory (best practices / things to avoid) for every future video.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const niche = typeof body.niche === "string" ? body.niche.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const referenceVideoUrl =
    typeof body.referenceVideoUrl === "string" ? body.referenceVideoUrl.trim() : "";
  const referenceChannelUrl =
    typeof body.referenceChannelUrl === "string" ? body.referenceChannelUrl.trim() : "";
  const audience = typeof body.audience === "string" ? body.audience.trim() : "";

  if (!niche) {
    return NextResponse.json({ error: "A niche is required." }, { status: 400 });
  }

  try {
    // Live web search first (Tavily → Serper → graceful degradation).
    let webContext: string | undefined;
    try {
      const { webSearch, formatSearchContext } = await import("@/lib/services/search-service");
      const search = await webSearch(
        `${niche} youtube content trends audience competitors 2026`,
        { maxResults: 5 }
      );
      if (search.results.length > 0) {
        webContext = formatSearchContext(search.results, 5);
      }
    } catch (err) {
      console.warn("[niche/analyze] web search unavailable:", err);
    }

    const analysis = await analyzeNiche({
      niche,
      description: description || undefined,
      referenceVideoUrl: referenceVideoUrl || undefined,
      referenceChannelUrl: referenceChannelUrl || undefined,
      audience: audience || undefined,
      webContext,
    });

    let saved = false;
    if (process.env.DATABASE_URL) {
      try {
        const key = normalizeNicheName(niche);
        const payload = JSON.parse(JSON.stringify(analysis));

        const record = await prisma.niche.upsert({
          where: { name: key },
          update: {
            ...(description ? { description } : {}),
            analysis: payload,
          },
          create: {
            name: key,
            description: description || null,
            analysis: payload,
          },
        });

        for (const d of analysis.dos.slice(0, 8)) {
          await prisma.bestPractice
            .create({
              data: {
                nicheId: record.id,
                title: d.slice(0, 180),
                description: d,
                source: "ai market analysis",
              },
            })
            .catch(() => {});
        }
        for (const d of analysis.donts.slice(0, 8)) {
          await prisma.thingToAvoid
            .create({
              data: {
                nicheId: record.id,
                title: d.slice(0, 180),
                description: d,
                source: "ai market analysis",
              },
            })
            .catch(() => {});
        }

        saved = true;
      } catch (err) {
        console.warn("[niche/analyze] failed to persist analysis:", err);
      }
    }

    return NextResponse.json({ ok: true, saved, analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "DEEPSEEK_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "AI brain is not configured.", code: "AI_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    if (message.startsWith("DEEPSEEK_") || message.startsWith("AGENT_")) {
      console.error("[niche/analyze]", message);
      return NextResponse.json(
        { error: "AI analysis failed. Please try again.", code: "AI_FAILED" },
        { status: 502 }
      );
    }
    console.error("[niche/analyze]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
