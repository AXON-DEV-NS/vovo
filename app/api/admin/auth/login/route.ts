import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth/admin-session";
import { checkRateLimit, recordAuthAttempt, isAccountLocked } from "@/lib/security/guardian";
import { writeAuditLog } from "@/lib/services/audit";
import { verifyPassword } from "@/lib/admin/password";
import { verifyTotp } from "@/lib/admin/totp";

/**
 * Owner-only admin login: strong password + TOTP 2FA.
 * There is no public path that grants the admin role — the single
 * owner account is configured via environment and (for the normal
 * sign-in flow) promoted directly in the database.
 */
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const email = (process.env.ADMIN_EMAIL || "oren.on.oren.25@gmail.com").trim().toLowerCase();

  // 1. Rate limiting
  const rateLimit = await checkRateLimit(`admin_login_${ipAddress}`, 5, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 1 minute." },
      { status: 429 }
    );
  }

  // 2. Lockout after repeated failures
  const lockout = isAccountLocked(email);
  if (lockout.locked) {
    return NextResponse.json(
      {
        error: `Account temporarily locked due to failed attempts. Try again in ${lockout.remainingSeconds}s.`,
      },
      { status: 423 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const totpSecret = process.env.ADMIN_TOTP_SECRET;

  if (!passwordHash || !totpSecret) {
    console.warn(
      "[admin-login] ADMIN_PASSWORD_HASH / ADMIN_TOTP_SECRET not configured — run `node scripts/setup-admin.mjs <password>`."
    );
    return NextResponse.json(
      { error: "Owner access is not configured." },
      { status: 403 }
    );
  }

  const passwordOk = verifyPassword(password, passwordHash);
  const totpOk = verifyTotp(totpSecret, code);

  if (!passwordOk || !totpOk) {
    try {
      await recordAuthAttempt({ email, ipAddress, userAgent, success: false });
      await writeAuditLog({
        action: "admin.login.failed",
        actorId: email,
        actorRole: "admin",
        ipAddress,
        metadata: { reason: passwordOk ? "bad_2fa_code" : "bad_password" },
      });
    } catch (error) {
      console.warn("[admin-login] failed-attempt logging error:", error);
    }

    // Deliberately identical response whether password or code was wrong.
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  try {
    await recordAuthAttempt({ email, ipAddress, userAgent, success: true });

    await createAdminSession({
      userId: "admin-owner",
      email,
      name: "Owner",
    });

    await writeAuditLog({
      action: "admin.login",
      actorId: email,
      actorRole: "admin",
      ipAddress,
      metadata: { email, method: "password+2fa" },
    });
  } catch (error) {
    console.error("[Admin Login Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  console.log(`[admin-login] SUCCESS from ${ipAddress}`);
  return NextResponse.json({
    success: true,
    redirect: "/vovo-hq-secure-gateway/overview",
  });
}
