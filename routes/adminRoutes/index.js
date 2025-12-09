// routes/index.ts
import { Router } from "express";
import loginRoutes from "./loginRoute.js";
import airdropRoutes from "./airdropRoutes.js";
import userRoutes from "./userRoutes.js";
import gameRoutes from "./gameRoutes.js";
import settingRoutes from "./settingRoutes.js";
import spinnerRoutes from "./spinnerRoutes.js";
import earnLudyRoutes from "./earnLudyRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import storeRoutes from "./storeRoutes.js";
import superPowerRoutes from "./superPowerRoutes.js";
import { AdminMiddleware, requireRoles } from '../../utility/tokenAuthService.js';
import { PlayerRole } from '../../utility/enums.js';


console.log("Admin Routes Loaded", PlayerRole);


const router = Router();

router.use("/", loginRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), airdropRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), userRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), settingRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), gameRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), spinnerRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), earnLudyRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), dashboardRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), storeRoutes);
router.use("/", AdminMiddleware,  requireRoles([PlayerRole.super_admin, PlayerRole.admin]), superPowerRoutes);

export default router;

