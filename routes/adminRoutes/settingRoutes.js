import express from "express";
import prisma from '../../prisma/db.js';
import { handleRequest } from "../../helpers/requestHandler/asyncHandler.js";
import { makeResponse, statusCodes } from "../../helpers/index.js";
import  {settingValidator}  from "../../middleware/settingValidator.js";


const router = express.Router();

router.get("/settings", handleRequest(async (req, res) => {
  const settings = await prisma.master.findMany({});

  const transformed = settings.reduce((acc, { key, data1, data2 }) => {
      acc[key] = data1 !== null ? data1 : data2;
      return acc;
    }, {});

  return makeResponse(res, 200, true, "Settings listing fetched successfully", { settings: transformed });
}));

router.put('/settings/:key', settingValidator(), async (req, res) => {
  try {
    const { key, value, isComplex } = req.validatedSetting;

    // Determine whether to store in data1 or data2
    const updateData = isComplex 
      ? { data1: value, data2: null }
      : { data1: null, data2: String(value) };

    // Prevent structural changes for referral
    if (key === 'referral') {
      const current = await prisma.master.findUnique({ where: { key } });
      if (current?.data1) {
        const currentKeys = Object.keys(current.data1).sort();
        const newKeys = Object.keys(value).sort();
        if (JSON.stringify(currentKeys) !== JSON.stringify(newKeys)) {
          return makeResponse(res, statusCodes.BAD_REQUEST, false, 'Cannot change referral currency keys');
        }
      }
    }

    // Update database
    const updated = await prisma.master.upsert({
      where: { key },
      update: updateData,
      create: { key, ...updateData }
    });

    // Prepare response data
    const responseData = updated.data1 !== null ? updated.data1 : updated.data2;
    
    return makeResponse(res, statusCodes.SUCCESS, true, "Setting updated successfully", { [key]: responseData });
  } catch (error) {
    return makeResponse(res, statusCodes.SERVER_ERROR, false, 'Update failed', { error: error.message });
  }
});
export default router;
