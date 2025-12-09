import express from "express";
import prisma from "../prisma/db.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";

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



export default router;