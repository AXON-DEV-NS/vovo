import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getYouTubeAuthUrl, isYouTubeOAuthConfigured } from "@/lib/youtube/oauth";

/**
 * Starts the YouTube channel connection flow (offline access).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(
      new URL("/login?mode=signin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    );
  }

  if (!(await isYouTubeOAuthConfigured())) {
    return NextResponse.redirect(
      new URL("/onboarding?youtube=not_configured", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    );
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const store = await cookies();
  store.set("yt_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const url = await getYouTubeAuthUrl(state);
  return NextResponse.redirect(url);
}
