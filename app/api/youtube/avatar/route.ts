import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/**
 * Saves the Character Turnaround Sheet (avatar reference images) for a channel.
 * Accepts image URLs (front / back / sides / expressions) that keep the
 * character consistent across every generated video.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database is not configured.", code: "DB_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const channelId = typeof body.channelId === "string" ? body.channelId : "";
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u: unknown): u is string => typeof u === "string" && u.startsWith("http")).slice(0, 8)
    : [];
  const requiresAvatar = Boolean(body.requiresAvatar);

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  }
  if (requiresAvatar && imageUrls.length === 0) {
    return NextResponse.json(
      { error: "At least one reference image URL is required." },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.email.trim().toLowerCase() },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, userId: user.id },
      select: { id: true },
    });
    if (!channel) return NextResponse.json({ error: "Channel not found." }, { status: 404 });

    const updated = await prisma.channel.update({
      where: { id: channel.id },
      data: { avatarSheetUrls: imageUrls, requiresAvatar },
      select: { id: true, requiresAvatar: true, avatarSheetUrls: true },
    });

    return NextResponse.json({ ok: true, channel: updated });
  } catch (err) {
    console.error("[youtube/avatar]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
