import express from "express";
import { UserMiddleware } from "../utility/tokenAuthService.js";

import { getItemDetail, handleStoreItemAction, listStoreItems } from "../controllers/store.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
const { SUCCESS } = statusCodes;

const router = express.Router();


router.get("/store/items", UserMiddleware, handleRequest(async function (req, res) {
  const userId = req.userId; // from auth
  // const { type } = req.query;
  let result = await listStoreItems(userId);;
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, result);
}));




router.post("/store/upgrade/:itemId", UserMiddleware, handleRequest(async (req, res) => {
  // const user = req.user
     const userId = req.user.id; // From authentication middleware

  const { itemId } = req.params;
  const purchase = await handleStoreItemAction(userId, parseInt(itemId));
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, purchase);
}));

router.get("/store/view-item/:itemId", UserMiddleware, handleRequest(async (req, res) => {
  // const user = req.user
     const userId = req.user.id; // From authentication middleware

  const { itemId } = req.params;
  const purchase = await getItemDetail(userId, parseInt(itemId));
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, purchase);
}));

export default router;
