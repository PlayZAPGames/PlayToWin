import express from "express";
import { UserMiddleware } from "../utility/tokenAuthService.js";
import * as spinnerController from "../controllers/spinner.js";
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";

const router = express.Router();

// Get spin wheel info and user status
router.get(
  "/spin-wheel/list",
  UserMiddleware,
  handleRequest(async (req, res) => {
    await spinnerController.getSpinWheelInfo(req.userId, res);
  })
);

// Process spin attempt
router.post(
  "/spin-wheel/spin",
  UserMiddleware,
  handleRequest(async (req, res) => {
    await spinnerController.processSpin(req.userId, res);
  })
);

export default router;