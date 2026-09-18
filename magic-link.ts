import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { getSessionSecretBytes } from "@/lib/auth/session-secret";

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
  console.log(`[Magic Link] Sending to ${email}: ${magicLinkUrl}`);
  return true;
}
