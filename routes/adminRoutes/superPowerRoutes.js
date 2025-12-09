import express from 'express';
import prisma  from '../../prisma/db.js';
import { makeResponse, statusCodes, responseMessages } from '../../helpers/index.js';
const { SUCCESS } = statusCodes;
import { validators } from '../../middleware/validateResource/index.js';
const router = express.Router();


router.get('/super-power', async (req, res) => {
   const items = await prisma.superPower.findMany({
      orderBy: { id: "asc" },
    });
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, {items });
});

router.post('/super-power', validators('ADD_SUPER_POWER'), async (req, res) => {
    const { name, description, price,  isActive } = req.body;
    const item = await prisma.superPower.create({
      data: {
        name,
        description,
        price,
        isActive: isActive ?? false,
      },
    });

  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_CREATED, item );
});


router.patch('/super-power/:id', validators('UPDATE_SUPER_POWER'), async (req, res) => {
   const { id } = req.params;
  const { name, description, price, isActive } = req.body;

    const item = await prisma.superPower.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_UPDATED, item);
});


export default router;
