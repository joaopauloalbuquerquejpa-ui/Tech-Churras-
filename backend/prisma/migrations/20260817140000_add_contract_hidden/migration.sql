-- Permite arquivar contratos de teste sem apagar o histórico, e dá base
-- pra "apagar" de verdade os que são claramente lixo de teste.
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN NOT NULL DEFAULT false;
