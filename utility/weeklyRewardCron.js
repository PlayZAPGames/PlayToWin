import cron from "node-cron";
import prisma from "../prisma/db.js";
import * as bank from "../utility/walletService.js";
import { transferPzpReward } from "../controllers/shop.js";
import { startOfWeek, endOfWeek } from "date-fns";

//
// 🔹 Safe blockchain transfer with retries
//
async function safeTransferWithRetry(walletAddress, amount, key, retries = 3, delay = 5000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const transferResult = await transferPzpReward(walletAddress, amount, key);

      if (transferResult.status !== 500) {
        return transferResult; // ✅ success
      }
      console.warn(`Transfer attempt ${attempt + 1} failed:`, transferResult);
    } catch (err) {
      console.warn(`Transfer attempt ${attempt + 1} error:`, err.message);
    }

    attempt++;
    if (attempt < retries) {
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw new Error(`Transfer failed after ${retries} retries`);
}

async function processWeeklyPrize(userId, amount, weekStart, weekEnd, rank) {
  // ✅ Check only for successful reward in this week
  const existingSuccess = await prisma.userWalletHistory.findFirst({
    where: {
      user_id: userId,
      transaction_type: bank.transactiontype.weeklyReward,
      status: "success",
      createdAt: { gte: weekStart, lte: weekEnd },
    },
  });
  if (existingSuccess) {
    console.log(`⚠️ User ${userId} already SUCCESSFULLY rewarded for this week, skipping...`);
    // return;
  }
   // 2) Fetch wallet first
  const wallet = await prisma.wallets.findUnique({
    where: { id: userId },
    select: { pzpEvmWallet: true },
  });

  if (!wallet?.pzpEvmWallet) {
    console.error(`User ${userId} has no PZP wallet, skipping...`);
    return;
  }


// 3) Reuse existing pending/pending_retry row if present, else create

  let txn = await prisma.userWalletHistory.findFirst({
    where: {
      user_id: userId,
      transaction_type: bank.transactiontype.weeklyReward,
      status: { in: ["pending", "pending_retry"] },
      createdAt: { gte: weekStart, lte: weekEnd },
    },
  });

  if (!txn) {
    txn = await prisma.userWalletHistory.create({
      data: {
        user_id: userId,
        from_amount: 0,
        from_currency: bank.currencies.virtual2,
        operation: bank.operations.credit,
        transaction_type: bank.transactiontype.weeklyReward,
        transaction_hash: null,
        status: "pending",
        to_amount: amount,
        amount: amount,
        to_currency: bank.currencies.virtual2,
      },
    });
  }

  try {
    let transferResult = await safeTransferWithRetry(
      wallet.pzpEvmWallet,
      amount,
      process.env.EncryptionKey
    );

    await prisma.userWalletHistory.update({
      where: { id: txn.id },
      data: {
        status: "success",
        transaction_hash: transferResult.msg.hash,
      },
    });

    console.log(`✅ User ${userId} (Rank #${rank}) rewarded ${amount} PZP`);
  } catch (err) {
    await prisma.userWalletHistory.update({
      where: { id: txn.id },
      data: {
        status: "pending_retry",
        // error_message: err.message,
      },
    });
    console.error(`❌ Failed to reward User ${userId} (Rank #${rank}):`, err.message);
  }
}

//
// 🔹 Distribute weekly rewards
//
export async function distributeWeeklyRewards() {


  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Fetch prize pool config
  const prizeConfig = await prisma.master.findUnique({
    where: { key: "weeklyPrizePool" },
  });

  if (!prizeConfig) {
    console.error("❌ No weekly prize pool configured.");
    return;
  }

  let weeklyPrizePool;
  try {
    weeklyPrizePool = prizeConfig.data1.rewards;
  } catch (err) {
    console.error("❌ Failed to parse weeklyPrizePool from DB:", err.message);
    return;
  }

  console.log("📦 Weekly Prize Pool:", weeklyPrizePool);

  // Fetch leaderboard (grouped rewards)
  const allUserRewards = await prisma.userGameRewardHistory.groupBy({
    by: ["userId"],
    _sum: { reward: true },
    where: { createdAt: { gte: weekStart, lte: weekEnd } },
    orderBy: { _sum: { reward: "desc" } },
  });

  if (!allUserRewards.length) {
    console.log("ℹ️ No leaderboard rewards this week.");
    return;
  }

  console.log("🏆 Leaderboard Results:", allUserRewards);

  // Assign prizes to top N users
for (let i = 0; i < allUserRewards.length; i++) {
  const winner = allUserRewards[i];
  const userId = winner.userId;
  const rank = i + 1; // leaderboard rank

  // Find reward for this rank
  const prizeRange = weeklyPrizePool.find(
    (p) => rank >= p.from && rank <= p.to
  );

  if (!prizeRange) continue; // no reward for this rank

  const amount = prizeRange.reward;

  console.log(`➡️ Rank #${rank}: User ${userId} → ${amount} PZP`);

  await processWeeklyPrize(userId, amount, weekStart, weekEnd, rank);
}


  console.log("✅ Weekly rewards distribution completed.");
}

//
// 🔹 Retry cron job for failed transactions
//
async function retryFailedTransactions() {
  console.log("🔄 Retrying failed weekly reward transactions...");
  const pendingTxns = await prisma.userWalletHistory.findMany({
    where: {
      status: "pending_retry",
      transaction_type: bank.transactiontype.weeklyReward,
    },
    take: 10, // batch size
  });

  for (const txn of pendingTxns) {
    const wallet = await prisma.wallets.findUnique({
      where: { id: txn.user_id },
      select: { pzpEvmWallet: true },
    });

    if (!wallet?.pzpEvmWallet) {
      console.error(`⚠️ User ${txn.user_id} still has no wallet, skipping...`);
      continue;
    }

    try {
      let transferResult = await safeTransferWithRetry(
        wallet.pzpEvmWallet,
        txn.amount,
        process.env.EncryptionKey
      );

      await prisma.userWalletHistory.update({
        where: { id: txn.id },
        data: {
          status: "success",
          transaction_hash: transferResult.msg.hash,
        },
      });

      console.log(`✅ Retried txn ${txn.id} → SUCCESS`);
    } catch (err) {
      console.error(`❌ Retry failed for txn ${txn.id}:`, err.message);
    }
  }
}

//
// 🔹 Main entrypoint: setup cron jobs
//
function WeeklyRewardsCronJobs() {

  // runs every Monday at 00:00:00
  cron.schedule("0 0 * * 1", async () => { 
    
  // runs every 10 seconds for testing
  // cron.schedule("*/10 * * * * *", async () => {
    console.log("🚀 Running weekly leaderboard reward job...");
    try {
      await distributeWeeklyRewards();
    } catch (err) {
      console.error("❌ Weekly reward job failed:", err);
    }
  });

  // Retry job: every 10 min
  cron.schedule("*/10 * * * *", async () => {
    try {
      await retryFailedTransactions();
    } catch (err) {
      console.error("❌ Retry job failed:", err);
    }
  });
}

export default WeeklyRewardsCronJobs;
