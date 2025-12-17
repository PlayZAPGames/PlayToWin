import cron from "node-cron";

import prisma from "../prisma/db.js";


const GAME_TIMEOUT_MINUTES = 30;

async function autoCloseTournamentCron() {
  
  cron.schedule("*/3 * * * *", async () => {
    console.log("⏳ [CRON] Auto close tournament started");

    try {
      const timeoutTime = new Date(
        Date.now() - GAME_TIMEOUT_MINUTES * 60 * 1000
      );

      // 👉 Sirf FULL rooms lo jo timeout ho chuke hain
      const rooms = await prisma.rooms.findMany({
        where: {
          released: false,
          startTime: { lt: timeoutTime },
          currentPlayers: {
            equals: prisma.rooms.fields.maxPlayers
          }
        }
      });

      for (const room of rooms) {
        console.log(`⏱️ Closing room ${room.id}`);

        const players = await prisma.userTournament.findMany({
          where: { roomId: room.id }
        });

        if (players.length === 0) continue;

        // जिनका score submit नहीं हुआ → 0
        const finalPlayers = players.map(p => ({
          ...p,
          score: p.scoreSubmitted ? p.score : 0
        }));

        // Winner decide
        finalPlayers.sort((a, b) => b.score - a.score);
        const winner = finalPlayers[0];

        await prisma.$transaction(async (tx) => {
          // Mark missing scores as 0
          await tx.userTournament.updateMany({
            where: {
              roomId: room.id,
              scoreSubmitted: false
            },
            data: {
              score: 0,
              scoreSubmitted: true
            }
          });

          // Close room
          await tx.rooms.update({
            where: { id: room.id },
            data: {
              released: true,
              releaseTime: new Date()
            }
          });

          // Reward history
          await tx.userGameRewardHistory.create({
            data: {
              userId: winner.userId,
              gameId: room.gameId,
              roomId: room.id,
              reward: 0, // prizePool logic yahan aayega
              rank: "1",
              currency: "gems",
              reason: "timeout_win"
            }
          });
        });

        console.log(`🏆 Room ${room.id} closed | Winner: ${winner.userId}`);
      }
    } catch (err) {
      console.error("❌ [CRON] Auto close tournament error", err);
    }
  });
}



export {  autoCloseTournamentCron };
