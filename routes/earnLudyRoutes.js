import express from "express";
import prisma from "../prisma/db.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
const { SUCCESS} = statusCodes;

const router = express.Router();


router.get("/earn-ludy", handleRequest( async function (req, res) {
  let result = await prisma.dailyTasksValues.findMany({
    orderBy: {
      id: 'asc', // Sorts by ID in ascending order
    },
  });
    return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, result);
}));

router.get('/airdrops', async (req, res) => {
  const list = await prisma.airdropSeason.findMany({
    orderBy: { id: 'asc' },
  });

    const additionalConfig = await prisma.master.findUnique({
      where: { key: "airdropStats" }
    });
    const additional = additionalConfig?.data1;


    const data = list.map(item => {
    const progress = item.total_supply > 0
      ? ((item.claimed / item.total_supply) * 100).toFixed(2)
      : "0.00";

    return {
      ...item,
      progress: Number(progress), // optional: you can keep it as string if you prefer
    };
  });

  const additionalSupply = additional?.additionalSupply || "0 M";

  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, {seasons: data, additionalSupply });
});



export default router;
