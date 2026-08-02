-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerificationExpiresAt" TIMESTAMP(3);

-- AlterTable Grillmaster
ALTER TABLE "Grillmaster" ADD COLUMN IF NOT EXISTS "cpfCnpj" TEXT;

-- AlterTable Boutique
ALTER TABLE "Boutique" ADD COLUMN IF NOT EXISTS "cpfCnpj" TEXT;

-- Fix monthlyFee default for new records (universal R$369, no more two-tier plan)
ALTER TABLE "Boutique" ALTER COLUMN "monthlyFee" SET DEFAULT 369.00;
