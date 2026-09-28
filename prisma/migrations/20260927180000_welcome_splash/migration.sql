-- First-visit welcome splash flag (persisted per account, shown exactly once).
-- Generated via `prisma migrate diff --from-schema-datasource --to-schema-datamodel`.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "welcomeSeenAt" TIMESTAMP(3);
