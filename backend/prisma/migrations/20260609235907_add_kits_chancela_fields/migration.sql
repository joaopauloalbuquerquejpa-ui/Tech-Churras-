-- AlterTable
ALTER TABLE "Boutique" ADD COLUMN     "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
ADD COLUMN     "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 369.00;

-- AlterTable
ALTER TABLE "Grillmaster" ADD COLUMN     "isChancelado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KitChurrasco" (
    "id" TEXT NOT NULL,
    "boutiqueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "minGuests" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitChurrasco_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KitChurrasco" ADD CONSTRAINT "KitChurrasco_boutiqueId_fkey" FOREIGN KEY ("boutiqueId") REFERENCES "Boutique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
