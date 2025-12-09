import express from "express";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import * as bank from "../utility/walletService.js";
import prisma from "../prisma/db.js";
const router = express.Router();
import { validators, queryValidators } from "../middleware/validateResource/index.js";
import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
const { SUCCESS, BAD_REQUEST } = statusCodes;
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { handleAirdropReward } from "../utility/airdropServices.js";
import { logActivity } from "../utility/activityServices.js";
// import { cryptoMining } from "../utility/blockChainServices.js";
import { getUserWallet } from "../utility/walletService.js";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks } from "date-fns";


router.get("/game/leaderboard", UserMiddleware, handleRequest(async function (req, res) {

  const now = new Date();

  // Get current week range (Monday–Sunday)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const currentUserId = req.user.id; // Get current user ID from middleware

  // Get pagination params
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const dateFilter = {
    gte: weekStart,
    lte: weekEnd,
  
  };

  // Get all user rewards for ranking
  const allUserRewards = await prisma.userGameRewardHistory.groupBy({
    by: ["userId"],
    _sum: { reward: true },
    where: { createdAt: dateFilter },
    orderBy: {
      _sum: { reward: "desc" },
    },
  });

  const total = allUserRewards.length;
  const totalPages = Math.ceil(total / limit);

  // Find current user's rank
  const currentUserRank = allUserRewards.findIndex(r => r.userId === currentUserId) + 1;
  const currentUserTotal = allUserRewards.find(r => r.userId === currentUserId)?._sum?.reward || 0;

  // Paginated leaderboard rewards
  const rewards = allUserRewards.slice(skip, skip + limit);

  const userIds = rewards.map((r) => r.userId);

  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      imageIndex: true,
    },
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const leaderboard = rewards.map((r, index) => ({
    rank: skip + index + 1,
    userId: r.userId,
    username: userMap[r.userId]?.username || "Guest",
    imageIndex: userMap[r.userId]?.imageIndex || 0,
    totalReward: r._sum.reward || 0,
  }));

  const pagination = {
    total,
    page,
    limit,
    totalPages,
  };

  return makeResponse(res, statusCodes.SUCCESS, true, "Leaderboard fetched", {
    weekStart: weekStart,
    weekEnd: weekEnd,
    pagination,
    leaderboard,
    currentUser: {
      rank: currentUserRank,
      totalReward: currentUserTotal,
    },
  });
}));

router.get("/game/fame", UserMiddleware, handleRequest(async function (req, res) {
  const currentUserId = req.user.id; // Get current user ID from middleware

  // Get pagination params
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Get all user rewards for ranking
  const allUserRewards = await prisma.userGameRewardHistory.groupBy({
    by: ["userId"],
    _sum: { reward: true },
    orderBy: {
      _sum: { reward: "desc" },
    },
  });

  const total = allUserRewards.length;
  const totalPages = Math.ceil(total / limit);

  // Find current user's rank
  const currentUserRank = allUserRewards.findIndex(r => r.userId === currentUserId) + 1;
  const currentUserTotal = allUserRewards.find(r => r.userId === currentUserId)?._sum?.reward || 0;

  // Paginated leaderboard rewards
  const rewards = allUserRewards.slice(skip, skip + limit);

  const userIds = rewards.map((r) => r.userId);

  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      imageIndex: true,
    },
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const leaderboard = rewards.map((r, index) => ({
    rank: skip + index + 1,
    userId: r.userId,
    username: userMap[r.userId]?.username || "Guest",
    imageIndex: userMap[r.userId]?.imageIndex || 0,
    totalReward: r._sum.reward || 0,
  }));

  const pagination = {
    total,
    page,
    limit,
    totalPages,
  };

  return makeResponse(res, statusCodes.SUCCESS, true, "Leaderboard fetched", {
    leaderboard,
    pagination,
    currentUser: {
      rank: currentUserRank,
      totalReward: currentUserTotal,
    },
  });
}));

