import { prisma } from "@/lib/db/prisma";

/**
 * Resolve the authenticated user's role from the database so that the
 * `role` in a session reflects the real record — not a hardcoded value.
 * The owner's account is set to ADMIN directly in the database
 * (see scripts/set-admin.mjs); nobody else can obtain that role through
 * any signup flow.
 */
export async function resolveUserRole(
  email: string,
  fallback: "USER" | "ADMIN" = "USER"
): Promise<"USER" | "ADMIN"> {
  if (!process.env.DATABASE_URL) return fallback;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { role: true },
    });
    if (!user) return fallback;
    return user.role === "ADMIN" ? "ADMIN" : "USER";
  } catch {
    return fallback;
  }
}
