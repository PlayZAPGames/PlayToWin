import express from "express";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { validators } from "../middleware/validateResource/index.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
import prisma from "../prisma/db.js";

import {
  getUserBalance,
  createDepositRequest,
  createWithdrawalRequest,
  getTransactionHistory,
  getUserPaymentRequests,
  PAYMENT_CONFIG
} from "../utility/paymentService.js";

const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;
const router = express.Router();

/**
 * GET /payments/balance
 * Get user's current cash and bonus balances
 */
router.get("/payments/balance", UserMiddleware, handleRequest(async (req, res) => {
  const balance = await getUserBalance(req.userId);
  return makeResponse(res, SUCCESS, true, "Balance retrieved successfully", balance);
}));

/**
 * GET /payments/config
 * Get payment configuration (limits, fees, etc.)
 */
router.get("/payments/config", UserMiddleware, handleRequest(async (req, res) => {
  return makeResponse(res, SUCCESS, true, "Payment configuration", {
    minDeposit: PAYMENT_CONFIG.MIN_DEPOSIT,
    minWithdrawal: PAYMENT_CONFIG.MIN_WITHDRAWAL,
    maxWithdrawal: PAYMENT_CONFIG.MAX_WITHDRAWAL,
    maxDailyWithdrawal: PAYMENT_CONFIG.MAX_DAILY_WITHDRAWAL,
    withdrawalFee: PAYMENT_CONFIG.WITHDRAWAL_FEE,
  });
}));

/**
 * POST /payments/deposit-request
 * User requests a cash deposit
 */
router.post("/payments/deposit-request", 
  UserMiddleware, 
  validators('DEPOSIT_REQUEST'),
  handleRequest(async (req, res) => {
    const { amount, paypalEmail, proofImageUrl } = req.body;

    const request = await createDepositRequest(
      req.userId,
      parseFloat(amount),
      paypalEmail,
      proofImageUrl
    );

    return makeResponse(res, SUCCESS, true, "Deposit request created successfully. Awaiting admin approval.", {
      requestId: request.id,
      amount: request.amount,
      status: request.status,
      requestedAt: request.requestedAt,
    });
  })
);

/**
 * POST /payments/withdrawal-request
 * User requests a cash withdrawal
 */
router.post("/payments/withdrawal-request", 
  UserMiddleware,
  validators('WITHDRAWAL_REQUEST'),
  handleRequest(async (req, res) => {
    const { amount, paypalEmail } = req.body;

    const request = await createWithdrawalRequest(
      req.userId,
      parseFloat(amount),
      paypalEmail
    );

    return makeResponse(res, SUCCESS, true, "Withdrawal request created successfully. Awaiting admin approval.", {
      requestId: request.id,
      amount: request.amount,
      status: request.status,
      requestedAt: request.requestedAt,
    });
  })
);

/**
 * GET /payments/requests
 * Get user's payment requests (deposits and withdrawals)
 */
router.get("/payments/requests", UserMiddleware, handleRequest(async (req, res) => {
  const { status } = req.query;
  
  const requests = await getUserPaymentRequests(req.userId, status);

  return makeResponse(res, SUCCESS, true, "Payment requests retrieved successfully", {
    requests,
    count: requests.length,
  });
}));

/**
 * GET /payments/requests/:id
 * Get specific payment request details
 */
