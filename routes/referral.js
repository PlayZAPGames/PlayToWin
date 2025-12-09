import express from "express";
import prisma from "../prisma/db.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { makeResponse } from "../helpers/index.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { numberToSlug, slugType } from "../utility/cypher.js";

import * as bank from "../utility/walletService.js";

const router = express.Router();


router.get("/invite", UserMiddleware, handleRequest(async function (req, res) {
  const userId = req.userId;

  const referral = await prisma.master.findUnique({
    where: { key: "referral" },
  });

  const referralData = referral?.data1 || {};
  const dailyLimit = referralData.referrerDailyRewardLimit || 0;
  const referralCode = numberToSlug(userId, slugType.user_id);

  // Today's date range (assumes server is in IST)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Claimed (redeemed) reward today
  const claimedTodayAgg = await prisma.userReferral.aggregate({
    _sum: {
      referrerAmount: true,
    },
    where: {
      referrer: userId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      redeem: true,
    },
  });

  // Unclaimed (unredeemed) reward today
  const unclaimedTodayAgg = await prisma.userReferral.aggregate({
    _sum: {
      referrerAmount: true,
    },
    where: {
      referrer: userId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      redeem: false,
    },
  });

  const claimedToday = claimedTodayAgg._sum.referrerAmount || 0;
  const unclaimedToday = unclaimedTodayAgg._sum.referrerAmount || 0;

  const url = `${process.env.GAME_URL}/referral?referralCode=${referralCode}`;

  return makeResponse(res, 200, true, "Referral link generated successfully", {
    url,
    referralCode,
    dailyLimit,
    claimedToday,
    unclaimedToday,
    referralData: referralData.virtual1 || {}
  });
}));



