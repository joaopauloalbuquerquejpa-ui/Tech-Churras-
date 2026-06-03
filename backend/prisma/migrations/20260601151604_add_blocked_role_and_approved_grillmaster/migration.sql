-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "Grillmaster" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false;
