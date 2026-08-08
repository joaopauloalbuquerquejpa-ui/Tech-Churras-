-- CreateTable EbookPurchase
CREATE TABLE IF NOT EXISTS "EbookPurchase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "downloadToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "EbookPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EbookPurchase_downloadToken_key" ON "EbookPurchase"("downloadToken");
CREATE INDEX IF NOT EXISTS "EbookPurchase_email_idx" ON "EbookPurchase"("email");
CREATE INDEX IF NOT EXISTS "EbookPurchase_status_idx" ON "EbookPurchase"("status");

-- Cupom de R$50 OFF pro comprador do e-book usar no primeiro churrasco na Tech Churras
INSERT INTO "Coupon" ("id", "code", "discountType", "discountValue", "minOrderValue", "maxUses", "validUntil", "active", "createdAt")
VALUES ('ebook50-launch-coupon-seed-2026', 'EBOOK50', 'FIXED', 50, 100, NULL, NULL, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
