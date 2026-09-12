import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getSessionSecret } from '@/lib/auth/session-secret';

const SESSION_SECRET = new TextEncoder().encode(getSessionSecret());
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours for admin sessions

/**
 * Allow-list of admin emails — exactly one admin account: the owner.
 * The owner's email is configured via ADMIN_EMAIL in the environment.
 */
export function isAllowedAdminEmail(email: string): boolean {
  if (!email) return false;
  const allowed = process.env.ADMIN_EMAIL;
  if (!allowed) return false;
  return allowed.trim().toLowerCase() === email.trim().toLowerCase();
}

export interface AdminSessionPayload {
  userId: string;
  email: string;
  name?: string;
  role: 'ADMIN';
}

/** Create an encrypted HTTP-only admin session cookie */
export async function createAdminSession(payload: Omit<AdminSessionPayload, 'role'>): Promise<string> {
  if (!isAllowedAdminEmail(payload.email)) {
    throw new Error('UNAUTHORIZED_ADMIN_EMAIL');
  }

  const token = await new SignJWT({ ...payload, role: 'ADMIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  });

  return token;
}

/** Get and verify the current admin session from cookie */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SESSION_SECRET);
    if (payload.role !== 'ADMIN') return null;

    const email = payload.email as string;
    if (!isAllowedAdminEmail(email)) return null;

    return {
      userId: payload.userId as string,
      email,
      name: payload.name as string | undefined,
      role: 'ADMIN',
    };
  } catch {
    return null;
  }
}

/** Revoke admin session */
export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}
