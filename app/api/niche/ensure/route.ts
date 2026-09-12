import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getNicheKnowledge,
  getOrCreateNiche,
  isKnowledgeBaseConfigured,
  KnowledgeBaseUnavailableError,
} from "@/lib/niche/service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const niche = typeof body.niche === "string" ? body.niche : "";
    const description =
      typeof body.description === "string" ? body.description : undefined;
    const channelId = typeof body.channelId === "string" ? body.channelId : undefined;
    const referenceVideoUrl = typeof body.referenceVideoUrl === "string" ? body.referenceVideoUrl.trim() : undefined;
    const referenceChannelUrl = typeof body.referenceChannelUrl === "string" ? body.referenceChannelUrl.trim() : undefined;

    if (!niche) {
      return NextResponse.json(
        { ok: false, error: "A niche is required." },
        { status: 400 }
      );
    }

    const fullDescription = [
      description,
      referenceVideoUrl ? `[Reference Video]: ${referenceVideoUrl}` : null,
      referenceChannelUrl ? `[Competitor Channel]: ${referenceChannelUrl}` : null,
    ].filter(Boolean).join("\n");

    const { niche: record, isNew } = await getOrCreateNiche(niche, fullDescription || undefined);

    let linked = false;
    if (channelId && isKnowledgeBaseConfigured()) {
      const { linkChannelToNiche } = await import("@/lib/niche/service");
      linked = Boolean(await linkChannelToNiche(channelId, niche));
    }

    const knowledge = await getNicheKnowledge(niche);

    return NextResponse.json({
      ok: true,
      isNew,
      linked,
      niche: { id: record.id, name: record.name },
      knowledge,
    });
  } catch (error) {
    if (error instanceof KnowledgeBaseUnavailableError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: "db_not_configured" },
        { status: 503 }
      );
    }
    console.error("[api/niche/ensure]", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong creating the niche." },
      { status: 500 }
    );
  }
}
