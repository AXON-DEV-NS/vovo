import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/guardian";
import { notifyContactSubmission } from "@/lib/email/notifier";

export async function POST(request: NextRequest) {
  try {
    // Basic anti-abuse rate limit per IP (5 messages / minute).
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    const rate = await checkRateLimit(`contact_${ip}`, 5, 60000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message, website } = body;

    // Honeypot: silently accept bot fills with a generic "success".
    if (website) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    await notifyContactSubmission({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: subject ? String(subject).trim() : undefined,
      message: String(message).trim(),
      ipAddress: ip,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
