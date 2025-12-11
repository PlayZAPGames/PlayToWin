/*
  Warnings:

  - You are about to drop the column `currentPlayers` on the `TournamentBlock` table. All the data in the column will be lost.
  - You are about to drop the column `maxPlayers` on the `TournamentBlock` table. All the data in the column will be lost.
  - Added the required column `players` to the `TournamentBlock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TournamentBlock" DROP COLUMN "currentPlayers",
DROP COLUMN "maxPlayers",
ADD COLUMN     "players" INTEGER NOT NULL;
