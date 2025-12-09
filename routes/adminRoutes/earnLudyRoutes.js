import express from "express";
import { handleRequest } from "../../helpers/requestHandler/asyncHandler.js";
import { validators } from '../../middleware/validateResource/index.js';
import { addEarnLudy, updateEarnLudy, getEarnLudy, deleteEarnLudy } from "../../controllers/dailyTasks.js";
import { makeResponse, statusCodes, responseMessages } from '../../helpers/index.js';
const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;

const router = express.Router();

// Daily Tasks

router.post("/earn-ludy", validators('EARN_LUDY'), handleRequest( async function (req, res) {
  const { task_name, task_desc, reward, reward_range, currency_type, status, task_pfp, task_redirect, due_date } = req.body;

  await addEarnLudy(task_name, task_desc, reward, reward_range, currency_type, status, task_pfp, task_redirect, due_date).then((result) => {
    return makeResponse(res, SUCCESS, true, responseMessages.DAILY_TASK_VALUE_ADDED, result);
  });
}));

router.patch("/earn-ludy/:id", validators('UPDATE_EARN_LUDY'), handleRequest(async function (req, res) {
  const { id } = req.params;
  const { task_name,  task_desc = "",  reward, reward_range, currency_type, status = "InActive",  task_pfp, task_redirect,  due_date = null } = req.body;
  const result = await updateEarnLudy(parseInt(id), task_name, task_desc, reward, reward_range, currency_type, status, task_pfp, task_redirect,due_date );
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_UPDATED, result);
}));


router.get("/earn-ludy", handleRequest( async function (req, res) {
  const result = await getEarnLudy();
    return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, result);

}));

router.delete("/earn-ludy/:id", handleRequest( async function (req, res) {
  const id = parseInt(req.params.id);
  await deleteEarnLudy(id);
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_DELETE);
}));


export default router;
