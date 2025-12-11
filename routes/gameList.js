import express from "express";
import prisma from "../prisma/db.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { makeResponse, responseMessages, statusCodes } from "../helpers/index.js";


const router = express.Router();

router.get("/game/List", UserMiddleware, async function (req, res) {
    const games = await prisma.games.findMany({
        orderBy: { id: 'asc' }, 
    });

    if (!games || games.length === 0) {
        return makeResponse(res, statusCodes.NOT_FOUND, false, "No games found");
    }

    return makeResponse(res, statusCodes.SUCCESS, true, responseMessages.RECORD_CREATED, games);

});

router.get("/game/tournament-blocks", handleRequest(async (req, res) => {
  const { gameId, status } = req.query;
  const where = {};
  if (gameId) where.gameId = parseInt(gameId);
  if (status) where.status = status;

  const blocks = await prisma.tournamentBlock.findMany({
    where,
    orderBy: { createdAt: "desc" },
    // include: {
    //   game: {
    //     select: { id: true, gameName: true }
    //   }
    // }
  });

  return makeResponse(res, statusCodes.SUCCESS, true, "Tournament blocks listed", blocks )
}));



export default router;