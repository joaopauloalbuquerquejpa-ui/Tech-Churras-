-- Corrige drift: model AlphaTester existia no schema.prisma desde 30/06 (commit a9d53b4)
-- mas nunca teve migração — /alpha/register (captação de testers Play Store) quebrado desde então.
CREATE TABLE "AlphaTester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlphaTester_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AlphaTester_createdAt_idx" ON "AlphaTester"("createdAt");
