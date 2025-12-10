import prisma from "../prisma/db.js";
import { logActivity } from "./activityServices.js";
import { updateCurrency, operations, transactiontype } from "./walletService.js";

/**
 * Payment Service - Handles all cash transactions and PayPal payment requests
 * Replaces the old walletService.js crypto functions
 */

// Payment Configuration
export const PAYMENT_CONFIG = {
  MIN_DEPOSIT: 5,        // Minimum $5 deposit
  MIN_WITHDRAWAL: 10,    // Minimum $10 withdrawal
  MAX_WITHDRAWAL: 500,   // Maximum $500 per transaction
  MAX_DAILY_WITHDRAWAL: 1000, // Maximum $1000 per day
  WITHDRAWAL_FEE: 0,     // No fee for now, can add percentage later
};

/**
 * Update user's cash balance
 * @param {number} userId - User ID
 * @param {number} amount - Amount to add/deduct (positive for credit, negative for debit)
 * @param {string} type - Transaction type from CashTransactionType enum
 * @param {string} description - Transaction description
 * @param {string} balanceType - 'cash' or 'bonus'
 * @param {object} metadata - Additional data (optional)
 * @param {number} paymentRequestId - Related payment request ID (optional)
 * @returns {Promise<object>} Updated user and transaction record
 */

/**
 * Get user's current balances
 * @param {number} userId - User ID
 * @returns {Promise<object>} User balance information
 */
export async function getUserBalance(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      cash: true,
      bonusBalance: true,
      totalDeposited: true,
      totalWithdrawn: true,
      paypalEmail: true,
      kycVerified: true,
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    cash: parseFloat(user.cash.toFixed(2)),
    bonusBalance: parseFloat(user.bonusBalance.toFixed(2)),
    totalBalance: parseFloat((user.cash+ user.bonusBalance).toFixed(2)),
    totalDeposited: parseFloat(user.totalDeposited.toFixed(2)),
    totalWithdrawn: parseFloat(user.totalWithdrawn.toFixed(2)),
    paypalEmail: user.paypalEmail,
    kycVerified: user.kycVerified,
  };
}

/**
 * Create deposit request
 * @param {number} userId - User ID
 * @param {number} amount - Deposit amount
 * @param {string} paypalEmail - User's PayPal email
 * @param {string} proofImageUrl - Receipt/proof image URL (optional)
 * @returns {Promise<object>} Created payment request
 */
export async function createDepositRequest(userId, amount, paypalEmail, proofImageUrl = null) {
  // Validate amount
  if (amount < PAYMENT_CONFIG.MIN_DEPOSIT) {
    throw new Error(`Minimum deposit amount is $${PAYMENT_CONFIG.MIN_DEPOSIT}`);
  }

  // Create deposit request
  const request = await prisma.paymentRequest.create({
    data: {
      userId,
      type: 'deposit',
      amount,
      paypalEmail,
      proofImageUrl,
      status: 'pending',
      requestedAt: new Date(),
    },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
        }
      }
    }
  });

  // Log activity
  await logActivity(
    userId,
    'deposit_request',
    {
      amount,
      requestId: request.id,
      paypalEmail,
    },
    null,
    null
  );

  return request;
}

/**
 * Create withdrawal request
 * @param {number} userId - User ID
 * @param {number} amount - Withdrawal amount
 * @param {string} paypalEmail - User's PayPal email for payout
 * @returns {Promise<object>} Created payment request
 */
