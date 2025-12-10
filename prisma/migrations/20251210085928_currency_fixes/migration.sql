/*
  Warnings:

  - You are about to drop the column `cashBalance` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "cashBalance",
ADD COLUMN     "cash" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "gems" DOUBLE PRECISION NOT NULL DEFAULT 0;
