-- CreateEnum
CREATE TYPE "LoginType" AS ENUM ('guest', 'google', 'apple', 'telegram');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('weapon', 'armour');

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "socialId" TEXT,
    "loginType" "LoginType" NOT NULL,
    "username" TEXT DEFAULT '',
    "imageUrl" TEXT,
    "imageIndex" INTEGER DEFAULT 0,
    "lastActive" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" INTEGER NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'en',
    "botStart" BOOLEAN NOT NULL DEFAULT false,
    "notification" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "virtual1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "virtual2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "fcmToken" TEXT,
    "token" TEXT,
    "referree" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rooms" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "iMessage" TEXT,
    "chatId" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "gameId" INTEGER,
    "entryFee" INTEGER,
    "currencyType" TEXT,
    "released" BOOLEAN DEFAULT false,
    "freeEntry" BOOLEAN NOT NULL DEFAULT false,
    "releaseResponse" TEXT,
    "startTime" TIMESTAMP(3),
    "releaseTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTournament" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tgId" BIGINT NOT NULL DEFAULT 0,
    "iMessage" TEXT NOT NULL DEFAULT '',
    "userName" TEXT NOT NULL,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreAry" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "roomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTournamentScores" (
    "id" SERIAL NOT NULL,
    "userTournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreAry" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "rank" TEXT,
    "points" INTEGER,
    "time" INTEGER,
    "lives" INTEGER NOT NULL DEFAULT 3,
    "timer" DOUBLE PRECISION NOT NULL DEFAULT 180,
    "stats" JSONB NOT NULL DEFAULT '{}',
    "scoreSubmit" BOOLEAN NOT NULL DEFAULT false,
    "timerStarted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTournamentScores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallets" (
    "id" SERIAL NOT NULL,
    "pzpEvmWallet" TEXT,
    "evmWalletPapi" TEXT,
    "tonWallet" TEXT,
    "isTonActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyUserTasks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT,
    "tasks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyUserTasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTasksValues" (
    "id" SERIAL NOT NULL,
    "task_name" TEXT NOT NULL,
    "task_desc" TEXT,
    "task_pfp" TEXT,
    "task_redirect" TEXT,
    "lastClaimDate" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "reward" DOUBLE PRECISION,
    "reward_range" TEXT,
    "currency_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'InActive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTasksValues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReferral" (
    "id" SERIAL NOT NULL,
    "referee" INTEGER NOT NULL,
    "refereeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "redeem" BOOLEAN NOT NULL DEFAULT false,
    "referrer" INTEGER NOT NULL,
    "referrerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTransactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "transaction_hash" TEXT,
    "transaction_type" TEXT NOT NULL DEFAULT '',
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTransactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWalletHistory" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "item_id" INTEGER,
    "from_amount" DOUBLE PRECISION NOT NULL,
    "from_currency" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "transaction_hash" TEXT,
    "transaction_type" TEXT NOT NULL DEFAULT '',
    "status" TEXT,
    "to_amount" DOUBLE PRECISION,
    "to_currency" TEXT,
    "to_address" TEXT,
    "currency" TEXT,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWalletHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Master" (
    "key" TEXT NOT NULL,
    "data1" JSONB,
    "data2" VARCHAR(100)
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationsData" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "DailyRewards" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "dailySession" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyRewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_login_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT,
    "ip_address" VARCHAR,
    "login_time" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "ip_address_2" VARCHAR,

    CONSTRAINT "admin_login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR NOT NULL DEFAULT '',
    "encrypted_password" VARCHAR NOT NULL DEFAULT '',
    "name" VARCHAR,
    "reset_password_token" VARCHAR,
    "reset_password_sent_at" TIMESTAMP(6),
    "remember_created_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "player" INTEGER,
    "modifiable_id" INTEGER,
    "modifiable_type" VARCHAR,
    "keypass" VARCHAR,
    "qr" BOOLEAN DEFAULT false,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGameRewardHistory" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "reward" DOUBLE PRECISION NOT NULL,
    "rank" TEXT,
    "currency" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGameRewardHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "gameName" TEXT NOT NULL,
    "serverGameName" TEXT,
    "keyboardGameName" TEXT,
    "url" TEXT,
    "miniAppUrl" TEXT,
    "iMessage_Solo" TEXT,
    "entryFee" DOUBLE PRECISION NOT NULL,
    "currencyType" TEXT NOT NULL DEFAULT 'virtual1',
    "winningCurrencyType" TEXT NOT NULL DEFAULT 'virtual2',
    "coins" DOUBLE PRECISION NOT NULL,
    "timeBonus" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spin_wheels" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR,
    "is_disabled" BOOLEAN DEFAULT false,
    "perc" DOUBLE PRECISION DEFAULT 0.0,
    "virtual1" DOUBLE PRECISION DEFAULT 0.0,
    "virtual2" DOUBLE PRECISION DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spin_wheels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_spin_wheels" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "spin_wheel_id" INTEGER,
    "is_claimed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "virtual1" DOUBLE PRECISION DEFAULT 0.0,
    "virtual2" DOUBLE PRECISION DEFAULT 0.0,

    CONSTRAINT "user_spin_wheels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "detail" JSONB,
    "refId" INTEGER,
    "activity_type" TEXT,
    "wallet_history_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "price" INTEGER,
    "currencyType" TEXT NOT NULL,
    "description" TEXT,
    "baseLevel" INTEGER NOT NULL DEFAULT 1,
    "maxLevel" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemLevel" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "upgradeCost" INTEGER NOT NULL,
    "stats" JSONB NOT NULL,

    CONSTRAINT "ItemLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperPower" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SuperPower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSuperPower" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "superPowerId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSuperPower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_socialId_key" ON "Users"("socialId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_fcmToken_key" ON "Users"("fcmToken");

-- CreateIndex
CREATE UNIQUE INDEX "Users_token_key" ON "Users"("token");

-- CreateIndex
CREATE INDEX "index_Users_on_id" ON "Users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserTournament_userId_roomId_key" ON "UserTournament"("userId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_pzpEvmWallet_key" ON "Wallets"("pzpEvmWallet");

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_evmWalletPapi_key" ON "Wallets"("evmWalletPapi");

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_tonWallet_key" ON "Wallets"("tonWallet");

-- CreateIndex
CREATE UNIQUE INDEX "DailyUserTasks_user_id_key" ON "DailyUserTasks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserReferral_referee_key" ON "UserReferral"("referee");

-- CreateIndex
CREATE UNIQUE INDEX "UserTransactions_transaction_hash_key" ON "UserTransactions"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Master_key_key" ON "Master"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Notifications_id_key" ON "Notifications"("id");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationsData_id_key" ON "NotificationsData"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRewards_user_id_key" ON "DailyRewards"("user_id");

-- CreateIndex
CREATE INDEX "index_admin_login_logs_on_admin_id" ON "admin_login_logs"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "index_admins_on_email" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "index_admins_on_reset_password_token" ON "admins"("reset_password_token");

-- CreateIndex
CREATE INDEX "index_user_spin_wheels_on_spin_wheel_id" ON "user_spin_wheels"("spin_wheel_id");

-- CreateIndex
CREATE INDEX "index_user_spin_wheels_on_user_id" ON "user_spin_wheels"("user_id");

-- CreateIndex
CREATE INDEX "index_activities_on_user_id" ON "activities"("userId");

-- CreateIndex
CREATE INDEX "index_activities_on_wallet_history_id" ON "activities"("wallet_history_id");

-- CreateIndex
CREATE INDEX "index_activities_on_created_at" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "index_activities_on_ref_id" ON "activities"("refId");

-- CreateIndex
CREATE INDEX "index_activities_on_activity_type" ON "activities"("activity_type");

-- CreateIndex
CREATE UNIQUE INDEX "ItemLevel_itemId_level_key" ON "ItemLevel"("itemId", "level");

-- CreateIndex
CREATE INDEX "UserPurchase_userId_idx" ON "UserPurchase"("userId");

-- CreateIndex
CREATE INDEX "UserPurchase_itemId_idx" ON "UserPurchase"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_itemId_key" ON "UserPurchase"("userId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSuperPower_userId_superPowerId_key" ON "UserSuperPower"("userId", "superPowerId");

-- AddForeignKey
ALTER TABLE "UserTournament" ADD CONSTRAINT "UserTournament_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTournamentScores" ADD CONSTRAINT "UserTournamentScores_userTournamentId_fkey" FOREIGN KEY ("userTournamentId") REFERENCES "UserTournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_id_fkey" FOREIGN KEY ("id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyUserTasks" ADD CONSTRAINT "DailyUserTasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referrer_fkey" FOREIGN KEY ("referrer") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referee_fkey" FOREIGN KEY ("referee") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTransactions" ADD CONSTRAINT "UserTransactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWalletHistory" ADD CONSTRAINT "UserWalletHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationsData" ADD CONSTRAINT "NotificationsData_id_fkey" FOREIGN KEY ("id") REFERENCES "Notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRewards" ADD CONSTRAINT "DailyRewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_login_logs" ADD CONSTRAINT "fk_rails_d4ea813624" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserGameRewardHistory" ADD CONSTRAINT "UserGameRewardHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_spin_wheels" ADD CONSTRAINT "fk_rails_41c571ff54" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_spin_wheels" ADD CONSTRAINT "fk_rails_d03a19184d" FOREIGN KEY ("spin_wheel_id") REFERENCES "spin_wheels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "fk_rails_53a863e245" FOREIGN KEY ("wallet_history_id") REFERENCES "UserWalletHistory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "fk_rails_7e11bb717f" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ItemLevel" ADD CONSTRAINT "ItemLevel_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSuperPower" ADD CONSTRAINT "UserSuperPower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSuperPower" ADD CONSTRAINT "UserSuperPower_superPowerId_fkey" FOREIGN KEY ("superPowerId") REFERENCES "SuperPower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
