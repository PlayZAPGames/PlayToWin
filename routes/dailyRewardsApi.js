import express from "express";
const router = express.Router();
import { getDailyRewards, claimDailyRewards } from "../controllers/dailyRewards.js";
import * as dbQuery from "../database/dbQuery.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import { makeResponse } from "../helpers/index.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";

router.get("/get-daily-rewards", UserMiddleware, async function (req, res) {
  const userID = req.userId;
  const result = await getDailyRewards(userID);
  return makeResponse(res, 200, true, "Daily rewards fetched successfully", result);  

});

router.patch("/claim-daily-rewards", UserMiddleware, handleRequest( async function (req, res) {
  const message = await claimDailyRewards(req.userId);
  return makeResponse(res, 200, true, message);
}));

router.patch("/setDailyRewards", UserMiddleware, async function (req, res) {
  const data = req.body;
  await dbQuery
    .setDailyRewards(data)
    .then((result) => {
      return res.status(200).json({ status: 1, data: result });
    })
    .catch((error) => {
      console.error(error);
      return res
        .status(500)
        .send("An error occurred while updating the daily rewards. " + error);
    });
});


router.get("/get-daily-reward-values", UserMiddleware, handleRequest( async function (req, res) {
  const data = await dbQuery.getRewardsValues();
  return makeResponse(res, 200, true, "Daily reward values fetched successfully", data)
}));
 
export default router;
