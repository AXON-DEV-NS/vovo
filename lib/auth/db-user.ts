import { prisma } from "@/lib/db/prisma";

/**
 * Sessions identify users by email; the database uses a cuid. This resolves
 * (or creates) the real user row so every signup exists in the database.
 */
export async function ensureDbUser(email: string, name?: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null;

  const clean = email.trim().toLowerCase();
  if (!clean) return null;

  try {
    const existing = await prisma.user.findUnique({
      where: { email: clean },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await prisma.user.create({
      data: { email: clean, name: name?.trim() || clean.split("@")[0] },
      select: { id: true },
    });
    return created.id;
  } catch (err) {
    console.warn("[db-user] ensureDbUser failed:", err);
    return null;
  }
}
