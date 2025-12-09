import express from "express";
import prisma from '../../prisma/db.js';
import { handleRequest } from "../../helpers/requestHandler/asyncHandler.js";
import { makeResponse, responseMessages, statusCodes } from "../../helpers/index.js";
import { numberToSlug, slugToNumber, slugType } from "../../utility/cypher.js";
import { validators } from '../../middleware/validateResource/index.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks } from "date-fns";


const router = express.Router();

// API endpoint to create/update the single game record
router.post('/game', validators('ADD_GAME'), handleRequest(async (req, res) => {
  const {
    gameName,
    serverGameName,
    keyboardGameName,
    url,
    miniAppUrl,
    iMessage_Solo,
    entryFee,
    currencyType,
    winningCurrencyType,
    kills,
    timeBonus,
    bossKills,
    rank1,
    rank2,
    rank3,
    rank4
  } = req.body;


  let game = await prisma.games.create({
    data: {
      gameName,
      serverGameName,
      keyboardGameName,
      url,
      miniAppUrl,
      iMessage_Solo,
      entryFee,
      currencyType,
      winningCurrencyType,
      kills,
      timeBonus,
      bossKills
    }
  });

  return makeResponse(res, 200, true, responseMessages.RECORD_CREATED, game);


}));

router.put('/game/:id', validators('ADD_GAME'), handleRequest(async (req, res) => {
  const gameId = parseInt(req.params.id);

  const existingGame = await prisma.games.findUnique({ where: { id: gameId } });
  if (!existingGame) {
    return makeResponse(res, 404, false, "Game not found");
  }

  const {
    gameName, serverGameName, keyboardGameName, url, miniAppUrl,
    iMessage_Solo, entryFee, currencyType, winningCurrencyType,
    kills, timeBonus, bossKills,
    rank1, rank2, rank3, rank4
  } = req.body;

  const updatedGame = await prisma.games.update({
    where: { id: gameId },
    data: {
      gameName,
      serverGameName,
      keyboardGameName,
      url,
      miniAppUrl,
      iMessage_Solo,
      entryFee,
      currencyType,
      winningCurrencyType,
      kills,
      timeBonus,
      bossKills,
      rank1,
      rank2,
      rank3,
      rank4
    }
  });

  return makeResponse(res, 200, true, responseMessages.RECORD_UPDATED, updatedGame);
}));


router.delete('/game/:id', handleRequest(async (req, res) => {
  const gameId = parseInt(req.params.id);

  const existingGame = await prisma.games.findUnique({ where: { id: gameId } });
  if (!existingGame) {
    return makeResponse(res, 404, false, "Game not found");
  }

  await prisma.games.delete({ where: { id: gameId } });

  return makeResponse(res, 200, true, responseMessages.RECORD_DELETE);
}));


// API endpoint to get the games listing
router.get('/game', handleRequest(async (req, res) => {
  const games = await prisma.games.findMany({
    orderBy: { id: 'asc' },
  });

  if (!games || games.length === 0) {
    return makeResponse(res, 404, false, "No games found");
  }

  return makeResponse(res, 200, true, responseMessages.RECORD_FOUND, games);
}));


router.get("/game/leaderboard", handleRequest(async function (req, res) {

  // Parse date range
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "startDate and endDate are required" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Include entire end day
  const dateFilter ={ gte: start, lte: end };
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;


  // Step 1: Get all unique user IDs to calculate total
  const allRewards = await prisma.userGameRewardHistory.groupBy({
    by: ["userId"],
    _sum: {
      reward: true,
    },
    where: {
      createdAt: dateFilter,
      // seasonId: req.query.seasonId ? parseInt(req.query.seasonId) : undefined,
    },
  });

  const total = allRewards.length;
  const totalPages = Math.ceil(total / limit);

  // Step 2: Paginate results
  const rewards = await prisma.userGameRewardHistory.groupBy({
    by: ["userId"],
    _sum: {
      reward: true,
    },
    where: {
      createdAt: dateFilter,
      // seasonId: req.query.seasonId ? parseInt(req.query.seasonId) : undefined,
    },
    orderBy: {
      _sum: {
        reward: "desc",
      },
    },
    skip,
    take: limit,
  });

  const userIds = rewards.map((r) => r.userId);

  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      imageUrl: true,
    },
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const data = rewards.map((r, index) => ({
    rank: skip + index + 1,
    userId: r.userId,
    slug: numberToSlug(r.userId, slugType.user_id),
    username: userMap[r.userId]?.username || "Guest",
    imageUrl: userMap[r.userId]?.imageUrl || null,
    totalReward: r._sum.reward || 0,
  }));

  return makeResponse(res, statusCodes.SUCCESS, true, "Leaderboard fetched", {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}));



export default router;
