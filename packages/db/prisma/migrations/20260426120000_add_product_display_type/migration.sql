-- CreateEnum
CREATE TYPE "ProductDisplayType" AS ENUM ('SLIDER', 'SINGLE', 'COLLAGE_2X2');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "displayType" "ProductDisplayType" NOT NULL DEFAULT 'SLIDER';
