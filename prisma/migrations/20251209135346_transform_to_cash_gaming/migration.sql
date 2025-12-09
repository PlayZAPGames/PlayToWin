/*
  Warnings:

  - You are about to drop the column `virtual1` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `virtual2` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the `UserWalletHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallets` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentRequestType" AS ENUM ('deposit', 'withdrawal');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CashTransactionType" AS ENUM ('deposit', 'withdrawal', 'game_entry', 'game_win', 'game_refund', 'referral_bonus', 'daily_bonus', 'admin_credit', 'admin_debit', 'purchase');

-- DropForeignKey
ALTER TABLE "UserWalletHistory" DROP CONSTRAINT "UserWalletHistory_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Wallets" DROP CONSTRAINT "Wallets_id_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "fk_rails_53a863e245";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "virtual1",
DROP COLUMN "virtual2",
ADD COLUMN     "bonusBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "kycVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paypalEmail" TEXT,
ADD COLUMN     "totalDeposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "UserWalletHistory";

-- DropTable
DROP TABLE "Wallets";

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "PaymentRequestType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paypalEmail" TEXT NOT NULL,
    "paypalTransactionId" TEXT,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "proofImageUrl" TEXT,
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "CashTransactionType" NOT NULL,
    "balanceType" TEXT NOT NULL DEFAULT 'cash',
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "paymentRequestId" INTEGER,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentRequest_userId_idx" ON "PaymentRequest"("userId");

-- CreateIndex
CREATE INDEX "PaymentRequest_status_idx" ON "PaymentRequest"("status");

-- CreateIndex
CREATE INDEX "PaymentRequest_type_idx" ON "PaymentRequest"("type");

-- CreateIndex
CREATE INDEX "PaymentRequest_requestedAt_idx" ON "PaymentRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "CashTransaction_userId_idx" ON "CashTransaction"("userId");

-- CreateIndex
CREATE INDEX "CashTransaction_type_idx" ON "CashTransaction"("type");

-- CreateIndex
CREATE INDEX "CashTransaction_createdAt_idx" ON "CashTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
