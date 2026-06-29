-- CreateTable
CREATE TABLE "WhatsappConversation" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'boutique',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "leadSaved" BOOLEAN NOT NULL DEFAULT false,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConversation_phone_key" ON "WhatsappConversation"("phone");

-- CreateIndex
CREATE INDEX "WhatsappConversation_lastActivity_idx" ON "WhatsappConversation"("lastActivity");

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "commission" DROP DEFAULT;