router.post("/invite/claim", UserMiddleware, handleRequest(async function (req, res) {
  const userId = req.userId;

  const referral = await prisma.master.findUnique({
    where: { key: "referral" },
  });
  const referralData = referral?.data1 || {};
  const dailyLimit = referralData.referrerDailyRewardLimit || 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Get unclaimed referrals for today
  const unclaimedReferrals = await prisma.userReferral.findMany({
    where: {
      referrer: userId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      redeem: false,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!unclaimedReferrals || unclaimedReferrals.length === 0) {
    return makeResponse(res, 400, false, "No unclaimed referral rewards available for today");
  }

  // Total already claimed today
  const claimedTodayAgg = await prisma.userReferral.aggregate({
    _sum: {
      referrerAmount: true,
    },
    where: {
      referrer: userId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      redeem: true,
    },
  });

  const claimedToday = claimedTodayAgg._sum.referrerAmount || 0;
  const remainingLimit = Math.max(dailyLimit - claimedToday, 0);

  if (remainingLimit <= 0) {
    return makeResponse(res, 200, true, "You have reached your daily referral claim limit", {
      claimedAmount: 0,
    });
  }

  // Go through unclaimed referrals and claim only up to the remaining limit
  let totalToClaim = 0;
  const claimIds = [];

  for (const referral of unclaimedReferrals) {
    if (totalToClaim + referral.referrerAmount <= remainingLimit) {
      totalToClaim += referral.referrerAmount;
      claimIds.push(referral.id);
    } else {
      break;
    }
  }

  if (totalToClaim <= 0) {
    return makeResponse(res, 200, true, "No claimable referral amount within daily limit", {
      claimedAmount: 0,
    });
  }

  // Credit to user's virtual1 balance
  await bank.updateCurrency(userId, totalToClaim, "virtual1", "credit", bank.transactiontype.referral);

  // Mark those referrals as claimed
  await prisma.userReferral.updateMany({
    where: {
      id: { in: claimIds },
    },
    data: {
      redeem: true,
    },
  });

  return makeResponse(res, 200, true, "Referral rewards claimed successfully", {
    claimedAmount: totalToClaim,
    remainingLimit: dailyLimit - (claimedToday + totalToClaim),
  });
}));



export async function getReferrerRewardEligibility(referrerUserID) {
  const referral = await prisma.master.findUnique({
    where: { key: "referral" },
  });

  const config = referral?.data1 || {};
  const dailyLimit = config.referrerDailyRewardLimit || 0;
  const rewardAmount = config.virtual1?.referrerReward || 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const claimedTodayAgg = await prisma.userReferral.aggregate({
    _sum: {
      referrerAmount: true,
    },
    where: {
      referrer: referrerUserID,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  const claimed = claimedTodayAgg._sum.referrerAmount || 0;
  return claimed + rewardAmount <= dailyLimit;
}




// router.get("/referral-link", UserMiddleware, handleRequest(async function (req, res) {
//   const user = await prisma.users.findUnique({
//     where: { id: req.userId },
//   });

//   const referralCode = numberToSlug(user.id, slugType.user_id);

//   let referralAmount = await prisma.master.findUnique({
//     where: { key: "referral" },
//   });
//   let joinReward = await prisma.master.findUnique({
//     where: { key: "joinReward" },
//   });

//   let total =
//     referralAmount.data1.virtual1.referreeReward + joinReward.data1.virtual1;
//   //refShareText.data1.text
//   let url = `${config.playzap.gameUrl}/referral?referralCode=${referralCode}`;
//   let text = `${url}\n\n${`Play with me, Become casual gaming legend on PlayZap!\n💎 +${total} gems as a first-time gift for you\n💎 +${referralAmount.data1.virtual1.referrerReward} gems if you invite your friend`}`;

  
//   let encodedText = encodeURIComponent(text);
//   return makeResponse(res, 200, true, "Referral link generated successfully",{url:url , url1:text, url2: encodedText});

//   // res.json(encodedText);
// }));

// router.get("/referral/invite-count", UserMiddleware, handleRequest(async function (req, res) {
//   const user = await prisma.users.findUnique({
//     where: { id: req.userId },
//   });

//   console.log("user", user);
  

//   const data = await prisma.$queryRaw`
//     SELECT
//         unn.username,
//         COUNT(ur.id)::INTEGER AS referral_count
//     FROM
//         "UserReferral" ur
//     LEFT JOIN
//         "Users" unn
//     ON
//         ur.referrer = unn.id
//     WHERE
//         unn.id = ${user.id}
//     GROUP BY
//         ur.referrer,
//         unn.username
//     ORDER BY
//         referral_count DESC;
//   `;

// return makeResponse(res, 200, true, "Referral count fetched successfully", data);
// }));

// router.get("/referral/leaderboard", UserMiddleware, async (req, res) => {
//   const data = await prisma.$queryRaw`
//     SELECT
//         unn.username, unn.id,
//         COUNT(ur.id)::INTEGER AS referral_count
//     FROM
//         "UserReferral" ur
//     LEFT JOIN
//         "Users" unn
//     ON
//         ur.referrer = unn.id
//     GROUP BY
//         ur.referrer,
//         unn.username,
//         unn.id
//     ORDER BY
//         referral_count DESC;
//   `;
//   res.json(data);
// });

// router.get("/referral-reward", UserMiddleware, async (req, res) => {
//   const ref = await prisma.master.findUnique({
//     where: { key: "referral" },
//   });

//   if (!ref) {
//     return makeResponse(res, 400, false, "Referral not found");
//   }
//   let amount = ref.data1;
//   return makeResponse(res, 200, true, "Referral reward fetched successfully", amount);
// });

// router.get("/referraltest", UserMiddleware, async () => {
//   let refShareText = await prisma.Master.findUnique({
//     where: { key: "referralShareText" },
//   });
//   console.log(refShareText.data1.text);
//   // login.Login(1399110225, "rnn", 1399120225)
// });
router.get("/referraltest", UserMiddleware, async (req, res) => {
const result = await getReferrerRewardEligibility(2)

console.log("result", result);


  return makeResponse(res, 200, true, "Referral link generated successfully", {
result
});

});

export default router;
