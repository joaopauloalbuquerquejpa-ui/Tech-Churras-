-- Fila de retry pra notificacoes (WhatsApp/push) que falham na primeira tentativa.
-- Ate agora essas chamadas eram fire-and-forget com .catch() silencioso — se o
-- Z-API ou o webpush falhassem, ninguem tentava de novo.
CREATE TABLE IF NOT EXISTS "NotificationRetry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRetry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NotificationRetry_status_nextAttemptAt_idx" ON "NotificationRetry"("status", "nextAttemptAt");
