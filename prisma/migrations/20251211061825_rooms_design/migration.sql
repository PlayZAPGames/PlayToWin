/*
  Warnings:

  - You are about to drop the column `chatId` on the `Rooms` table. All the data in the column will be lost.
  - You are about to drop the column `iMessage` on the `Rooms` table. All the data in the column will be lost.
  - You are about to drop the column `iMessage` on the `UserTournament` table. All the data in the column will be lost.
  - You are about to drop the column `tgId` on the `UserTournament` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Rooms" DROP COLUMN "chatId",
DROP COLUMN "iMessage",
ADD COLUMN     "currentPlayers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tournamentBlockId" INTEGER,
ALTER COLUMN "entryFee" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserTournament" DROP COLUMN "iMessage",
DROP COLUMN "tgId";

-- CreateIndex
CREATE INDEX "Rooms_tournamentBlockId_released_currentPlayers_idx" ON "Rooms"("tournamentBlockId", "released", "currentPlayers");

-- AddForeignKey
ALTER TABLE "Rooms" ADD CONSTRAINT "Rooms_tournamentBlockId_fkey" FOREIGN KEY ("tournamentBlockId") REFERENCES "TournamentBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
