import express from "express";
const router = express.Router();
import { getLoginStrak, claimDailyLoginBonus } from "../controllers/dailyloginBonus.js";
import * as dbQuery from "../database/dbQuery.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { makeResponse } from "../helpers/index.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";

router.get("/get-login-streak", UserMiddleware, async function (req, res) {
  const userID = req.userId;
  const result = await getLoginStrak(userID);
  return makeResponse(res, 200, true, "Daily rewards fetched successfully", result);  

});

router.patch("/claim-daily-login-bonus", UserMiddleware, handleRequest( async function (req, res) {
  const message = await claimDailyLoginBonus(req.userId);
  return makeResponse(res, 200, true, message);
}));


router.get("/get-daily-login-bonus-values", UserMiddleware, handleRequest( async function (req, res) {
  const data = await dbQuery.getRewardsValues();
  return makeResponse(res, 200, true, "Daily reward values fetched successfully", data)
}));
 
export default router;
