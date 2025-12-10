import express from "express";
import { AdminMiddleware } from "../../utility/tokenAuthService.js";
import { validators } from "../../middleware/validateResource/index.js";
import { handleRequest } from "../../helpers/requestHandler/asyncHandler.js";
import { makeResponse, statusCodes, responseMessages } from '../../helpers/index.js';
import prisma from "../../prisma/db.js";
import { logActivity } from "../../utility/activityServices.js";

const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;
const router = express.Router();

/**
 * GET /admin/payments/pending
 * Get all pending payment requests
 */
router.get("/admin/payments/pending", AdminMiddleware, handleRequest(async (req, res) => {
  const { type } = req.query; // Filter by 'deposit' or 'withdrawal'

  const where = { status: 'pending' };
  if (type && ['deposit', 'withdrawal'].includes(type)) {
    where.type = type;
  }

  const requests = await prisma.paymentRequest.findMany({
    where,
    orderBy: { requestedAt: 'asc' }, // Oldest first
    include: {
      User: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
          cash: true,
          gems: true,
          bonusBalance: true,
          totalDeposited: true,
          totalWithdrawn: true,
          kycVerified: true,
          status: true,
        }
      }
    }
  });

  return makeResponse(res, SUCCESS, true, "Pending payment requests", {
    requests,
    count: requests.length,
  });
}));

/**
 * GET /admin/payments/history
 * Get all payment requests with filtering
 */
router.get("/admin/payments/history", AdminMiddleware, handleRequest(async (req, res) => {
  const { status, type, userId, limit = 100, offset = 0 } = req.query;

  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (userId) where.userId = parseInt(userId);

  const [requests, total] = await Promise.all([
    prisma.paymentRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        User: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            cash: true,
          }
        },
        ProcessedByAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    }),
    prisma.paymentRequest.count({ where })
  ]);

  return makeResponse(res, SUCCESS, true, "Payment history", {
    requests,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset),
    hasMore: (parseInt(offset) + parseInt(limit)) < total
  });
}));

/**
 * GET /admin/payments/request/:id
 * Get detailed information about a specific payment request
 */
router.get("/admin/payments/request/:id", AdminMiddleware, handleRequest(async (req, res) => {
  const requestId = parseInt(req.params.id);

  const request = await prisma.paymentRequest.findUnique({
    where: { id: requestId },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
          cash: true,
          bonusBalance: true,
          totalDeposited: true,
          totalWithdrawn: true,
          kycVerified: true,
          status: true,
          paypalEmail: true,
          createdAt: true,
        }
      },
      ProcessedByAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
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

  // Get user's recent transactions
  const recentTransactions = await prisma.cashTransaction.findMany({
    where: { userId: request.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Get user's payment history
  const paymentHistory = await prisma.paymentRequest.findMany({
    where: { userId: request.userId },
    orderBy: { requestedAt: 'desc' },
    take: 10,
  });

  return makeResponse(res, SUCCESS, true, "Payment request details", {
    request,
    userRecentTransactions: recentTransactions,
    userPaymentHistory: paymentHistory,
  });
}));

/**
 * POST /admin/payments/:id/approve
 * Approve a payment request (deposit or withdrawal)
 */
router.post("/admin/payments/:id/approve", 
  AdminMiddleware,
  validators('APPROVE_PAYMENT'),
  handleRequest(async (req, res) => {
    const requestId = parseInt(req.params.id);
    const { paypalTransactionId, adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            cash: true,
          }
        }
      }
    });

    if (!request) {
      return makeResponse(res, BAD_REQUEST, false, "Payment request not found");
    }

    if (request.status !== 'pending') {
      return makeResponse(res, BAD_REQUEST, false, `Cannot approve ${request.status} request`);
    }

    // Handle deposit approval
    if (request.type === 'deposit') {
      await prisma.$transaction(async (tx) => {
        // Update payment request
        await tx.paymentRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            processedAt: new Date(),
            processedBy: adminId,
            paypalTransactionId,
            adminNotes,
          }
        });

        // Add cash to user's balance
        await tx.users.update({
          where: { id: request.userId },
          data: {
            cash: { increment: request.amount },
            totalDeposited: { increment: request.amount },
          }
        });

        // Create transaction record
        await tx.cashTransaction.create({
          data: {
            userId: request.userId,
            amount: request.amount,
            type: 'deposit',
            balanceType: 'cash',
            balanceBefore: request.User.cash,
            balanceAfter: request.User.cash + request.amount,
            description: `Deposit approved: $${request.amount.toFixed(2)}`,
            paymentRequestId: requestId,
            metadata: { 
              paypalTransactionId,
              approvedBy: adminId 
            },
          }
        });
      });

      // Log activity
      await logActivity(
        request.userId,
        'deposit_approved',
        {
          amount: request.amount,
          requestId,
          approvedBy: adminId,
        },
        null,
        null
      );
    }

    // Handle withdrawal approval (just marks as approved, admin sends money manually)
    else if (request.type === 'withdrawal') {
      await prisma.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          processedAt: new Date(),
          processedBy: adminId,
          adminNotes,
        }
      });

      await logActivity(
        request.userId,
        'withdrawal_approved',
        {
          amount: request.amount,
          requestId,
          approvedBy: adminId,
          paypalEmail: request.paypalEmail,
        },
        null,
        null
      );
    }

    return makeResponse(res, SUCCESS, true, `${request.type} request approved successfully`);
  })
);

