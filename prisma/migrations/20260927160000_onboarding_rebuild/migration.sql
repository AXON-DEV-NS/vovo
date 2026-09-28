-- Onboarding rebuild: persistent progress, AI custom instructions,
-- first-visit tour flag, channel references, and uploaded avatar image.
-- Generated via `prisma migrate diff --from-schema-datasource --to-schema-datamodel`.

-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "avatarImage" BYTEA,
ADD COLUMN     "avatarImageMime" TEXT,
ADD COLUMN     "referenceChannelUrl" TEXT,
ADD COLUMN     "referenceVideoUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "customInstructions" TEXT,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tourSeenAt" TIMESTAMP(3);
