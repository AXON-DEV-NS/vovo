import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getGoogleUserInfo } from "@/lib/auth/providers/google";
import { createSession } from "@/lib/auth/session";
import { resolveUserRole } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  if (state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getGoogleUserInfo(tokens.access_token);

    // Role comes from the database — the owner's account is ADMIN there.
    const role = await resolveUserRole(userInfo.email, "USER");

    await createSession({
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      role,
    });

    // Persist a real user row so the admin panel reflects actual signups.
    const { ensureDbUser } = await import("@/lib/auth/db-user");
    await ensureDbUser(userInfo.email, userInfo.name);

    const response = NextResponse.redirect(new URL("/onboarding", request.url));
    response.cookies.delete("oauth_state");
    return response;
  } catch (error) {
    console.error("[Auth] Google callback error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }
}
