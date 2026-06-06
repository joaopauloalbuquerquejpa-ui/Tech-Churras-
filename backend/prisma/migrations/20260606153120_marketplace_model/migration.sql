/*
  Warnings:

  - The values [BOUTIQUE_OWNER,BLOCKED] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `pricePerDay` on the `Grillmaster` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('CARNE', 'SAL_TEMPERO', 'CARVAO', 'ACOMPANHAMENTO', 'BEBIDA', 'OUTRO');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CUSTOMER', 'GRILLMASTER', 'BOUTIQUE', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- AlterTable
ALTER TABLE "Boutique" ADD COLUMN     "address" TEXT,
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "open" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Grillmaster" DROP COLUMN "pricePerDay",
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "pricePerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "specialties" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "eventHours" INTEGER NOT NULL DEFAULT 4,
ALTER COLUMN "totalPrice" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'CARNE',
ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "GrillmasterSchedule" (
    "id" TEXT NOT NULL,
    "grillmasterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrillmasterSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GrillmasterSchedule" ADD CONSTRAINT "GrillmasterSchedule_grillmasterId_fkey" FOREIGN KEY ("grillmasterId") REFERENCES "Grillmaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
