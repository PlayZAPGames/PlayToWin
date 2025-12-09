import dotenv from "dotenv";
import express from "express";
const router = express.Router();
dotenv.config();
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";

import {getBalance} from "../utility/walletService.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';

router.get("/get-balance", UserMiddleware, handleRequest(async (req, res) => {
    const user_id = req.userId;
  const data = await getBalance(user_id);
  return makeResponse(res, statusCodes.SUCCESS, true, responseMessages.BALANCE_FETCHED, data);
}));




export default router;
