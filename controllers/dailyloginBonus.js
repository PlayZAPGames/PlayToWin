import * as dbQuery from "../database/dbQuery.js";
import * as bank from "../utility/walletService.js";
import { EpochTime } from "../libs/utils.js";

const RewardsValues = async () => {
  let data = await dbQuery.getRewardsValues();
  return data.days;
};
const createDaysSession = async () => {
  const currentTime = EpochTime(0); // cuurent time 
  return {
    startAt: currentTime,
    claimedDaysCount: 0,
    lastClaimDate: 0, // to prevent duplicate claim in same day
  };
};


export async function getLoginStrak(userId) {
  try {
    let userSession = await dbQuery.getDailyRewards(userId);
    const currentTime = Math.floor(Date.now() / 1000); // current epoch in seconds

    // If no session exists, create one
    if (userSession.length === 0) {
      await dbQuery.setDailyRewards({
        userId: userId,
        dailySession: await createDaysSession(),
      });
      userSession = await dbQuery.getDailyRewards(userId);
    }

    let dailySession = userSession[0].dailySession;

    const cycleStart = dailySession.startAt;
    const lastClaimDate = dailySession.lastClaimDate;

    const diffDays = Math.floor((currentTime - cycleStart) / (60 * 60 * 24));
    const inNewCycle = diffDays >= 7;

    if (inNewCycle) {
      // Reset for new cycle
      dailySession = await createDaysSession();
      await dbQuery.updateDailyRewards({ userId, dailySession });
    }

    // 24-hour based claim check
    const timeSinceLastClaim = currentTime - (lastClaimDate || 0);
    const canClaim = lastClaimDate === 0 || timeSinceLastClaim >= 24 * 60 * 60;

    return {
      canClaim: canClaim && dailySession.claimedDaysCount < 7,
      rewardDayIndex: dailySession.claimedDaysCount, // 0–6
      streakResetIn: 7 - (inNewCycle ? 0 : diffDays),
      dailySession,
      nextClaimAt: lastClaimDate ? lastClaimDate + 24 * 60 * 60 : currentTime,
    };
  } catch (error) {
    console.error("Error in getDailyRewards:", error);
    throw error;
  }
}

export async function claimDailyLoginBonus(userId) {
  try {
    console.log("claimDailyLoginBonus called for userId:", userId);

    const userSession = await dbQuery.getDailyRewards(userId);
    if (userSession.length === 0) return "No user session found";

    let dailySession = userSession[0].dailySession;
    const currentTime = Math.floor(Date.now() / 1000); // now in seconds

    const { startAt, claimedDaysCount, lastClaimDate } = dailySession;

    // ⛔ Block if less than 24 hours since last claim
    if (lastClaimDate !== 0 && currentTime - lastClaimDate < 24 * 60 * 60) {
      return "Cannot claim yet — 24 hours have not passed since last claim";
    }

    const daysSinceStart = Math.floor((currentTime - startAt) / (60 * 60 * 24));

    // ✅ New cycle check (based on 7-day window from startAt)
    if (daysSinceStart >= 7) {
      dailySession = await createDaysSession();
      dailySession.lastClaimDate = currentTime;
      dailySession.claimedDaysCount = 1;

      const rewards = await RewardsValues();
      const reward = rewards[0];

      await bank.updateCurrency(
        userId,
        reward.value,
        reward.currencyType,
        "credit",
        bank.transactiontype.dailyRewards
      );

      await dbQuery.updateDailyRewards({ userId, dailySession });
      return `Daily reward claimed (New cycle - Day 1)`;
    }

    // ⛔ Data corruption check
    if (claimedDaysCount > daysSinceStart) {
      return "Invalid claim. You already claimed ahead.";
    }

    // ✅ Normal valid claim
    const rewards = await RewardsValues();
    const reward = rewards[claimedDaysCount];
    if (!reward) return "No reward available for this day";

    dailySession.claimedDaysCount += 1;
    dailySession.lastClaimDate = currentTime;

    await bank.updateCurrency(
      userId,
      reward.value,
      reward.currencyType,
      "credit",
      bank.transactiontype.dailyRewards
    );

    await dbQuery.updateDailyRewards({ userId, dailySession });

    return `Daily reward claimed (Day ${claimedDaysCount + 1})`;
  } catch (error) {
    console.error("Error in claimDailyRewards:", error);
    throw error;
  }
}
