import express from 'express';
import prisma  from '../../prisma/db.js';
import { makeResponse, statusCodes, responseMessages } from '../../helpers/index.js';
const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;
import { validators } from '../../middleware/validateResource/index.js';
const router = express.Router();

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

router.post('/airdrops', validators('ADD_SEASON'), async (req, res) => {
  const { name, total_supply, start_time, end_time, status } = req.body;
  const season = await prisma.airdropSeason.create({
    data: {
      name,
      total_supply,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      status
    },
  });
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_CREATED, season);
});


router.patch('/airdrops/:id', validators('UPDATE_SEASON'), async (req, res) => {
  const { id } = req.params;
  const { name, total_supply, start_time, end_time, status } = req.body;

  const season = await prisma.airdropSeason.update({
    where: { id: Number(id) },
    data: {
      ...(name && { name }),
      ...(total_supply && { total_supply }),
      ...(start_time && { start_time: new Date(start_time) }),
      ...(end_time && { end_time: new Date(end_time) }),
      ...(status !== undefined ? { status } : {}),
    },
  });
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_UPDATED, season);
});

router.delete('/airdrops/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSeason = await prisma.airdropSeason.delete({
      where: { id: Number(id) },
    });

    return makeResponse(res, SUCCESS, true, "Airdrop season deleted successfully", deletedSeason);
  } catch (error) {
    console.error("Delete Error:", error);
    return makeResponse(res, BAD_REQUEST, false, "Failed to delete airdrop season");
  }
});


router.put('/airdrops/additionalSupply', validators('UPDATE_ADDITIONAL_SUPPLY'), async (req, res) => {
      const updated = await prisma.master.update({
      where: { key: 'airdropStats' },
      data: { data1: req.body}
    });
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_UPDATED, updated);
});



export default router;
