import { prisma } from "@/lib/db/prisma";

export interface EnsureDbUserResult {
  id: string | null;
  isNew: boolean;
}

/**
 * Sessions identify users by email; the database uses a cuid. This resolves
 * (or creates) the real user row so every signup exists in the database.
 */
export async function ensureDbUserDetailed(
  email: string,
  name?: string
): Promise<EnsureDbUserResult> {
  if (!process.env.DATABASE_URL) return { id: null, isNew: false };

  const clean = email.trim().toLowerCase();
  if (!clean) return { id: null, isNew: false };

  try {
    const existing = await prisma.user.findUnique({
      where: { email: clean },
      select: { id: true },
    });
    if (existing) return { id: existing.id, isNew: false };

    const created = await prisma.user.create({
      data: { email: clean, name: name?.trim() || clean.split("@")[0] },
      select: { id: true },
    });
    return { id: created.id, isNew: true };
  } catch (err) {
    console.warn("[db-user] ensureDbUser failed:", err);
    return { id: null, isNew: false };
  }
}

export async function ensureDbUser(email: string, name?: string): Promise<string | null> {
  const result = await ensureDbUserDetailed(email, name);
  return result.id;
}
