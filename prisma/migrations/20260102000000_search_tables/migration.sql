-- CreateTable
CREATE TABLE "search_provider_state" (
    "provider" TEXT NOT NULL,
    "exhaustedUntil" TIMESTAMP(3),
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_provider_state_pkey" PRIMARY KEY ("provider")
);

-- CreateTable
CREATE TABLE "search_cache" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_cache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "search_cache_expiresAt_idx" ON "search_cache"("expiresAt");

