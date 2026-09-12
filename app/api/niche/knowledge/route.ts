import { NextRequest, NextResponse } from "next/server";
import {
  getNicheKnowledge,
  KnowledgeBaseUnavailableError,
} from "@/lib/niche/service";

/**
 * The reference payload the AI reads before generating content for a
 * channel — everything learned for that niche so far.
 */
export async function GET(request: NextRequest) {
  const niche = request.nextUrl.searchParams.get("niche");

  if (!niche) {
    return NextResponse.json(
      { ok: false, error: "?niche= is required." },
      { status: 400 }
    );
  }

  try {
    const knowledge = await getNicheKnowledge(niche);
    if (!knowledge) {
      return NextResponse.json(
        { ok: false, error: "No knowledge base for this niche yet." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, knowledge });
  } catch (error) {
    if (error instanceof KnowledgeBaseUnavailableError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: "db_not_configured" },
        { status: 503 }
      );
    }
    console.error("[api/niche/knowledge]", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong loading the knowledge base." },
      { status: 500 }
    );
  }
}
