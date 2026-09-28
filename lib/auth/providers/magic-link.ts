import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { getSessionSecretBytes } from "@/lib/auth/session-secret";
import { sendNotificationEmail } from "@/lib/email/notifier";

const TOKEN_EXPIRY = "15m";

export interface MagicLinkPayload {
  email: string;
  type: "magic-link";
  jti: string;
}

export async function createMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ email, type: "magic-link" } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setJti(randomBytes(16).toString("hex"))
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSessionSecretBytes());
}

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecretBytes());
    if (payload.type !== "magic-link") return null;
    return {
      email: payload.email as string,
      type: "magic-link",
      jti: payload.jti as string,
    };
  } catch {
    return null;
  }
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<boolean> {
  const magicLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/magic-link/verify?token=${token}`;

  const result = await sendNotificationEmail({
    to: email,
    subject: "Your sign-in link — VOVO Agent AI",
    text: [
      "Hello,",
      "",
      "Click the link below to sign in. It is valid for 15 minutes and can be used once:",
      magicLinkUrl,
      "",
      "If you did not request this link, you can safely ignore this email.",
      "",
      "VOVO Agent AI Team",
    ].join("\n"),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: center;">
        <h2 style="margin: 0 0 16px 0; color: #111110; font-size: 24px;">VOVO Agent AI</h2>
        <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">Click the button below to sign in. The link is valid for 15 minutes.</p>
        <a href="${magicLinkUrl}" style="display: inline-block; background: #335433; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">Sign in to VOVO</a>
        <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0 0;">If you did not request this link, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (!result.success) {
    console.error(`[Magic Link] Delivery failed for ${email}: ${result.error || "unknown error"}`);
  }
  return result.success;
}
