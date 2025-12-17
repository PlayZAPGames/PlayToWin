import "./database/db.js";
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";

import authApi from "./routes/auth.js";
import userApi from "./routes/userApi.js";
import spinnerApi from "./routes/spinner.js";
import referralApi from "./routes/referral.js";
import dailyRewardsApi from "./routes/dailyRewardsApi.js";
import dailyloginBonusApi from "./routes/dailyLoginBonusApi.js";
import dailytasks from "./routes/dailytasks.js";
import transaction from "./routes/transaction.js";
import gamesList from "./routes/gameList.js";
import master from "./routes/master.js";
import shopapi from "./routes/shop.js";
import pzpTotalSupply from "./routes/totalSupply.js";
import adminDashboard from "./routes/adminDashboard.js";
import gameRoute from "./routes/game.js";
import earnLudyRoute from "./routes/earnLudyRoutes.js";
import storeRoute from "./routes/storeRoutes.js";
import superPowerRoute from "./routes/superPowerRoutes.js";
import paymentRoute from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes/index.js";
import WeeklyRewardsCronJobs from "./utility/weeklyRewardCron.js";
import {distributeWeeklyRewards} from "./utility/weeklyRewardCron.js";
import {autoCloseTournamentCron} from "./utility/cronJobs.js";

import { insertDefaults } from "./utility/defaultData.js";
// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 2032;

const app = express();

// CORS configuration for Unity support
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'authentication', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//#region Routes
app.use("/api", authApi);
app.use("/api", userApi);
app.use("/api", spinnerApi);
app.use("/api", dailyRewardsApi);
app.use("/api", dailyloginBonusApi);
app.use("/api", dailytasks);
app.use("/api", gamesList);
app.use("/api", referralApi);
app.use("/api", transaction);
app.use("/api", master);
app.use("/api", shopapi);
app.use("/api", pzpTotalSupply);
app.use("/api", adminDashboard);
app.use("/api", gameRoute);
app.use("/api", earnLudyRoute);
app.use("/api", storeRoute);
app.use("/api", superPowerRoute);
app.use("/api", paymentRoute);
app.use("/api/admin", adminRoutes);
//#endregion

app.use("/static", express.static("./static/"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/asign-weekly-reward", (req, res) => {
  distributeWeeklyRewards();
  res.send("Weekly reward distribution started. Check logs for details.");
});


// Start server and set up webhook
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  if (process.env.NODE_ENV === "production") {
    console.log("Running on Production");
  } else {
    console.log("Running on Staging");
  }
  insertDefaults();
  WeeklyRewardsCronJobs();
  autoCloseTournamentCron();
});

app.get("/", (req, res) => {
  res.send("Server is running");
});


