import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/**
 * Returns the channels connected by the signed-in user (no tokens exposed).
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, channels: [] });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.email.trim().toLowerCase() },
      select: {
        channels: {
          select: {
            id: true,
            youtubeId: true,
            title: true,
            thumbnailUrl: true,
            subscriberCount: true,
            videoCount: true,
            niche: true,
            requiresAvatar: true,
            avatarSheetUrls: true,
            connectedAt: true,
          },
          orderBy: { connectedAt: "asc" },
        },
      },
    });

    return NextResponse.json({ ok: true, channels: user?.channels ?? [] });
  } catch (err) {
    console.error("[youtube/status]", err);
    return NextResponse.json({ ok: true, channels: [] });
  }
}
