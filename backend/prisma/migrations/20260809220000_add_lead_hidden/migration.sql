-- AlterTable Lead: campo hidden pra arquivar lead de teste/lixo sem apagar dado
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Lead_hidden_idx" ON "Lead"("hidden");
