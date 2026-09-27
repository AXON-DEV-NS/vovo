import { NextRequest, NextResponse } from "next/server";
import { createMagicLinkToken, sendMagicLinkEmail } from "@/lib/auth/providers/magic-link";

const rateLimitMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const now = Date.now();
    const lastRequest = rateLimitMap.get(email);
    if (lastRequest && now - lastRequest < 60000) {
      return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
    }
    rateLimitMap.set(email, now);

    const token = await createMagicLinkToken(email);
    await sendMagicLinkEmail(email, token);

    console.log(`[Auth] Magic link requested for ${email}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
