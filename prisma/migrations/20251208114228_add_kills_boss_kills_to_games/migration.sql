/*
  Warnings:

  - You are about to drop the column `coins` on the `games` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "games" DROP COLUMN "coins",
ADD COLUMN     "bossKills" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "kills" DOUBLE PRECISION NOT NULL DEFAULT 1,
ALTER COLUMN "timeBonus" SET DEFAULT 1;
