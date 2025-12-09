import express from "express";
const router = express.Router();
import { completeTask, getDailyUserTasks, rewardTaskCompletion } from "../controllers/dailyTasks.js";
import { UserMiddleware, AdminMiddleware } from "../utility/tokenAuthService.js";
import prisma from "../prisma/db.js";
import { makeResponse } from "../helpers/index.js";
import { validators } from "../middleware/validateResource/index.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";

//---- for user
// router.post("/setDailyUserTasks", UserMiddleware, async function (req, res) {
//   const user_id = req.userId;
//   await dailyTasks.setDailyUserTasks(user_id).then((result) => {
//     return res.status(200).json({ status: 1, data: result });
//   });
// });

router.post("/complete-task", validators("COMPLETE_TASK"), UserMiddleware, async function (req, res) {
  const { taskId } = req.body;
  const user_id = req.userId;
  console.log("///// complete task");
  console.log(user_id + "&" + taskId);
  console.log("///// -------------");

  await completeTask(user_id, taskId).then((result) => {
    return makeResponse(res, 200, true, result?.msg, result);
  });
});

router.get("/admin/tasks/getAllUserTasks", AdminMiddleware, async function (req, res) {
  const result = await prisma.dailyUserTasks.findMany();
  return res.status(200).json({ status: 1, data: result });
});

// rewards can be claimed after 12 hours when user fetches the status from the task
router.post("/admin/tasks/rewardTaskCompletion", AdminMiddleware, async function (req, res) {
  const { task_id, user_id } = req.body;
  await rewardTaskCompletion(user_id, task_id).then((result) => {
    return res.status(200).send({ status: 1, data: result });
  });
});

router.get("/get-daily-user-tasks", UserMiddleware, handleRequest(async function (req, res) {
  await getDailyUserTasks(req, res);
}));


export default router;
