import { NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/auth/providers/google";

export async function GET() {
  if (!(await isGoogleConfigured())) {
    const url = new URL("/login?error=google_not_configured", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    return NextResponse.redirect(url);
  }

  const state = Math.random().toString(36).slice(2);
  const url = await getGoogleAuthUrl(state);
  const response = NextResponse.redirect(url);
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
