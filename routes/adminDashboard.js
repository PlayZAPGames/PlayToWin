import prisma from "../prisma/db.js";
import *  as dbQuery from "../database/dbQuery.js";
import { AdminMiddleware } from "../utility/tokenAuthService.js";
import *  as bank from "../utility/walletService.js";
import { numberToSlug, slugToNumber, slugType } from "../utility/cypher.js";
import express from "express";
const router = express.Router();
import { deductEvmBalance, transferPzpReward, transferEvmNativeBalance } from "../controllers/shop.js";
import { makeResponse, responseMessages, statusCodes } from "../helpers/index.js";
const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;
// import { approveWithdrawal } from "../utility/blockChainServices.js";

import dotenv from 'dotenv';

dotenv.config();

router.get("/admin/whitelisteIds", async function (req, res) {
  let data = await prisma.master.findUnique({
    where: {
      key: "admins",
    },
  });
  return res.status(200).json({ status: 1, ids: data.data1.ids });
});
router.get("/admin/requests/withdraw", AdminMiddleware, async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.perPage) || 10;
  const skip = (page - 1) * limit;

  // Extract query parameters for filtering
  const {
    startDate,
    endDate,
    status = "pending", // Default to pending as per original
    id,
    userId,
  } = req.query;

  // Build filters dynamically
  const filters = {
    transaction_type: bank.transactiontype.withdrawPzp,
  };

  // Add status filter (defaults to "pending" but can be overridden)
  if (status) {
    filters.status = String(status);
  }

   if (id) {
    let numericId = Number(id);
    if (isNaN(numericId)) {
      // Try decoding as slug
      const decodedId = slugToNumber(id, slugType.withdraw);
      if (decodedId) numericId = decodedId;
    }
    if (!isNaN(numericId)) {
      filters.id = numericId;
    }
  }
  if (userId) {
    filters.user_id = Number(userId);
  }

  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) {
      filters.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filters.createdAt.lte = new Date(end);
    }
  }

  try {
    const data = await prisma.userWalletHistory.findMany({
      where: filters,
      include: {
        User: {
          select: {
            username: true,
            Wallets: {
              select: {
                pzpEvmWallet: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    // Get total count for pagination
    const totalCount = await prisma.userWalletHistory.count({
      where: filters,
    });

    return res.status(200).json({
      status: 1,
      data: data,
      pagination: {
        page,
        limit: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return res.status(500).json({
      status: 0,
      message: "Internal server error",
    });
  }
});

router.get("/admin/requests/withdrawPzp", AdminMiddleware, async function (req, res) {
  console.log("--------skdlaksdkl");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.perPage) || 10;

  // Calculate the offset
  const skip = (page - 1) * limit;

  let data = await prisma.userWalletHistory.findMany({
    where: {
      status: "pending",
      transaction_type: bank.transactiontype.withdrawPzp,
    },
    include: {
      User: {
        select: {
          username: true,
          Wallets: {
            select: {
              pzpEvmWallet: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: skip,
  });
  return res.status(200).json({ status: 1, data: data });
});
router.get("/admin/requests/swapV2_core", AdminMiddleware, async function (req, res) {
  let data = await prisma.userWalletHistory.findMany({
    where: {
      status: "pending",
      transaction_type: bank.transactiontype.virtual2_core_conversion,
    },
  });
  console.log(data);

  return res.status(200).json({ status: 1, data: data });
});

// approve withdraw
// router.post("/admin/withdrawal/approve", AdminMiddleware, async function (req, res) {
//   const { txnId } = req.body;
//   let type = bank.transactiontype.withdrawPzp;
//   let data = await prisma.userWalletHistory.findFirst({
//     where: {
//       id: txnId,
//       status: "pending",
//       transaction_type: type,
//     },
//     include: {
//       User: {
//         include: {
//           Wallets: {
//             select: {
//               pzpEvmWallet: true,
//               evmWalletPapi: true,
//             },
//           },
//         },
//       },
//     },
//   });


//   if (data.length == 0) {
//     return res.status(404).json({ status: 0, message: "no pending transactions" });
//   }


//   let Amount = data.to_amount;
//   let CommissionAmount = +(data.from_amount - data.to_amount).toFixed(4);
//   let fromAddress = data.User.Wallets.pzpEvmWallet;
//   let user = data.User;
//   let RecieverAddress = data.to_address;

//   const payload = {
//     Amount,
//     CommissionAmount,
//     fromAddress,
//     user,
//     RecieverAddress,
//   }


//   if (Amount <= 0) {
//     return res.status(500).json({ status: 0, message: "amount can not be negative or zero" });
//   }

//   const withdrawalResult = await approveWithdrawal({payload})
//   console.log("withdrawalResult", withdrawalResult);


//   if (!withdrawalResult.success) {
//     return res.status(500).json({ status: 0, message: withdrawalResult.error || "Native balance top-up failed" });
//   }

//   try {
//     await prisma.userWalletHistory.update({
//       where: {
//         id: txnId,
//       },
//       data: {
//         status: "success",
//         transaction_hash: withdrawalResult.txHash,
//       },
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json(err);
//   }

//  return res.status(200).json({ status: 1, message: "withdraw request processed sucessfully", data: withdrawalResult.txHash });
// });

// router.post("/admin/withdrawal/reject", AdminMiddleware, async function (req, res) {
//   const { txnId } = req.body;
//   try {
//     await prisma.userWalletHistory.update({
//       where: {
//         id: txnId,
//       },
//       data: {
//         status: "rejected",
//         transaction_hash: "rejected by admin",
//       },
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json(err);
//   }

//  return res.status(200).json({ status: 1, message: "withdraw request rejected sucessfully" });
// });

// router.post("/admin/approve/rewardSwap", AdminMiddleware, async function (req, res) {
//   const { txnId } = req.body;
//   console.log("txnId", txnId);

//   let data = await prisma.userWalletHistory.findFirst({
//     where: {
//       id: txnId,
//       status: "pending",
//       transaction_type: bank.transactiontype.virtual2_core_conversion,
//       to_currency: bank.currencies.pzp_core,
//     },
//     include: {
//       User: { include: { Wallets: { select: { pzpEvmWallet: true } } } },
//     },
//   });

//   if (data == null) {
//     return res.status(500).json({ status: 0, message: "no pending transactions" });
//   }

//   console.log("data", data);

//   let amount = data.to_amount;
//   let id = data.id;

//   if (amount <= 0) {
//     return res.status(500).json({ status: 0, message: "amount can not be negative or zero" });
//   }

//   let result2 = await transferPzpReward(data.User.Wallets.pzpEvmWallet, amount, process.env.EncryptionKey);
//   console.log("result2", result2);
//   if (result2.status == 500) {
//     try {
//       await prisma.userWalletHistory.update({
//         where: {
//           id: txnId,
//         },
//         data: {
//           status: "failed",
//           transaction_hash: result2,
//         },
//       });
//     } catch (err) {
//       console.log(err);
//       return res.status(500).json(err);
//     }

//     return res.status(500).json(result2);
//   }

//   // update entry in user wallet history
//   try {
//     await prisma.userWalletHistory.update({
//       where: {
//         id: txnId,
//       },
//       data: {
//         status: "success",
//         transaction_hash: result2.msg.hash,
//       },
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json(err);
//   }

//   let slug = numberToSlug(id, slugType.swap);
//   return res.status(200).json({ result2, slug });
// });
// router.get("/admin/leaderboard-rewards", AdminMiddleware, async function (req, res) {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   const {
//     startDate,
//     endDate,
//     status,
//     transactionId,
//     userId,
//   } = req.query;

//   // Build filters dynamically
//   const filters = {
//     transaction_type: bank.transactiontype.weeklyReward,
//   };

//   if (status) {
//     filters.status = String(status);
//   }

//   if (transactionId) {
//     filters.id = Number(transactionId);
//   }

//   if (userId) {
//     filters.user_id = Number(userId);
//   }

//   if (startDate || endDate) {
//     filters.createdAt = {};
//     if (startDate) {
//       filters.createdAt.gte = new Date(startDate);
//     }
//     if (endDate) {
//       const end = new Date(endDate);
//       end.setHours(23, 59, 59, 999);
//       filters.createdAt.lte = new Date(end);
//     }
//   }

//   const data = await prisma.userWalletHistory.findMany({
//     where: filters,
//     orderBy: {
//       createdAt: "desc",
//     },
//     include: {
//       User: { select: { username: true } },
//     },
//     take: limit,
//     skip: skip,
//   });

//   // Optional: total count for pagination
//   const totalCount = await prisma.userWalletHistory.count({
//     where: filters,
//   });

//   return res.status(200).json({
//     status: 1,
//     data,
//     pagination: {
//       page,
//       limit: limit,
//       total: totalCount,
//       totalPages: Math.ceil(totalCount / limit),
//     },
//   });
// });
// router.get("/admin/swap-list", AdminMiddleware, async function (req, res) {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.perPage) || 10;
//     const txType = req.query.txType; // Can be empty, "coreToBsc", or "bscToCore"

//     // Calculate the offset
//     const skip = (page - 1) * limit;

//     // Build transaction types array based on txType parameter
//     let transactionTypes = [];

//     if (txType === 'coreToBsc') {
//       transactionTypes = ['coreToBsc'];
//     } else if (txType === 'bscToCore') {
//       transactionTypes = ['bscToCore'];
//     } else {
//       // If empty or any other value, include both types
//       transactionTypes = ['coreToBsc', 'bscToCore'];
//     }

//     let data = await prisma.userWalletHistory.findMany({
//       where: {
//         transaction_type: {
//           in: transactionTypes
//         }
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//       include: {
//         User: { select: { username: true } },
//       },
//       take: limit,
//       skip: skip,
//     });

//     // Get total count for pagination
//     const totalCount = await prisma.userWalletHistory.count({
//       where: {
//         transaction_type: {
//           in: transactionTypes
//         }
//       },
//     });

//     return res.status(200).json({
//       status: 1,
//       data: data,
//       pagination: {
//         currentPage: page,
//         perPage: limit,
//         total: totalCount,
//         totalPages: Math.ceil(totalCount / limit)
//       }
//     });
//   } catch (error) {
//     console.error("Error in swap-list:", error);
//     return res.status(500).json({ status: 0, message: "Internal server error" });
//   }
// });





export default router;
