/*
  Warnings:

  - You are about to drop the column `bossKills` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `currencyType` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `entryFee` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `iMessage_Solo` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `keyboardGameName` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `kills` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `miniAppUrl` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `serverGameName` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `timeBonus` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `winningCurrencyType` on the `games` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "games" DROP COLUMN "bossKills",
DROP COLUMN "currencyType",
DROP COLUMN "entryFee",
DROP COLUMN "iMessage_Solo",
DROP COLUMN "keyboardGameName",
DROP COLUMN "kills",
DROP COLUMN "miniAppUrl",
DROP COLUMN "serverGameName",
DROP COLUMN "timeBonus",
DROP COLUMN "url",
DROP COLUMN "winningCurrencyType",
ADD COLUMN     "imageIndex" INTEGER;
