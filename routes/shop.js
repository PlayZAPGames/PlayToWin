import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const shopList = require('../controllers/shopList.json');
import express from "express";
const router = express.Router();
import { UserMiddleware, AdminMiddleware } from "../utility/tokenAuthService.js";
import  *  as bank  from "../utility/walletService.js";
import { numberToSlug, slugType } from "../utility/cypher.js";
import {
  ticketConversion,
  convertTicketsToPZP,
  createUserWallet,
  withdrawPzpRequest,
  deductEvmBalance,
  transferEvmNativeBalance,
  checkSwapLimit,
  checkWithdrawLimit,
  transferPzpReward
} from "../controllers/shop.js";
import prisma from "../prisma/db.js";
import { handleRequest } from '../helpers/requestHandler/asyncHandler.js';
import { makeResponse } from '../helpers/index.js';
import { validators } from "../middleware/validateResource/index.js";


// global lock map
const userLocks = new Map();

async function withUserLock(userId, task) {
  if (userLocks.get(userId)) {
    throw new Error("A swap is already in progress for this user.");
  }

  userLocks.set(userId, true);
  try {
    return await task();
  } finally {
    userLocks.delete(userId);
  }
}


router.get("/getShopList", async function (req, res) {
  return res.status(200).json(shopList);
});

