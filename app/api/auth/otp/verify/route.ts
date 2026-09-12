import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeOtp } from "@/lib/auth/otp-store";
import { createSession } from "@/lib/auth/session";
import { resolveUserRole } from "@/lib/auth/roles";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : email.split("@")[0];

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const verification = await verifyAndConsumeOtp(email, code);
    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error || "Invalid verification code." },
        { status: 400 }
      );
    }

    // Role comes from the database only — no email-based admin promotion here.
    // The owner signs in to the admin panel with password + TOTP.
    const role = await resolveUserRole(email, "USER");

    const userId = Buffer.from(email).toString("base64url");

    await createSession({
      userId,
      email,
      name: name || email.split("@")[0],
      role,
    });

    // Persist a real user row so the admin panel reflects actual signups.
    const { ensureDbUser } = await import("@/lib/auth/db-user");
    await ensureDbUser(email, name || undefined);

    return NextResponse.json({
      success: true,
      redirect: role === "ADMIN" ? "/vovo-hq-secure-gateway" : "/onboarding",
    });
  } catch (error) {
    console.error("[OTP Verify Error]", error);
    return NextResponse.json(
      { error: "Failed to verify code. Please try again." },
      { status: 500 }
    );
  }
}
