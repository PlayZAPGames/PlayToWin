import {handler} from "../controllers/referral.js";
import prisma from "../prisma/db.js";
import { bot } from "../bot-handlers/bot.js";
import * as bank from "../utility/walletService.js";

export async function Login(tgid, username, referralCode) {
  // Find the user by email

  console.log(tgid);
  let user = await prisma.users.findUnique({
    where: { tgid: tgid },
  });

  if (user === null) {
    user = await prisma.users.create({
      data: {
        tgid: tgid,
        lastActive: Math.floor(Date.now() / 1000),
      },
    });
    let uid = user.id;

    // Joining reward
    let reward = await prisma.master.findUnique({
      where: { key: "joinReward" },
    });
    await bank.updateCurrency(uid, parseInt(reward.data1.virtual1), "virtual1", "credit",bank.transactiontype.loginBonus);


    // Check if referral code exists
    if (referralCode) {
      let result = await handler(uid, referralCode);
      if(result){
        await bot.telegram.sendAnimation(referralCode, "https://tenor.com/view/little-green-men-dance-dance-moves-gif-15787042665329784016", {
          parse_mode: "HTML",
          caption: `🎉  Congrats! You have received a referral reward!\n\nYour friend ${username} joined PlayZap Games bot from your invitation link, keep inviting more friends to increase your earnings🤑`,
        });
      }
    }
  }
  return user;
};
