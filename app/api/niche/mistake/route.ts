import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  KnowledgeBaseUnavailableError,
  logMistake,
} from "@/lib/niche/service";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));

    const nicheName = typeof body.niche === "string" ? body.niche : "";
    const channelId = typeof body.channelId === "string" ? body.channelId : undefined;
    const title = typeof body.title === "string" ? body.title : "";
    const description = typeof body.description === "string" ? body.description : "";
    const correction = typeof body.correction === "string" ? body.correction : "";

    if (!nicheName || !title || !description || !correction) {
      return NextResponse.json(
        { ok: false, error: "niche, title, description and correction are required." },
        { status: 400 }
      );
    }

    let verifiedChannelId: string | undefined = undefined;
    if (channelId) {
      const { prisma } = await import("@/lib/db/prisma");
      const channel = await prisma.channel.findFirst({
        where: { id: channelId, userId: session.userId },
        select: { id: true },
      });
      if (!channel) {
        return NextResponse.json(
          { ok: false, error: "Channel not found or unauthorized." },
          { status: 404 }
        );
      }
      verifiedChannelId = channel.id;
    }

    const mistake = await logMistake({
      nicheName,
      channelId: verifiedChannelId,
      title,
      description,
      correction,
    });

    return NextResponse.json({ ok: true, mistakeId: mistake.id });
  } catch (error) {
    if (error instanceof KnowledgeBaseUnavailableError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: "db_not_configured" },
        { status: 503 }
      );
    }
    console.error("[api/niche/mistake]", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong logging the mistake." },
      { status: 500 }
    );
  }
}