router.get("/payments/requests/:id", UserMiddleware, handleRequest(async (req, res) => {
  const requestId = parseInt(req.params.id);

  const request = await prisma.paymentRequest.findFirst({
    where: {
      id: requestId,
      userId: req.userId, // Ensure user can only see their own requests
    },
    include: {
      ProcessedByAdmin: {
        select: {
          id: true,
          name: true,
        }
      },
      CashTransactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!request) {
    return makeResponse(res, BAD_REQUEST, false, "Payment request not found");
  }

  return makeResponse(res, SUCCESS, true, "Payment request details", request);
}));

/**
 * GET /payments/transactions
 * Get user's transaction history
 */
router.get("/payments/transactions", UserMiddleware, handleRequest(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const history = await getTransactionHistory(req.userId, limit, offset);

  return makeResponse(res, SUCCESS, true, "Transaction history retrieved successfully", history);
}));

/**
 * PUT /payments/paypal-email
 * Update user's PayPal email
 */
router.put("/payments/paypal-email", 
  UserMiddleware,
  validators('UPDATE_PAYPAL_EMAIL'),
  handleRequest(async (req, res) => {
    const { paypalEmail } = req.body;

    // Validate email format
    if (!paypalEmail || !paypalEmail.includes('@')) {
      return makeResponse(res, BAD_REQUEST, false, "Invalid PayPal email format");
    }

    const user = await prisma.users.update({
      where: { id: req.userId },
      data: {
        paypalEmail,
        lastActive: Math.floor(Date.now() / 1000),
      },
      select: {
        id: true,
        paypalEmail: true,
      }
    });

    return makeResponse(res, SUCCESS, true, "PayPal email updated successfully", {
      paypalEmail: user.paypalEmail,
    });
  })
);

/**
 * GET /payments/stats
 * Get user's payment statistics
 */
router.get("/payments/stats", UserMiddleware, handleRequest(async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { id: req.userId },
    select: {
      totalDeposited: true,
      totalWithdrawn: true,
      cashBalance: true,
      bonusBalance: true,
    }
  });

  const [totalEarnings, totalSpent, pendingWithdrawals] = await Promise.all([
    // Total earnings from games
    prisma.cashTransaction.aggregate({
      where: {
        userId: req.userId,
        type: 'game_win',
      },
      _sum: { amount: true }
    }),
    // Total spent on game entries
    prisma.cashTransaction.aggregate({
      where: {
        userId: req.userId,
        type: 'game_entry',
      },
      _sum: { amount: true }
    }),
    // Pending withdrawal requests
    prisma.paymentRequest.aggregate({
      where: {
        userId: req.userId,
        type: 'withdrawal',
        status: 'pending',
      },
      _sum: { amount: true }
    })
  ]);

  return makeResponse(res, SUCCESS, true, "Payment statistics", {
    currentBalance: {
      cash: parseFloat(user.cashBalance.toFixed(2)),
      bonus: parseFloat(user.bonusBalance.toFixed(2)),
      total: parseFloat((user.cashBalance + user.bonusBalance).toFixed(2)),
    },
    lifetime: {
      deposited: parseFloat(user.totalDeposited.toFixed(2)),
      withdrawn: parseFloat(user.totalWithdrawn.toFixed(2)),
      earnings: parseFloat((totalEarnings._sum.amount || 0).toFixed(2)),
      spent: parseFloat(Math.abs(totalSpent._sum.amount || 0).toFixed(2)),
    },
    pending: {
      withdrawals: parseFloat((pendingWithdrawals._sum.amount || 0).toFixed(2)),
    }
  });
}));

/**
 * DELETE /payments/requests/:id
 * Cancel a pending payment request
 */
router.delete("/payments/requests/:id", UserMiddleware, handleRequest(async (req, res) => {
  const requestId = parseInt(req.params.id);

  const request = await prisma.paymentRequest.findFirst({
    where: {
      id: requestId,
      userId: req.userId,
    }
  });

  if (!request) {
    return makeResponse(res, BAD_REQUEST, false, "Payment request not found");
  }

  if (request.status !== 'pending') {
    return makeResponse(res, BAD_REQUEST, false, `Cannot cancel ${request.status} request`);
  }

  await prisma.paymentRequest.update({
    where: { id: requestId },
    data: {
      status: 'cancelled',
      processedAt: new Date(),
    }
  });

  return makeResponse(res, SUCCESS, true, "Payment request cancelled successfully");
}));

export default router;
