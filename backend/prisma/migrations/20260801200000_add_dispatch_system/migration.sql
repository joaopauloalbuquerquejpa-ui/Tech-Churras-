-- AlterTable Grillmaster
ALTER TABLE "Grillmaster" ADD COLUMN IF NOT EXISTS "serviceRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "grillmasterAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dispatchWave" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dispatchDeadline" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_dispatchDeadline_idx" ON "Order"("dispatchDeadline");

-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderDispatch" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "grillmasterId" TEXT NOT NULL,
    "wave" INTEGER NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "response" TEXT,

    CONSTRAINT "OrderDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OrderDispatch_orderId_grillmasterId_wave_key" ON "OrderDispatch"("orderId", "grillmasterId", "wave");
CREATE INDEX IF NOT EXISTS "OrderDispatch_orderId_idx" ON "OrderDispatch"("orderId");
CREATE INDEX IF NOT EXISTS "OrderDispatch_grillmasterId_response_idx" ON "OrderDispatch"("grillmasterId", "response");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "OrderDispatch" ADD CONSTRAINT "OrderDispatch_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "OrderDispatch" ADD CONSTRAINT "OrderDispatch_grillmasterId_fkey" FOREIGN KEY ("grillmasterId") REFERENCES "Grillmaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