router.post("/updateOnchainTransaction", UserMiddleware, async function (req, res) {
  const { item_id, transactionHash } = req.body;
  const userId = req.userId;
  const shop = shopList.find((shop) => shop.item_id === item_id);
  const amount = shop?.price || 0;

  if (!amount || !item_id || !transactionHash) {
    return res.status(500).json("amount, item_id, transactionHash are required");
  }
  if (amount <= 0) return res.status(500).json("amount should be greater than 0");
  if (item_id == "" || item_id == null) return res.status(500).json("item_id is null or empty");

  // let r = await bank.updateCurrency(
  //   userId,
  //   amount,
  //   bank.currencies.pzp_ton,
  //   bank.operations.debit,
  //   bank.transactiontype.shop_item_purchase,
  //   transactionHash,
  //   "pending"
  // );

  for (const shop of shopList) {
    if (shop.item_id === item_id) {
      let history = await prisma.userWalletHistory.create({
        data: {
          user_id: userId,
          item_id: item_id,
          from_amount: amount,
          from_currency: bank.currencies.pzp_ton,
          operation: bank.operations.debit,
          transaction_type: bank.transactiontype.shop_item_purchase,
          transaction_hash: transactionHash,
          status: "pending",
          to_amount: shop.quantity,
          to_currency: shop.reward_type,
        },
      });

      // reward user with gems
      try {
        await bank.updateCurrency(userId, shop.quantity, bank.currencies.virtual1, bank.operations.credit, bank.transactiontype.shop_item_purchase, transactionHash);
      } catch (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      // update wallet history with reward and status to success
      try {
        await prisma.userWalletHistory.update({
          where: {
            id: history.id,
          },
          data: {
            status: "success",
          },
        });
      } catch (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      console.log("transactionHash", transactionHash);
      return res.status(200).json({ result2: "Rewarded", slug: numberToSlug(history.id, slugType.transactionHash) });
    }
  }

  // This will only be hit if no item_id is found in shopList
  return res.status(500).json({ result2: "item_id not found" });
});

router.get("/wallet-history", UserMiddleware, async function (req, res) {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch cash transactions
    const [cashTotal, cashHistory] = await Promise.all([
      prisma.cashTransaction.count({ where: { userId } }),
      prisma.cashTransaction.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    // Fetch gems/virtual currency transactions
    const [gemsTotal, gemsHistory] = await Promise.all([
      prisma.userTransactions.count({ where: { user_id: userId } }),
      prisma.userTransactions.findMany({
        where: { user_id: userId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    // Normalize and merge histories
    const cashMapped = cashHistory.map(item => ({
      id: item.id,
      type: item.type,
      amount: item.amount,
      currency: item.balanceType === 'bonus' ? 'bonus' : 'cash',
      description: item.description,
      balanceBefore: item.balanceBefore,
      balanceAfter: item.balanceAfter,
      createdAt: item.createdAt,
      source: 'cash',
      metadata: item.metadata
    }));
    const gemsMapped = gemsHistory.map(item => ({
      id: item.id,
      type: item.transaction_type,
      amount: item.amount,
      currency: item.currency,
      description: item.operation,
      balanceBefore: null,
      balanceAfter: null,
      createdAt: item.createdAt,
      source: 'gems',
      metadata: {}
    }));

    // Merge and sort by date desc
    const merged = [...cashMapped, ...gemsMapped].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paged = merged.slice(0, limit); // Only show up to limit per page

    return res.status(200).json({
      success: true,
      data: {
        history: paged,
        pagination: {
          totalRecords: cashTotal + gemsTotal,
          pages: Math.ceil((cashTotal + gemsTotal) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet history",
    });
  }
});

//Swap API
router.post("/swap", UserMiddleware, validators('SWAP'), handleRequest (async function (req, res) {
    const userId = req.userId;
    const amount = req.body.amount;
    const swapType = req.body.swapType;

    
  const swap = await prisma.master.findUnique({
    where: { key: "swap" },
  });

  if(swap.data1.swap_maintenance){
    return res.status(400).json({ message: "Under Maintenance" });
  }
    
    let result = await withUserLock(userId, async () => {
      return await ticketConversion(userId, amount, swapType);
    });
    return makeResponse(res, 200, true, "Points swap sucessfully", result)
}));



router.post("/check-swap-limit", UserMiddleware, async function (req, res) {
  const userId = req.userId;
  const amount = req.body.amount;
  const swapType = req.body.swapType;

  let result = await checkSwapLimit(userId, swapType, amount);
  return res.status(200).send({ swapLimit: result });
});

router.get("/ticketConversion", async function (req, res) {
  let result = await convertTicketsToPZP(1);
  return res.status(200).json({ pzp: result });
});

router.get("/getWithdrawLimit", UserMiddleware, async function (req, res) {
  const userId = req.userId;
  const amount = req.headers["amount"];

  let result = await checkWithdrawLimit(userId, amount);
  return res.status(200).send({ withdrawLimit: result });
});

router.post("/wallet/withdraw", UserMiddleware, async function (req, res) {
  const { amount, toAddress } = req.body;
  const userId = req.userId;

  const wL = await prisma.master.findUnique({
    where: { key: "walletWithdraw" },
  });

  if(wL.data1.withdraw_maintenance){
    return res.status(400).json({ message: "Under Maintenance" });
  }

  let result = await withdrawPzpRequest(userId, amount, toAddress);
  return res.status(200).json({ status: 1, data: result });
});

// ---- evm chain
router.post("/purchaseWithEvm", UserMiddleware, async function (req, res) {
  const { item_id } = req.body;
  const userId = req.userId;
  const shop = shopList.find((shop) => shop.item_id === item_id);
  console.log("shop.price");
  console.log(shop.price);
  const amount = shop?.price || 0;
  console.log(amount);

  const user = await prisma.users.findUnique({
    where: {
      id: userId,
    },
    include: {
      Wallets: true,
    },
  });

  if (!user) return res.status(500).json("user not found");
  if (amount <= 0) return res.status(500).json("amount should be greater than 0");
  if (!user.Wallets?.pzpEvmWallet) return res.status(500).json("User don't have connected evm wallet");
  if (item_id == "" || item_id == null) return res.status(500).json("item_id is null or empty");

  console.log("user.pzpEvmWallet", user.Wallets.pzpEvmWallet);
  // check user native balance using getEvmBalance api
  let result = await getEvmBalance(user.Wallets.pzpEvmWallet);
  let data = result.result.data;

  if (result.status == 500) return res.status(500).json(result.msg);
  if (data.balance < amount) return res.status(500).json("insufficient balance");
  if (data.nativeBalance < 0.002) {
    console.log("insuff native, transfering native....");
    // transfer native
    let result = await transferEvmNativeBalance(user, process.env.EncryptionKey, 0.002);
    if (result.status == 500) return res.status(500).json(result.msg);
  }
  console.log("deductEvmBalance....");
  let result2 = await deductEvmBalance(user.Wallets.evmWalletPapi, amount, process.env.EncryptionKey);
  if (result2.status == 500) return res.status(500).json(result.msg);

  // entry in user wallet history
  let transactionHash = result2.msg.txhash;
  console.log("transactionHash", transactionHash);
  // let r = await bank.updateCurrency(
  //   userId,
  //   amount,
  //   bank.currencies.pzp_core,
  //   bank.operations.debit,
  //   bank.transactiontype.shop_item_purchase,
  //   transactionHash
  // );

  let history;
  try {
    history = await prisma.userWalletHistory.create({
      data: {
        user_id: userId,
        item_id: item_id,
        from_amount: amount,
        from_currency: bank.currencies.pzp_core,
        operation: bank.operations.debit,
        transaction_type: bank.transactiontype.shop_item_purchase,
        transaction_hash: transactionHash,
        status: "pending",
        to_amount: shop.quantity,
        to_currency: shop.reward_type,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }

  // reward user with gems
  try {
    await bank.updateCurrency(userId, shop.quantity, bank.currencies.virtual1, bank.operations.credit, bank.transactiontype.shop_item_purchase, transactionHash);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }

  // update wallet history with reward and status to success
  try {
    await prisma.userWalletHistory.update({
      where: {
        id: history.id,
      },
      data: {
        status: "success",
        to_amount: shop.quantity,
        to_currency: bank.currencies.virtual1,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }

  let slug = numberToSlug(history.id, slugType.purchase);
  return res.status(200).json({ result2, slug });
});


router.get("/get-evm-balance", handleRequest( async function (req, res) {
  let result = await getEvmBalance(req.query.walletaddress);
  // return res.status(result.status).json(result);
  const response = {
    status: result.status,
    ...result.data
  };
 return makeResponse(res, 200, true, result.msg, {...response})
}));

router.post("/setTonWallet", UserMiddleware, async function (req, res) {
  const { tonWallet } = req.body;
  const user_id = req.userId;
  await prisma.wallets.upsert({
    where: {
      id: user_id,
    },
    update: {
      tonWallet: tonWallet, // Fields to update if the record exists
      isTonActive: true,
    },
    create: {
      id: user_id,
      tonWallet: tonWallet, // Fields to create if the record doesn't exist
      isTonActive: true,
    },
  });

  res.status(200).json({ msg: "wallet updated" });
});

router.get("/get-or-create-user-evm-wallet", UserMiddleware, handleRequest( async function (req, res) {
  const userId = req.userId;
  let wallet = await createUserWallet(userId);

  return makeResponse(res, 200, true, "EVM wallet created successfully", {
    evm_wallet: wallet,
    user_id: userId
  });
}));

export default router;
