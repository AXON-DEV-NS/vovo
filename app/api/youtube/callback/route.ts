import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import {
  exchangeYouTubeCode,
  fetchMyChannel,
  encryptTokens,
  ensureDbUser,
} from "@/lib/youtube/oauth";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/services/audit";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function redirectTo(path: string) {
  return NextResponse.redirect(new URL(path, SITE));
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return redirectTo("/login?mode=signin");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = (await cookies()).get("yt_oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return redirectTo("/onboarding?youtube=invalid_state");
  }

  if (!process.env.DATABASE_URL) {
    return redirectTo("/onboarding?youtube=db_not_configured");
  }

  try {
    const tokens = await exchangeYouTubeCode(code);
    const channel = await fetchMyChannel(tokens.accessToken);

    if (!channel) {
      return redirectTo("/onboarding?youtube=no_channel");
    }

    const userId = await ensureDbUser(session.email, session.name);
    if (!userId) {
      return redirectTo("/onboarding?youtube=failed");
    }
    const encrypted = encryptTokens(tokens);

    await prisma.channel.upsert({
      where: { userId_youtubeId: { userId, youtubeId: channel.youtubeId } },
      update: {
        title: channel.title,
        thumbnailUrl: channel.thumbnailUrl,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        accessToken: encrypted.accessToken,
        refreshToken: encrypted.refreshToken ?? undefined,
        tokenExpiresAt: encrypted.tokenExpiresAt,
      },
      create: {
        userId,
        youtubeId: channel.youtubeId,
        title: channel.title,
        thumbnailUrl: channel.thumbnailUrl,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        accessToken: encrypted.accessToken,
        refreshToken: encrypted.refreshToken,
        tokenExpiresAt: encrypted.tokenExpiresAt,
      },
    });

    await writeAuditLog({
      action: "youtube.channel_connected",
      actorId: session.email,
      targetUserId: userId,
      metadata: { youtubeId: channel.youtubeId, title: channel.title },
    }).catch(() => {});

    const response = redirectTo("/onboarding?youtube=connected");
    response.cookies.delete("yt_oauth_state");
    return response;
  } catch (err) {
    console.error("[youtube/callback]", err);
    return redirectTo("/onboarding?youtube=failed");
  }
}
