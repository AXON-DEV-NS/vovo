/**
 * One-time promotion of the owner's account to ADMIN, directly in the
 * database. There is no signup flow that grants the admin role.
 *
 * Usage:
 *   node scripts/set-admin.mjs <your-email>
 *
 * Requires DATABASE_URL to be set in .env.local.
 */
import { PrismaClient } from "@prisma/client";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <your-email>");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log(`Promoted ${user.email} to ADMIN.`);
  console.log("This is the only account with the admin role.");
} catch (error) {
  if (error && error.code === "P2025") {
    console.error(
      `No user found with email ${email}. Sign in once first so the account exists, then re-run this script.`
    );
    process.exit(1);
  }
  throw error;
} finally {
  await prisma.$disconnect();
}
