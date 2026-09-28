import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { getSessionSecretBytes } from "@/lib/auth/session-secret";
import { prisma } from "@/lib/db/prisma";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
}

async function signSession(claims: Record<string, unknown>): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSessionSecretBytes());
}

export async function createSession(payload: SessionPayload): Promise<string> {
  let token: string;

  if (process.env.DATABASE_URL) {
    // Record the login server-side so the account page can list and revoke it.
    const sid = randomUUID();
    const candidate = await signSession({ ...payload, sid });

    try {
      const headerList = await headers();
      const forwarded = headerList.get("x-forwarded-for");
      await prisma.session.create({
        data: {
          id: sid,
          token: candidate,
          userId: payload.userId,
          expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
          ipAddress: forwarded ? forwarded.split(",")[0].trim() : null,
          userAgent: headerList.get("user-agent"),
        },
      });
      token = candidate;
    } catch {
      // Keep sign-in working if session bookkeeping fails — fall back to a
      // stateless signed token (no revocable session record).
      token = await signSession({ ...payload });
    }
  } else {
    token = await signSession({ ...payload });
  }

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSessionSecretBytes());
    const session: SessionPayload = {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      role: payload.role as "USER" | "ADMIN",
    };

    // Revocation + suspension check: tokens minted with a session id are only
    // valid while their server-side record exists and the account is active.
    // Database outages fall back to the JWT.
    const sid = typeof payload.sid === "string" ? payload.sid : undefined;
    if (sid && process.env.DATABASE_URL) {
      try {
        const record = await prisma.session.findUnique({
          where: { id: sid },
          select: { expiresAt: true, user: { select: { status: true } } },
        });
        if (!record || record.expiresAt <= new Date()) return null;
        if (record.user?.status === "SUSPENDED") return null;

        // Best-effort last-seen tracking — never blocks the request path.
        void prisma.session
          .update({ where: { id: sid }, data: { lastSeenAt: new Date() } })
          .catch(() => {});
      } catch {
        // Database unavailable: fall back to verifying the signed token only.
      }
    } else if (process.env.DATABASE_URL) {
      // Legacy stateless tokens (minted before revocable sessions) — still
      // honor an account suspension.
      try {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { id: session.userId },
              { email: session.email.trim().toLowerCase() },
            ],
          },
          select: { status: true },
        });
        if (user?.status === "SUSPENDED") return null;
      } catch {
        // Database unavailable: fall back to the signed token.
      }
    }

    return session;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token && process.env.DATABASE_URL) {
    try {
      await prisma.session.deleteMany({ where: { token } });
    } catch {
      // Never block sign-out on bookkeeping failures.
    }
  }

  cookieStore.delete("session");
}
