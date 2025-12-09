import express from "express";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { validators } from "../middleware/validateResource/index.js";

import { buySuperPower, useSuperPower, listSuperPowers } from "../controllers/superPowers.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
const { SUCCESS } = statusCodes;

const router = express.Router();


router.get("/super-powers/list", UserMiddleware, handleRequest(async function (req, res) {
  let result = await listSuperPowers(req, res);;
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, result);
}));

router.post("/super-powers/buy", validators('BUY_SUPER_POWER'), UserMiddleware, handleRequest(async (req, res) => {
  const purchase = await buySuperPower(req, res);
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_CREATED, purchase);
}));

router.post("/super-powers/use", UserMiddleware, handleRequest(async (req, res) => {
  const purchase = await useSuperPower(req, res);
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_CREATED, purchase);
}));

export default router;
