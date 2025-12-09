import * as dbQuery from "../database/dbQuery.js";
import * as bank from "../utility/walletService.js";
import { EpochTime } from "../libs/utils.js";

const CreateDay = (
  isClaimed,
  canClaim,
  isLocked,
  claimedTimeStamp,
  expireTimestamp
) => {
  return {
    isClaimed,
    canClaim,
    isLocked,
    claimedTimeStamp,
    expireTimestamp,
  };
};

const RewardsValues = async () => {
  let data = await dbQuery.getRewardsValues();  
  return data.days;
};

const createDaysSession = async () => {
  // get currency type from daily rewards
  // get amount from daily rewards
  return {
    lastClaimDay : 0,
    startAt: EpochTime(0),
    days: [
      CreateDay(false, true, false, 0, EpochTime(1)),
      CreateDay(false, false, true, 0, 0),
      CreateDay(false, false, true, 0, 0),
      CreateDay(false, false, true, 0, 0),
      CreateDay(false, false, true, 0, 0),
      CreateDay(false, false, true, 0, 0),
      CreateDay(false, false, true, 0, 0),
    ],
  };
};

export async function getDailyRewards(userId) {
  try {

    let userSession = await dbQuery.getDailyRewards(userId);
    const currentDate = EpochTime(0);

    if (userSession.length === 0) {
      console.log("!userSession");
      await dbQuery.setDailyRewards({
        userId: userId,
        dailySession: await createDaysSession(),
      });
      userSession = await dbQuery.getDailyRewards(userId);
    }

    let dailySession = userSession[0].dailySession;

    const InitialStartDate = dailySession.startAt;
    const ini = new Date(InitialStartDate * 1000);
    const curr = new Date(currentDate * 1000);
    const diffTime = curr - ini;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let day = dailySession.days[userSession[0].dailySession.lastClaimDay];
    let i = dailySession.lastClaimDay;
    let expireDate = day.expireTimestamp;

    console.log(dailySession)
    console.log(expireDate < currentDate)
    if (diffDays >= 15 || (i === 6 && expireDate < currentDate) ) {
      dailySession = await createDaysSession();
      await dbQuery.updateDailyRewards({
        userId: userId,
        dailySession: dailySession,
      });
      console.log("Resetting daily rewards");

    } 
    else {
      // for (let i = 0; i < dailySession.days.length; i++) {
        if (expireDate < currentDate ) {
          let nextday = i + 1;
          dailySession.days[nextday].canClaim = true;
          dailySession.days[nextday].isLocked = false;
          dailySession.days[nextday].expireTimestamp = EpochTime(1);
          dailySession.nextunlockTimestap = EpochTime(1);

          //previous day
          day.canClaim = false;
          dailySession.days[i] = day;
          console.log("Daily reward expired");
        } else if (!day.isClaimed && day.canClaim) {
          let previousIndex = i > 0 ? i - 1 : 0;
          let previousClaimedTimeStamp =
            dailySession.days[previousIndex].claimedTimeStamp;
          let NextUnlockDate = previousClaimedTimeStamp + 24 * 60 * 60;

          if (NextUnlockDate <= currentDate && day.isLocked) {
            day.isLocked = false;
            dailySession.days[i] = day;

            console.log("Daily claimable");
            
          } else {

            console.log("Daily not claimable");
            
          }
        } else if (
          day.isClaimed &&
          dailySession.days[i + 1] &&
          !dailySession.days[i + 1].canClaim
        ) {
          dailySession.days[i + 1].isLocked = true;
          dailySession.days[i + 1].expireTimestamp = EpochTime(1);
          
          console.log("Next Daily reward updated");
        }
      // }
      console.log("Daily reward Updated in DB");

      await dbQuery.updateDailyRewards({
        userId: userId,
        dailySession: dailySession,
      });
      return dailySession;
    }
  } catch (error) {
    console.error("Error in getDailyRewards:", error);
    throw error;
  }
}

export async function claimDailyRewards(userId) {
  try {
  

    let userSession = await dbQuery.getDailyRewards(userId);

    if (userSession.length === 0) return "No user session found";
    const dailySession = userSession[0].dailySession;

    for (let index = 0; index < dailySession.days.length; index++) {
      let day = dailySession.days[index];

      if (day.isClaimed===false && day.canClaim) {
        day.isClaimed = true;
        day.canClaim = false;
        day.claimedTimeStamp = Math.floor(Date.now() / 1000);

        // Get reward
        let rewards = await RewardsValues();
        let reward = rewards[index].value;
        let currency = rewards[index].currencyType;


        dailySession.days[index] = day;
        dailySession.lastClaimDay = index;
        
        // Add reward to user balance
        await bank.updateCurrency(userId, reward, currency, "credit", bank.transactiontype.dailyRewards);
        await dbQuery.updateDailyRewards({
          userId: userId,
          dailySession: dailySession,
        });
        console.log("Daily reward claimed");
        console.log(rewards[index].currencyType);
        return "Daily reward claimed";
      }
    }
    return "No claimable daily reward found";
  } catch (error) {
    console.error("Error in claimDailyRewards:", error);
    throw error;
  }
}