// POST /game/play
router.post("/game/play", UserMiddleware, validators('GAME_PLAY'), handleRequest(async (req, res) => {

  let canWinReward = true;
  const gameData = await prisma.games.findUnique({ where: { id: req.body.gameId } })

  if (!gameData) {
    return makeResponse(res, BAD_REQUEST, false, `Game not available.`);
  }
  // const reward = 0;

  // 1. Find active airdrop season
  // const activeSeason = await prisma.airdropSeason.findFirst({
  //   where: {
  //     status: 0,
  //     start_time: { lte: new Date() },
  //     end_time: { gte: new Date() }
  //   }
  // });

  // if (activeSeason) {

  //   if (activeSeason.total_supply - (activeSeason.claimed + reward) >= 0) {

  //     canWinReward = true;
  //   }
  // }



  let room = await prisma.rooms.findFirst({
    where: {
      name: req.body.roomName,
    },
    orderBy: { createdAt: "asc" },
  });



  // Step 3: Create new room if needed
  if (!room) {
    room = await prisma.rooms.create({
      data: {
        name: req.body.roomName,
        gameId: gameData.id,
        entryFee: gameData.entryFee,
        freeEntry: canWinReward ? false : true,
        currencyType: gameData.currencyType,
        startTime: new Date(),
        // maxPlayers: req.body.maxPlayers
      },
    });
  }

  // Step 4: Create UserTournament entry
  const existingTournament = await prisma.userTournament.findUnique({
    where: {
      userId_roomId: {
        userId: req.user.id,
        roomId: room.id,
      },
    },
  });

  let userTournament;
    // console.log("existingTournament", existingTournament);


  if (existingTournament) {
    userTournament = existingTournament;
  } else {


    // console.log("req.user.id", req.user.id);
    // console.log("room.id", room.id);

    // Step 5: Create UserTournament entry
    userTournament = await prisma.userTournament.create({
      data: {
        userId: req.user.id,
        roomId: room.id,
        userName: req.user.username || "Player",
      },
    });


    // Step 6: Deduct entry fees from user wallet 
    // console.log("userTournament.id", userTournament.id);
    

    if (canWinReward && gameData.currencyType !== 'free') {
      await bank.updateCurrency(
        req.user.id,
        gameData.entryFee,
        gameData.currencyType,
        "debit",
        bank.transactiontype.matchEntry
      );
    } else {

      await logActivity(
        req.user.id,
        "matchEntry",
        { message: "Users started playing free game ", amount: 0, },
        null,
        null
      );
    }


  }

    //     // 🔹 Trigger blockchain API in background
    // const { walletAddress, user_papi } = await getUserWallet(req.user.id);
    // cryptoMining({
    //   walletAddress,
    //   functionName: 'MatchInit',
    //   user_papi
    // }).catch(err => {
    //   console.error(`Blockchain call failed for ${req.user.id}:`, err.message);
    // });


  return makeResponse(res, SUCCESS, true, responseMessages.ROOM_CREATED, {
    roomId: room.id,
    userTournamentId: userTournament.id,
    // reamingSupply: activeSeason ? activeSeason.total_supply - (activeSeason?.claimed + reward) : 0,
    canWinReward: canWinReward > 0 ? true : false,
  });

}));