/**
 * POST /admin/payments/:id/complete
 * Mark withdrawal as completed (after sending money via PayPal)
 */
router.post("/admin/payments/:id/complete",
  AdminMiddleware,
  validators('COMPLETE_PAYMENT'),
  handleRequest(async (req, res) => {
    const requestId = parseInt(req.params.id);
    const { paypalTransactionId, adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: {
        User: {
          select: {
            id: true,
            cash: true,
          }
        }
      }
    });

    if (!request) {
      return makeResponse(res, BAD_REQUEST, false, "Payment request not found");
    }

    if (request.type !== 'withdrawal') {
      return makeResponse(res, BAD_REQUEST, false, "Only withdrawal requests can be marked as completed");
    }

    if (request.status !== 'approved') {
      return makeResponse(res, BAD_REQUEST, false, `Cannot complete ${request.status} request. Must be approved first.`);
    }

    await prisma.$transaction(async (tx) => {
      // Update payment request
      await tx.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          processedAt: new Date(),
          paypalTransactionId,
          adminNotes,
        }
      });

      // Deduct cash from user's balance
      await tx.users.update({
        where: { id: request.userId },
        data: {
          cash: { decrement: request.amount },
          totalWithdrawn: { increment: request.amount },
        }
      });

      // Create transaction record
      await tx.cashTransaction.create({
        data: {
          userId: request.userId,
          amount: -request.amount, // Negative for withdrawal
          type: 'withdrawal',
          balanceType: 'cash',
          balanceBefore: request.User.cash,
          balanceAfter: request.User.cash - request.amount,
          description: `Withdrawal completed: $${request.amount.toFixed(2)}`,
          paymentRequestId: requestId,
          metadata: {
            paypalTransactionId,
            completedBy: adminId
          },
        }
      });
    });

    await logActivity(
      request.userId,
      'withdrawal_completed',
      {
        amount: request.amount,
        requestId,
        completedBy: adminId,
        paypalTransactionId,
      },
      null,
      null
    );

    return makeResponse(res, SUCCESS, true, "Withdrawal completed successfully");
  })
);

/**
 * POST /admin/payments/:id/reject
 * Reject a payment request
 */
router.post("/admin/payments/:id/reject",
  AdminMiddleware,
  validators('REJECT_PAYMENT'),
  handleRequest(async (req, res) => {
    const requestId = parseInt(req.params.id);
    const { rejectionReason, adminNotes } = req.body;
    const adminId = req.user.id;

    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return makeResponse(res, BAD_REQUEST, false, "Payment request not found");
    }

    if (request.status !== 'pending') {
      return makeResponse(res, BAD_REQUEST, false, `Cannot reject ${request.status} request`);
    }

    await prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        processedAt: new Date(),
        processedBy: adminId,
        rejectionReason,
        adminNotes,
      }
    });

    await logActivity(
      request.userId,
      `${request.type}_rejected`,
      {
        amount: request.amount,
        requestId,
        rejectedBy: adminId,
        reason: rejectionReason,
      },
      null,
      null
    );

    return makeResponse(res, SUCCESS, true, "Payment request rejected");
  })
);



/**
 * GET /admin/payments/statistics
 * Get overall payment statistics
 */
router.get("/admin/payments/statistics", AdminMiddleware, handleRequest(async (req, res) => {
  const [
    pendingDeposits,
    pendingWithdrawals,
    totalDeposits,
    totalWithdrawals,
    recentActivity
  ] = await Promise.all([
    prisma.paymentRequest.aggregate({
      where: { type: 'deposit', status: 'pending' },
      _count: true,
      _sum: { amount: true }
    }),
    prisma.paymentRequest.aggregate({
      where: { type: 'withdrawal', status: 'pending' },
      _count: true,
      _sum: { amount: true }
    }),
    prisma.paymentRequest.aggregate({
      where: { type: 'deposit', status: { in: ['approved', 'completed'] } },
      _count: true,
      _sum: { amount: true }
    }),
    prisma.paymentRequest.aggregate({
      where: { type: 'withdrawal', status: 'completed' },
      _count: true,
      _sum: { amount: true }
    }),
    prisma.paymentRequest.findMany({
      where: { status: 'pending' },
      orderBy: { requestedAt: 'desc' },
      take: 10,
      include: {
        User: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    })
  ]);

  return makeResponse(res, SUCCESS, true, "Payment statistics", {
    pending: {
      deposits: {
        count: pendingDeposits._count,
        total: parseFloat((pendingDeposits._sum.amount || 0).toFixed(2)),
      },
      withdrawals: {
        count: pendingWithdrawals._count,
        total: parseFloat((pendingWithdrawals._sum.amount || 0).toFixed(2)),
      }
    },
    completed: {
      deposits: {
        count: totalDeposits._count,
        total: parseFloat((totalDeposits._sum.amount || 0).toFixed(2)),
      },
      withdrawals: {
        count: totalWithdrawals._count,
        total: parseFloat((totalWithdrawals._sum.amount || 0).toFixed(2)),
      }
    },
    recentActivity
  });
}));

export default router;
