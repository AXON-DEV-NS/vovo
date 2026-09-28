import { NextRequest, NextResponse } from "next/server";
import { createMagicLinkToken, sendMagicLinkEmail } from "@/lib/auth/providers/magic-link";
import { checkRateLimit } from "@/lib/security/guardian";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    // Shared (Redis-backed in production) rate limiting, per email + per IP.
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    const [emailRate, ipRate] = await Promise.all([
      checkRateLimit(`magic_request_${String(email).trim().toLowerCase()}`, 3, 60000),
      checkRateLimit(`magic_request_ip_${ip}`, 10, 60000),
    ]);
    if (!emailRate.allowed || !ipRate.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before trying again." },
        { status: 429 }
      );
    }

    const token = await createMagicLinkToken(email);
    const sent = await sendMagicLinkEmail(email, token);
    if (!sent) {
      return NextResponse.json(
        { error: "The sign-in email could not be sent right now. Please try the verification code instead." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
