import { NextRequest, NextResponse } from "next/server";
import { saveOtp } from "@/lib/auth/otp-store";
import { sendNotificationEmail } from "@/lib/email/notifier";
import { prisma } from "@/lib/db/prisma";
import { getUserRecord } from "@/lib/admin/data";

const rateLimitMap = new Map<string, number>();

async function accountExists(email: string): Promise<boolean> {
  if (process.env.DATABASE_URL) {
    try {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      return Boolean(user);
    } catch {
      // fall through to the local store
    }
  }
  const record = await getUserRecord(email);
  return Boolean(record);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const mode = body.mode === "signin" ? "signin" : body.mode === "signup" ? "signup" : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Smart auth routing: signup rejects existing accounts; signin rejects
    // unknown emails — the UI redirects the visitor to the right form.
    if (mode) {
      const exists = await accountExists(email);
      if (mode === "signup" && exists) {
        return NextResponse.json(
          {
            code: "email_exists",
            error: "This email is already registered. Please sign in instead.",
          },
          { status: 409 }
        );
      }
      if (mode === "signin" && !exists) {
        return NextResponse.json(
          {
            code: "account_not_found",
            error: "No account found with this email. Please create an account.",
          },
          { status: 404 }
        );
      }
    }

    // Rate limit: 30 seconds between requests per email
    const now = Date.now();
    const lastRequest = rateLimitMap.get(email);
    if (lastRequest && now - lastRequest < 30000) {
      const waitSeconds = Math.ceil((30000 - (now - lastRequest)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds}s before requesting a new code.` },
        { status: 429 }
      );
    }
    rateLimitMap.set(email, now);

    // Generate a secure 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in cache/memory
    await saveOtp(email, code);

    // Dispatch email notification
    const result = await sendNotificationEmail({
      to: email,
      subject: `Your verification code is ${code} — VOVO Agent AI`,
      text: `Hello,\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.\n\nVOVO Agent AI Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="margin: 0 0 16px 0; color: #111110; font-size: 24px;">VOVO Agent AI</h2>
          <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">Use the verification code below to complete your sign-in:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 18px 24px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111110; margin-bottom: 24px;">
            ${code}
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">This code is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });

    console.log(`[OTP Sent] Email: ${email} | Code: ${code}`);

    if (!result.success) {
      // OTP is still stored, but no real email was delivered — be honest.
      return NextResponse.json(
        {
          success: false,
          error:
            result.error ||
            "Email provider is not configured. The verification code could not be emailed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully.",
    });
  } catch (error) {
    console.error("[OTP Error]", error);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
