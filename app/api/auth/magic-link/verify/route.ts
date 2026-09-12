import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkToken } from "@/lib/auth/providers/magic-link";
import { createSession } from "@/lib/auth/session";
import { resolveUserRole } from "@/lib/auth/roles";
import { isTokenUsed, markTokenUsed } from "@/lib/auth/token-store";
import { checkRateLimit } from "@/lib/security/guardian";

export async function GET(request: NextRequest) {
  // Rate limit token verification attempts to mitigate brute-force/CSRF probing.
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = await checkRateLimit(`magic_verify_${ip}`, 10, 60000);
  if (!rate.allowed) {
    return NextResponse.redirect(new URL("/login?error=rate_limited", request.url));
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  const payload = await verifyMagicLinkToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login?error=expired_token", request.url));
  }

  // Single-use enforcement: a used token can never verify again.
  if (payload.jti) {
    if (await isTokenUsed(payload.jti)) {
      return NextResponse.redirect(new URL("/login?error=link_used", request.url));
    }
    await markTokenUsed(payload.jti);
  }

  const userId = Buffer.from(payload.email).toString("base64url");

  // Role comes from the database — the owner's account is ADMIN there.
  const role = await resolveUserRole(payload.email, "USER");

  await createSession({
    userId,
    email: payload.email,
    name: payload.email.split("@")[0],
    role,
  });

  // Persist a real user row so the admin panel reflects actual signups.
  const { ensureDbUser } = await import("@/lib/auth/db-user");
  await ensureDbUser(payload.email);

  return NextResponse.redirect(new URL("/onboarding", request.url));
}
