import prisma from "../prisma/db.js";
import { statusCodes, responseMessages } from "../helpers/index.js";
import { logActivity } from "./activityServices.js";
import { decrypt } from "../utility/cypher.js";

/**
 * Updates the virtual currency balance for a user based on the specified amount, currency, and operation.
 *
 * @param {number} userId - The ID of the user whose virtual currency is being updated.
 * @param {number} amount - The amount by which the virtual currency balance will be updated.
 * @param {string} currency - The currency type ("virtual1" or "virtual2") in which the update will be made.
 * @param {string} operation - The operation type ("credit" or "debit") to perform on the virtual currency.
 * @return {Promise<void>} A promise that resolves when the virtual currency is successfully updated.
 *
 * await updateVirtualCurrency(userId, amount, 'virtual1', 'credit');
 * await updateVirtualCurrency(userId, amount, 'virtual1', 'debit');
 * await updateVirtualCurrency(userId, amount, 'virtual2', 'debit');
 * await updateVirtualCurrency(userId, amount, 'virtual2', 'credit');
 */

async function updateCurrency(userId, amount, currency, operation, transactionType, transactionHash = null, status = null) {
  console.log("updateCurrency called", userId, amount, currency, operation, transactionType, transactionHash, status);


  let to_currency = currency;

  if (transactionType === 'v1ToCore') {
    to_currency = 'virtual2';
  }



  // Validate the currency parameter
  if (!(currency in currencies)) {
    return { errorCode: 1001, message: "Invalid currency type" };
  }

  // Validate the operation parameter
  if (!(operation in operations)) {
    return { errorCode: 1002, message: "Invalid operation type" };
  }

  // Fetch the current user data
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });

  // Check if the user exists
  if (!user) {
    return { errorCode: 1004, message: "User not found" };
    // throw new Error("User not found");
  }
  // Validate amount is positive
  if (amount <= 0) {
    return { errorCode: 1006, message: "Amount must be positive" };
  }

  // Calculate the newBalance
  let newBalance = 0;
  if (operation === operations.debit) {
    newBalance = user[currency] - amount;
    if (newBalance < 0) {
      return { errorCode: 1003, message: "Insufficient funds" };
    }
  } else if (operation === operations.credit) {
    newBalance = user[currency] + amount;
  }
  const data = {};
  data[currency] = newBalance;
  // Update the user's virtual currency
  await prisma.users.update({
    where: {
      id: userId,
    },
    data: data,
  });

  //CREATE TRANSACTION
  try {
    await prisma.userTransactions.create({
      data: {
        user_id: userId,
        amount: amount,
        currency: currency,
        operation: operation,
        transaction_hash: transactionHash,
        transaction_type: transactionType,
        status: status
      },
    });
  } catch (error) {
    if (error.code === "P2002") {  // P2002 is the Prisma error code for unique constraint violation
      console.log("Duplicate transaction hash detected.");
      return { errorCode: 1005, message: "Duplicate transaction hash detected." };
    } else {
      console.log("----><>")
      throw error;
    }
  }
  //CREATE wallet history
  const walletData = await prisma.userWalletHistory.create({
    data: {
      user_id: userId,
      // item_id: null, // or gameId/tournamentId if applicable
      from_amount: user[currency],
      from_currency: currency,
      to_amount: newBalance,
      to_currency: to_currency,
      operation: operation,
      transaction_hash: transactionHash,
      currency: currency,
      amount: amount,
      transaction_type: transactionType,
      status: status,
    },
  });

  await logActivity(
    userId,
    transactionType,
    { amount, currency, operation, transactionType, transactionHash, status },
    walletData.id,
    walletData.id
  );


  data['wallet'] = walletData;


  return data;
}

async function getBalance(userId) {
  // Fetch the current user data
  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });
  // Check if the user exists
  if (!user) {
    const err = new Error(responseMessages.BAD_REQUEST);
    err.statusCode = statusCodes.BAD_REQUEST;
    throw err;
  }
  return { "virtual1": user.virtual1, "virtual2": user.virtual2 === undefined ? 0 : user.virtual2 };
}


const currencies = Object.freeze({
  virtual1: "virtual1",
  virtual2: "virtual2",
});

const operations = Object.freeze({
  credit: "credit",
  debit: "debit",
  swap: "swap",
  withdraw: "withdraw",
});

const transactiontype = Object.freeze({
  shop_item_purchase: "shop_item_purchase",
  virtual1_core_conversion: "v1ToCore",
  matchEntry: "matchEntry",
  dailyRewards: "dailyRewards",
  referral: "referral",
  spinWheel: "spinWheel",
  zclub: "zclub",
  loginBonus: "loginBonus",
  withdrawCore: "withdrawCore",
  withdrawPzp: "withdrawPzp",
  gameWinReward: "gameWinReward",
  taskCompletion: "taskCompletion",
  table: "boughtTable",
  pawn: "boughtDice",
  dice: "boughtPawn",
  avatar: "boughtAvatar",
  emoji: "boughtEmoji",
  weeklyReward: "weeklyReward",
  coreToBsc: "coreToBsc",
  bscToCore: "bscToCore",

});


async function getUserWallet(userId) {
  // Fetch only the fields you need
  const wallet = await prisma.wallets.findUnique({
    where: { id: userId },
    select: {
      pzpEvmWallet: true,
      evmWalletPapi: true
    }
  });

  

  if (!wallet) {
    const err = new Error(responseMessages.BAD_REQUEST);
    err.statusCode = statusCodes.BAD_REQUEST;
    throw err;
  }
  // Rename keys before returning
  return {
    walletAddress: wallet.pzpEvmWallet,
    user_papi: decrypt(wallet.evmWalletPapi, process.env.EncryptionKey)
  };
}


export { updateCurrency, getBalance, getUserWallet, currencies, operations, transactiontype };