export async function createWithdrawalRequest(userId, amount, paypalEmail) {
  // Get user's current balance
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { cash: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Validate amount
  if (amount < PAYMENT_CONFIG.MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal amount is $${PAYMENT_CONFIG.MIN_WITHDRAWAL}`);
  }

  if (amount > PAYMENT_CONFIG.MAX_WITHDRAWAL) {
    throw new Error(`Maximum withdrawal amount is $${PAYMENT_CONFIG.MAX_WITHDRAWAL} per transaction`);
  }

  if (amount > user.cash) {
    throw new Error(`Insufficient balance. Available: $${user.cash.toFixed(2)}`);
  }

  // Check if PayPal email is provided
  if (!paypalEmail || !paypalEmail.includes('@')) {
    throw new Error('Valid PayPal email is required for withdrawals');
  }

  // Check daily withdrawal limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayWithdrawals = await prisma.paymentRequest.aggregate({
    where: {
      userId,
      type: 'withdrawal',
      status: { in: ['approved', 'completed'] },
      requestedAt: { gte: today }
    },
    _sum: { amount: true }
  });

  const todayTotal = todayWithdrawals._sum.amount || 0;
  if (todayTotal + amount > PAYMENT_CONFIG.MAX_DAILY_WITHDRAWAL) {
    throw new Error(`Daily withdrawal limit of $${PAYMENT_CONFIG.MAX_DAILY_WITHDRAWAL} reached. Today's total: $${todayTotal.toFixed(2)}`);
  }

  // Create withdrawal request
  const request = await prisma.paymentRequest.create({
    data: {
      userId,
      type: 'withdrawal',
      amount,
      paypalEmail,
      status: 'pending',
      requestedAt: new Date(),
    },
    include: {
      User: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
          cash: true,
        }
      }
    }
  });

  // Log activity
  await logActivity(
    userId,
    'withdrawal_request',
    {
      amount,
      requestId: request.id,
      paypalEmail,
    },
    null,
    null
  );

  return request;
}

/**
 * Get user's transaction history
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<object>} Transaction history with pagination
 */
export async function getTransactionHistory(userId, limit = 50, offset = 0) {
  const [transactions, total] = await Promise.all([
    prisma.cashTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        PaymentRequest: {
          select: {
            id: true,
            type: true,
            status: true,
          }
        }
      }
    }),
    prisma.cashTransaction.count({ where: { userId } })
  ]);

  return {
    transactions,
    total,
    limit,
    offset,
    hasMore: (offset + limit) < total
  };
}

/**
 * Get user's payment requests
 * @param {number} userId - User ID
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<array>} List of payment requests
 */
export async function getUserPaymentRequests(userId, status = null) {
  const where = { userId };
  if (status) {
    where.status = status;
  }

  const requests = await prisma.paymentRequest.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
    include: {
      ProcessedByAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });

  return requests;
}

/**
 * Check if user can afford game entry
 * @param {number} userId - User ID
 * @param {number} entryFee - Entry fee amount
 * @returns {Promise<boolean>} Whether user can afford entry
 */
export async function canAffordEntry(userId, entryFee) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { cash: true, bonusBalance: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const totalBalance = user.cash + user.bonusBalance;
  return totalBalance >= entryFee;
}

/**
 * Charge game entry fee (uses bonus balance first, then cash)
 * @param {number} userId - User ID
 * @param {number} entryFee - Entry fee amount
 * @param {object} gameMetadata - Game details (gameId, roomId, etc.)
 * @returns {Promise<object>} Transaction details
 */
export async function chargeGameEntry(userId, entryFee, gameMetadata = {}) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { cash: true, bonusBalance: true, status: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status === 2) {
    throw new Error('User is blocked');
  }

  const totalBalance = user.cash + user.bonusBalance;
  if (totalBalance < entryFee) {
    throw new Error(`Insufficient balance. Required: $${entryFee.toFixed(2)}, Available: $${totalBalance.toFixed(2)}`);
  }

  let transactions = [];
  let remainingFee = entryFee;

  // Use gems (bonus) first
  if (user.bonusBalance > 0 && remainingFee > 0) {
    const bonusToUse = Math.min(user.bonusBalance, remainingFee);
    const bonusResult = await updateCurrency(
      userId,
      bonusToUse,
      'gems',
      operations.debit,
      transactiontype.matchEntry,
      null,
      'success'
    );
    transactions.push(bonusResult);
    remainingFee -= bonusToUse;
  }

  // Use cash for remaining amount
  if (remainingFee > 0) {
    const cashResult = await updateCurrency(
      userId,
      remainingFee,
      'cash',
      operations.debit,
      transactiontype.matchEntry,
      null,
      'success'
    );
    transactions.push(cashResult);
  }

  return {
    success: true,
    charged: entryFee,
    transactions
  };
}

/**
 * Award game prize
 * @param {number} userId - User ID
 * @param {number} prizeAmount - Prize amount
 * @param {object} gameMetadata - Game details
 * @returns {Promise<object>} Transaction details
 */
export async function awardGamePrize(userId, prizeAmount, gameMetadata = {}) {
  const result = await updateCurrency(
    userId,
    prizeAmount,
    'cash',
    operations.credit,
    transactiontype.gameWinReward,
    null,
    'success'
  );
  return result;
}