router.post("/game/finish", UserMiddleware, validators('GAME_FINISH'), handleRequest(async (req, res) => {
  const { gameId, roomId, tournamentId, points, time, kills, bossKills } = req.body;
  const userId = req.user.id;

  const tournament = await prisma.userTournament.findFirst({
    where: { userId, roomId },
  });

  if (!tournament && tournament?.id != tournamentId) {
    return makeResponse(res, BAD_REQUEST, false, responseMessages.TOURNAMNENT_NOT_FOUND, {})
  }

  const tournamentScore = await prisma.userTournamentScores.findFirst({
    where: {
      userId,
      userTournamentId: tournament.id
    },
    select: { scoreSubmit: true }
  });

  if (tournamentScore?.scoreSubmit) {
    return makeResponse(res, BAD_REQUEST, false, responseMessages.SCORE_ALREADY_SUBMIT, {})
  }

  const gameData = await prisma.games.findUnique({ where: { id: gameId } })

  if (!gameData) {
    return makeResponse(res, BAD_REQUEST, false, `Game not available.`);
  }


  
  // ------------------------------
  // 🔹 Calculate final score
  const scoreFromPoints = (kills || 0) * gameData.kills; // 5 coins per point
  const scoreFromBossKills = (bossKills || 0) * gameData.bossKills; // 5 coins per point
  const scoreFromTime = Math.floor((time || 0)) * gameData.timeBonus; // 2 coins per 10 sec
  const finalScore = scoreFromPoints + scoreFromTime + scoreFromBossKills;
  // ------------------------------

      // return makeResponse(res, BAD_REQUEST, false, 'reward already claimed by user', {finalScore });



  // 1. Save game score
  await prisma.userTournamentScores.create({
    data: {
      userId,
      userTournamentId: tournament.id,
      score: finalScore,
      // scoreAry: [score], // or [] if not using
      stats: { kills, time, scoreFromPoints, scoreFromTime, scoreFromBossKills }, // optional for debugging
      scoreSubmit: true,
      timerStarted: true,
    },
  });


  // 2. Update user games win,played records
  await prisma.users.update({
    where: { id: userId },
    data: {
      gamesPlayed: { increment: 1 },
      // gamesWon: won ? { increment: 1 } : undefined,
    },
  });



  // 4. Update room so that nobody join the same room while one player is out from game
  const updatedRoom = await prisma.rooms.update({
    where: { id: roomId },
    data: { released: true },
  });



  // 5. Update user wallet and add winning reward if won
  if (finalScore) {
    // check is user actually played this game
    const existingWinner = await prisma.userGameRewardHistory.findFirst({
      where: {
        gameId: gameData.id,
        roomId,
        userId
      }
    });

    if (existingWinner) {
      return makeResponse(res, BAD_REQUEST, false, 'reward already claimed by user', { existingWinner });
    }



    const reward = finalScore;
    // const activeSeason = await prisma.airdropSeason.findFirst({
    //   where: {
    //     status: 0,
    //     start_time: { lte: new Date() },
    //     end_time: { gte: new Date() }
    //   },
    //   orderBy: { id: 'desc' }
    // });
    // if (!activeSeason) {
    //   console.warn(`⛔ No active airdrop season for user ${userId}`);
    //   return makeResponse(res, BAD_REQUEST, false, "No active airdrop season", {});
    // }

    await prisma.userGameRewardHistory.create({
      data: {
        userId,
        gameId: gameData.id,
        roomId,
        reward,
        // rank,
        currency: gameData.winningCurrencyType,
        reason: bank.transactiontype.gameWinReward,
        // seasonId: activeSeason ? activeSeason.id : null,
        seasonId:  null,
      }
    });


    if (!updatedRoom.freeEntry) {

      // const result = await handleAirdropReward({
      //   userId,
      //   winAmount: reward, // or reward * multiplier if any
      // });

      await bank.updateCurrency(userId, reward, gameData.winningCurrencyType, "credit", bank.transactiontype.gameWinReward);
   

    }

  }

  return makeResponse(res, SUCCESS, true, responseMessages.GAME_COMPLETE)

}));


router.get("/game/result", UserMiddleware, queryValidators('GAME_RESULT'), handleRequest(async (req, res) => {
  const roomId = parseInt(req.query.roomId, 10);

  // 1. Fetch room details
  const room = await prisma.rooms.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      gameId: true,
      currencyType: true,
      freeEntry: true,
      entryFee: true
    }
  });

  if (!room) {
    return makeResponse(res, BAD_REQUEST, false, responseMessages.ROOM_NOT_FOUND, {});
  }

  // 2. Fetch game configuration separately
  let gameConfig = null;
  if (room.gameId) {
    gameConfig = await prisma.games.findUnique({
      where: { id: room.gameId }
    });
  }

  // 3. Get tournaments for the room
  const tournaments = await prisma.userTournament.findMany({
    where: { roomId },
    select: { id: true, userId: true, userName: true }
  });

  if (!tournaments || tournaments.length === 0) {
    return makeResponse(res, BAD_REQUEST, false, responseMessages.TOURNAMNENT_NOT_FOUND, {});
  }

  const tournamentIds = tournaments.map(t => t.id);
  const userIds = tournaments.map(t => t.userId);

  // 4. Get user images
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: { id: true, imageIndex: true }
  });

  const userMap = new Map(users.map(user => [user.id, user]));

  // 5. Get tournament scores
  const scores = await prisma.userTournamentScores.findMany({
    where: {
      userTournamentId: { in: tournamentIds }
    },
    orderBy: { rank: 'asc' }
  });

  // 6. Build results with predefined rewards
  const results = scores.map(score => {
    const tournament = tournaments.find(t => t.id === score.userTournamentId);
    const user = userMap.get(tournament.userId);
    return {
      userName: tournament.userName,
      // rank: score.rank,
      isMine: score.userId === req.user.id,
      score: score.score,
      imageIndex: user?.imageIndex || 0,
      currency: gameConfig?.winningCurrencyType || room.currencyType,
      // reward: reward
    };
  });

  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, results);
}));


export default router;
