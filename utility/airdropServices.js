import prisma from "../prisma/db.js";

export async function handleAirdropReward({ userId, winAmount}) {

  const season = await prisma.airdropSeason.findFirst({
    where: {
      status: 0, // assuming 0 = in_progress
      start_time: { lte: new Date() },
      end_time: { gte: new Date() },
    },
  });

  if (!season) {
    console.warn(`⛔ No active airdrop season for user ${userId}`);
    return false; // or throw error if mandatory
  }

  const remaining = season.total_supply - season.claimed;
  if (remaining < winAmount) {
    console.warn(`⛔ Not enough LUDY supply left for user ${userId}`);
    // return false;
  }

  await prisma.$transaction([
    prisma.airdropSeason.update({
      where: { id: season.id },
      data: {
        claimed: { increment: winAmount },
      },
    }),
  ]);

  console.log(`✅ Airdrop reward of ${winAmount} LUDY given to user ${userId} in season ${season.name}`);
  return season;
}
