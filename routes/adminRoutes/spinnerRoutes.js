import express from 'express';
import prisma  from '../../prisma/db.js';
import { makeResponse, statusCodes, responseMessages } from '../../helpers/index.js';
const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;
import { validators } from '../../middleware/validateResource/index.js';
const router = express.Router();

import { refreshSpinWheelConfig } from '../../controllers/spinner.js';


router.get('/spinner', async (req, res) => {
  try {
    const spinner = await prisma.spin_wheels.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { user_spin_wheels: true }
        }
      }
    });

    const intervalConfig = await prisma.master.findUnique({
      where: { key: "spinInterval" }
    });
    const spinIntervalHours = intervalConfig?.data1;

    return makeResponse(
      res,
      SUCCESS,
      true,
      responseMessages.RECORD_FOUND,
      {
        spinner: spinner.map(item => ({
          ...item,
          assigned_count: item._count.user_spin_wheels
        })),
        spinIntervalHours
      }
    );
  } catch (error) {
    console.error('Error in /spinner:', error);
    return makeResponse(res, SERVER_ERROR, false, responseMessages.SERVER_ERROR);
  }
});


router.post('/spinner', validators('ADD_SPINNER'), async (req, res) => {
      const { name, is_disabled, perc, virtual1, virtual2 } = req.body;

      await prisma.spin_wheels.create({
        data: {
          name: name || null,
          is_disabled: is_disabled ?? false,
          perc: perc ?? 0,
          virtual1: virtual1 ?? 0,
          virtual2: virtual2 ?? 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
          // Refresh spinner config after update
    await refreshSpinWheelConfig();
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_CREATED);
});


router.patch('/spinner/:id', validators('UPDATE_SPINNER'), async (req, res) => {
   const { name, is_disabled, perc, virtual1, virtual2 } = req.body;

      const data = await prisma.spin_wheels.update({
        where: { id: parseInt(req.params.id) },
        data: {
          name: name !== undefined ? name : undefined,
          is_disabled: is_disabled !== undefined ? is_disabled : undefined,
          perc: perc !== undefined ? perc : undefined,
          virtual1: virtual1 !== undefined ? virtual1 : undefined,
          virtual2: virtual2 !== undefined ? virtual2 : undefined,
          updated_at: new Date()
        }
      });
          // Refresh spinner config after update
    await refreshSpinWheelConfig();
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_UPDATED, data);
});

router.put('/spin-interval', validators('UPDATE_INTERVAL'), async (req, res) => {
   const { hour } = req.body;
      const updated = await prisma.master.update({
      where: { key: 'spinInterval' },
      data: { data1: hour }
    });

    
    // Refresh spinner config after update
    await refreshSpinWheelConfig();

  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_UPDATED, updated);
});




export default router;
