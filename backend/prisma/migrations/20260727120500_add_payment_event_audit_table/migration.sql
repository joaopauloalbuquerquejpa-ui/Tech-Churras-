-- Auditoria de segurança 27/07: nenhum log bruto do webhook do Mercado Pago existia.
-- Sem isso, um pagamento que "sumir" não tem como ser investigado depois.
CREATE TABLE IF NOT EXISTS "PaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT,
    "status" TEXT,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PaymentEvent_paymentId_idx" ON "PaymentEvent"("paymentId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_orderId_idx" ON "PaymentEvent"("orderId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_createdAt_idx" ON "PaymentEvent"("createdAt");
