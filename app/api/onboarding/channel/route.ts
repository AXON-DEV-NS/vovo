import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const YOUTUBE_URL = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/i;
const MAX_URL = 500;

/**
 * Saves per-channel onboarding choices: reference links, audience markets,
 * and whether the content requires a presenter avatar.
 * The channel must belong to the signed-in user.
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const channelId = typeof body.channelId === "string" ? body.channelId : "";
  if (!channelId) {
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: session.userId }, { email: session.email.trim().toLowerCase() }],
    },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, userId: user.id },
    select: { id: true },
  });
  if (!channel) {
    return NextResponse.json(
      { error: "Channel not found or does not belong to your account." },
      { status: 404 }
    );
  }

  const data: {
    referenceChannelUrl?: string;
    referenceVideoUrl?: string;
    markets?: string[];
    requiresAvatar?: boolean;
  } = {};

  if (typeof body.referenceChannelUrl === "string") {
    const url = body.referenceChannelUrl.trim();
    if (url.length > MAX_URL) {
      return NextResponse.json({ error: "Reference channel link is too long." }, { status: 400 });
    }
    if (url && !YOUTUBE_URL.test(url)) {
      return NextResponse.json(
        { error: "Reference channel must be a youtube.com link." },
        { status: 400 }
      );
    }
    data.referenceChannelUrl = url || undefined;
  }

  if (typeof body.referenceVideoUrl === "string") {
    const url = body.referenceVideoUrl.trim();
    if (url.length > MAX_URL) {
      return NextResponse.json({ error: "Reference video link is too long." }, { status: 400 });
    }
    if (url && !YOUTUBE_URL.test(url)) {
      return NextResponse.json(
        { error: "Reference video must be a youtube.com link." },
        { status: 400 }
      );
    }
    data.referenceVideoUrl = url || undefined;
  }

  if (Array.isArray(body.markets)) {
    const allowed = ["en", "ar"];
    const markets = body.markets
      .filter((m: unknown): m is string => typeof m === "string" && allowed.includes(m));
    if (markets.length === 0) {
      return NextResponse.json({ error: "Choose at least one audience." }, { status: 400 });
    }
    data.markets = markets;
  }

  if (typeof body.requiresAvatar === "boolean") {
    data.requiresAvatar = body.requiresAvatar;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.channel.update({
    where: { id: channel.id },
    data,
    select: {
      id: true,
      referenceChannelUrl: true,
      referenceVideoUrl: true,
      markets: true,
      requiresAvatar: true,
    },
  });

  return NextResponse.json({ ok: true, channel: updated });
}
