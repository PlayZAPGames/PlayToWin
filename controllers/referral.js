import {getReferralRewards} from "../database/dbQuery.js";
import * as bank from "../utility/walletService.js";
import {getReferrer, addReferalData} from "../database/dbQuery.js";
import { getReferrerRewardEligibility } from "../routes/referral.js";

import prisma from "../prisma/db.js";
// referree - who recv the link
// referrer - who shares the link

// - create referral link with referrer user id and convert to slug
// - when user clicks on the link, it will redirect to the app with referral code
// - reward referrer with 10 tokens & reffered with 1 token

export const reward = async (userId, referrerUserID) => {
   console.log("reward called ", userId, referrerUserID);
  //self-note: referrerUserID is the referrer's user id//
  let rewards = await getReferralRewards();
  let c = rewards[0].data1.virtual1;
  // reward both the users
  await bank.updateCurrency(userId, c.referreeReward, "virtual1", "credit", bank.transactiontype.referral);
  
  // referrer - who shares the link not directly get the reward he have to claim
  //await bank.updateCurrency(referrerUserID, c.referrerReward, "virtual1", "credit", bank.transactiontype.referral);
  const isEligible = await getReferrerRewardEligibility(referrerUserID);
  if (isEligible) {
    await addReferalData(referrerUserID, c.referrerReward, userId, c.referreeReward);
  }
  
};

export const createReferralLink = async (referrerUserID) => {
  return `${process.env.TG_BOT_URL}/start?startapp=ref_${referrerUserID}`;
};

export const handler = async (userId, referrerUserID) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  // check if referrer exist in database
  if (!user) return false;
  
  // check if referrer already exist in referree list
  let referrer = await getReferrer(userId, referrerUserID);
  if (referrer.length == 0){
    await reward(userId, referrerUserID);
    return true;
  }else {
    console.log("referrer already exist");
    return false;
  }
};
