import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { getSessionSecret } from "@/lib/auth/session-secret";

const MAGIC_LINK_SECRET = new TextEncoder().encode(getSessionSecret());
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
    .sign(MAGIC_LINK_SECRET);
}

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, MAGIC_LINK_SECRET);
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
