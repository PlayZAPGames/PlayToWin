import * as db from "./db.js";
import prisma from "../prisma/db.js";

// ---- Tournaments -----
export const getTournamentDetails = async (iMessage) => {
  const query = {
    text: `SELECT * FROM "Rooms" WHERE "iMessage" = $1 `,
    values: [iMessage],
  };
  const { rows } = await db.query(query);
  return rows;
};

export const createTournament = async (iMessage, isSolo, chatId, gameId, entryFee, currencyType) => {
  const startTime = new Date();
  let releaseTime;
  if (isSolo === "true") {
    releaseTime = new Date(startTime.getTime() + 730 * 24 * 60 * 60 * 1000); //730 days = 2 years
  } else releaseTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);

  const query = {
    text: `INSERT INTO "Rooms" ("iMessage","chatId","gameId","entryFee","currencyType", "startTime", "releaseTime", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6,$7,$8)`,
    values: [iMessage, chatId, gameId, entryFee, currencyType, startTime, releaseTime, startTime],
  };

  try {
    const data = await db.query(query);
    console.log("Data inserted successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing query:", error);
    return 0;
  }
};

export const releaseTournament = async (iMessage) => {
  const currentTime = new Date();

  const query = {
    text: `UPDATE "Rooms" SET "released" = TRUE, "updatedAt" = $1 WHERE "iMessage" = $2`,
    values: [currentTime, iMessage],
  };

  try {
    const data = await db.query(query);
    console.log("Tournament released successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing query: release tournament: ", error);
    return 0;
  }
};

export const setReleaseResponse = async (iMessage, msg) => {
  const query = {
    text: `UPDATE "Rooms" SET "releaseResponse" = $1 WHERE "iMessage" = $2`,
    values: [msg, iMessage],
  };

  try {
    const data = await db.query(query);
    console.log("releaseResponse set successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing query: set response: ", error);
    return 0;
  }
};

export const getTournamentData = async (iMessage) => {
  const query = {
    text: `SELECT  "releaseTime", "chatId", "gameId" FROM "Rooms" WHERE "iMessage" = $1 AND "released" = FALSE`,
    values: [iMessage],
  };

  try {
    const { rows } = await db.query(query);
    console.log("Tournament data retrieved successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getTournamentData query:", error);
    return 0;
  }
};

export const getChatId = async (chatId) => {
  const query = {
    text: `SELECT * FROM "Rooms" WHERE "chatId" = $1 AND "released" = FALSE`,
    values: [chatId],
  };
  try {
    const { rows } = await db.query(query);
    console.log("getChatId successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getChatId query:", error);
    return 0;
  }
};

// ------ USERS QUERY -------
export const setUsers = async (tgid, username) => {
  const currentTime = new Date();
  const epochTime = Math.floor(currentTime.getTime() / 1000);

  console.log("username");
  console.log(username);
  if (!username) username = "_Guest";
  const query = {
    text: `INSERT INTO "UserNotificationTable" ("username","tgid", "updatedAt", "lastActive")
         VALUES ($1, $2, $3,$4)
         ON CONFLICT ("tgid") DO NOTHING`,
    values: [username, tgid, currentTime, epochTime],
  };

  try {
    const data = await db.query(query);
    return data;
  } catch (error) {
    console.error("Error executing SETUSER query:", error);
    return 0;
  }
};

export const getUsers = async () => {
  const query = {
    text: `SELECT tgid FROM "UserNotificationTable"`,
  };
  try {
    const { rows } = await db.query(query);
    console.log("getUsers successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getUsers query:", error);
    return 0;
  }
};

export const getSpecificUser = async (tgid) => {
  const query = {
    text: `SELECT * FROM "UserNotificationTable" WHERE "tgid" = $1 LIMIT 1`,
    values: [tgid],
  };
  try {
    const { rows } = await db.query(query);
    console.log("getSpecificUser successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getSpecificUser query:", error);
    return 0;
  }
};

export const setLastActive = async (tgid) => {
  const currentTime = new Date();
  const epochTime = Math.floor(currentTime.getTime() / 1000);

  const query = {
    text: `UPDATE "UserNotificationTable" SET "lastActive" = $1 WHERE "tgid" = $2`,
    values: [epochTime, tgid],
  };

  try {
    const data = await db.query(query);
    console.log("lastActive set successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing lastActive query:", error);
    return 0;
  }
};

export const setUserStatus = async (tgid, status) => {
  // status 0= default, 1= bot-started 2 = restricted, 3= blocked
  const query = {
    text: `UPDATE "UserNotificationTable" SET "status" = $1 WHERE "tgid" = $2`,
    values: [status, tgid],
  };
  try {
    const data = await db.query(query);
    console.log("setUserStatus set successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing setUserStatus query:", error);
    return 0;
  }
};

//0= default, 1= bot-started 2 = restricted, 3= blocked
export const getUserStatus = async (tgid) => {
  const query = {
    text: `SELECT "status" FROM "UserNotificationTable" WHERE "tgid" = $1 LIMIT 1`,
    values: [tgid],
  };
  try {
    const { rows } = await db.query(query);
    console.log(rows);
    const status = rows.length > 0 ? rows[0].status : null;
    console.log("getUserStatus Fetched successfully:");
    return status;
  } catch (error) {
    console.error("Error executing getUserStatus query:", error);
    return 0;
  }
};

export const getLastActive = async (tgid) => {
  const query = {
    text: `SELECT "lastActive" FROM "UserNotificationTable" WHERE "tgid" = $1 LIMIT 1`,
    values: [tgid],
  };

  try {
    const result = await db.query(query);
    const lastActive = result.rows.length > 0 ? result.rows[0].lastActive : null;
    console.log("getLastActive Fetched successfully:");
    return lastActive;
  } catch (error) {
    console.error("Error executing getLastActive query:", error);
    return 0;
  }
};

// ------ WALLET QUERY -------
export const setWalletAddress = async (tgid, address) => {
  const query = {
    text: `UPDATE "UserNotificationTable" 
  SET "pzpEvmWallet" = $1 
  WHERE "tgid" = $2 
  AND "pzpEvmWallet" IS NULL`,
    values: [address, tgid],
  };

  try {
    const data = await db.query(query);
    console.log("setWalletAddress set successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing setWalletAddress query:", error);
    return 0;
  }
};

//------- Notification QUERY -------
export const updateIsRunningStatus = async (id, dataObj) => {
  try {
    const query = {
      text: `UPDATE "NotificationsData"
            SET data = $2
            WHERE id = $1`,
      values: [id, dataObj],
    };

    const data = await db.query(query);
    console.log("setNotificationData set successfully:", data);

    return data;
  } catch (error) {
    console.error("Error executing setNotificationData query:", error);
    return 0;
  }
};

export const setNotificationData = async (id, dataObj) => {
  try {
    const notifquery = {
      text: `INSERT INTO "Notifications" ("id") 
      VALUES ($1) ON CONFLICT ("id") DO NOTHING;`,
      values: [id],
    };
    await db.query(notifquery);

    const query = {
      text: `INSERT INTO "NotificationsData" ("id", "data")
    VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING;`,
      values: [id, dataObj],
    };

    const data = await db.query(query);
    console.log("setNotificationData set successfully:", data);

    return data;
  } catch (error) {
    console.error("Error executing setNotificationData query:", error);
    return 0;
  }
};

export const getNotificationData = async (id) => {
  let query = id
    ? {
        text: `SELECT * FROM "NotificationsData" WHERE id = $1`,
        values: [id],
      }
    : {
        text: `SELECT * FROM "NotificationsData"`,
        values: [],
      };

  try {
    const { rows } = await db.query(query);
    console.log("getNotificationData fetched successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getNotificationData query:", error);
    return 0;
  }
};

// exports.clearNotificationsTable = async () => {
//   const query = {
//     text: `DELETE FROM "NotificationsData"`,
//     values: [],
//   };
//   try {
//     const { rows } = await db.query(query);
//     console.log("getNotificationData cleared successfully:");
//     return rows;
//   } catch (error) {
//     console.error("Error clearing getNotificationData row:", error);
//     return 0;
//   }
// };

// this.clearNotificationsTable();

export const deleteNotificationDataById = async (id) => {
  const query = {
    text: `DELETE FROM "NotificationsData" WHERE "id" = $1`,
    values: [id],
  };
  try {
    const { rows } = await db.query(query);
    console.log("getNotificationData deleted successfully:");
    return rows;
  } catch (error) {
    console.error("Error deleting getNotificationData row:", error);
    return 0;
  }
};

export const updateId = async (newId, oldId) => {
  try {
    const notifquery = {
      text: `UPDATE "Notifications" SET "id" = $1 WHERE "id" = $2`,
      values: [newId, oldId],
    };
    await db.query(notifquery);

    const query = {
      text: `UPDATE "NotificationsData" SET "id" = $1 WHERE "id" = $2`,
      values: [newId, oldId],
    };

    const data = await db.query(query);
    console.log("updateId set successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing updateId query:", error);
    return 0;
  }
};

// ------ BALANCE QUERY -------
export const getBalance = async (currency, tgid) => {
  const query = {
    text: `SELECT ${currency} FROM "UserNotificationTable" WHERE "tgid" = $1`,
    values: [tgid],
  };

  try {
    const { rows } = await db.query(query);
    console.log("getBalance fetched successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getBalance query:", error);
    return 0;
  }
};

export const updateBalance = async (tgid, balance, currency) => {
  if (!balance || !tgid || !currency) return;

  let currentBalance = 0;
  const getBalance = {
    text: `SELECT ${currency} FROM "UserNotificationTable" WHERE "tgid" = $1`,
    values: [tgid],
  };
  try {
    const { rows } = await db.query(getBalance);
    console.log("getBalance set successfully:", rows);
    currentBalance = rows[0][currency];
  } catch (error) {
    console.error("Error executing updateBalance query:", error);
    return 0;
  }
  balance = balance + currentBalance;
  const query = {
    text: `UPDATE "UserNotificationTable" SET ${currency} = $1 WHERE "tgid" = $2`,
    values: [balance, tgid],
  };
  try {
     await db.query(query);
    console.log("updateBalance set successfully:");
    return "updateBalance set successfully";
  } catch (error) {
    console.error("Error executing updateBalance query:", error);
    return 0;
  }
};

// ------ MASTER QUERY -------
export const setMaintenance = async (status) => {
  const data_json = { status: status };
  await db.query(
    `UPDATE "Master"
    SET "data1" = '{"data": ${data_json}}'::jsonb
    WHERE "key" = 'maintenance';`
  );
};

export const getMaintenance = async () => {
  const query = {
    text: `SELECT "data1" FROM "Master" WHERE "key" = 'maintenance' LIMIT 1`,
  };
  try {
    const result = await db.query(query);
    const status = result.rows.length > 0 ? result.rows[0].data1 : null;
    console.log("getMaintenance Fetched successfully:", status);
    return status;
  } catch (error) {
    console.error("Error executing getMaintenance query:", error);
    return 0;
  }
};

export const getReferralRewards = async () => {
  const query = {
    text: `SELECT "data1" FROM "Master" WHERE "key" = 'referral'`,
  };
  try {
    const { rows } = await db.query(query);
    console.log("getReferralRewards fetched successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getReferralRewards query:", error);
    return 0;
  }
};

// ------ DailyRewards QUERY -------
export const getDailyRewards = async (userid) => {
  const query = {
    text: `SELECT * FROM "DailyRewards" WHERE "user_id" = $1`,
    values: [userid],
  };
  try {
    const { rows } = await db.query(query);
    console.log("getDailyRewards fetched successfully:");
    return rows;
  } catch (error) {
    console.error("Error executing getDailyRewards query:", error);
    return 0;
  }
};

export const setDailyRewards = async (data) => {
  const { userId, dailySession } = data;
  console.log("--<><userId", userId);
  const time = new Date();
  console.log(time);
  const query = {
    text: `INSERT INTO "DailyRewards" ("user_id","dailySession","updatedAt","createdAt") 
  VALUES ($1, $2, $3, $4)`,
    values: [userId, dailySession, time, time],
  };
  try {
    const result = await db.query(query);
    console.log("setDailyRewards set successfully:", result);
    return result;
  } catch (error) {
    console.error("Error executing setDailyRewards query:", error);
    return 0;
  }
};

export const updateDailyRewards = async (data) => {
  const { userId, dailySession } = data;
  const query = {
    text: `UPDATE "DailyRewards"
           SET "dailySession" = $1::jsonb
           WHERE "user_id" = $2`,
    values: [dailySession, userId],
  };

  try {
    const result = await db.query(query);
    console.log("setDailyRewards set successfully:");
    return result;
  } catch (error) {
    console.error("Error executing setDailyRewards query:", error);
    return 0;
  }
};


export const getRewardsValues = async () => {

  try {

      let DailyRewardValues = await prisma.master.findUnique({
        where: {
          key: "DailyRewardValues",
        },
      });
    return DailyRewardValues?.data1 ?? { days: [] };
  } catch (error) {
    throw new Error("Error fetching DailyRewardValues: " + error.message);
  }
};

// ---- Referral ----
export const getReferrer = async (userId, referrerUserID) => {
  const query = {
    text: `SELECT referrer FROM "UserReferral" WHERE "id" = $1 AND "referrer" = $2`,
    values: [userId, referrerUserID],
  };
  try {
    const { rows } = await db.query(query);
    console.log("checkReferrer fetched successfully:", rows);
    return rows;
  } catch (error) {
    console.error("Error executing checkReferrer query:", error);
    return 0;
  }
};

export const addReferalData = async (referrerUserID, referrerReward, userId, refereeReward) => {
  const time = new Date();
  const query = {
    text: `INSERT INTO "UserReferral" ("referrer", "referrerAmount", "referee", "refereeAmount","updatedAt") VALUES ($1, $2, $3, $4, $5)`,
    values: [referrerUserID, referrerReward, userId, refereeReward, time],
  };
  try {
    const { rows } = await db.query(query);
    console.log("Referrer added successfully:", rows);
    return rows;
  } catch (error) {
    console.error("Error executing addReferrer query:", error);
    return 0;
  }
};

// ---- Analytics ----
export const getTopPlayers = async (iMessage, count) => {
  // Query to get the id from Rooms table
  const getIdQuery = {
    text: `SELECT "id" FROM "Rooms" WHERE "iMessage" = $1`,
    values: [iMessage],
  };

  try {
    // Execute the query to get the id
    const getIdResult = await db.query(getIdQuery);

    if (getIdResult.rows.length > 0) {
      const roomId = getIdResult.rows[0].id;

      // Query to join UserTournament, UserNotificationTable, and UserTournamentScores on relevant fields and fetch desired columns, limited to top 5 records
      const joinQuery = {
        text: `WITH highest_scores AS (
    SELECT ut."tgId", MAX(uts."score") AS highest_score
    FROM "UserTournament" ut
    JOIN "UserTournamentScores" uts ON ut."id" = uts."userTournamentId"
    WHERE ut."roomId" = ${roomId}
    GROUP BY ut."tgId"
)
SELECT ut."tgId", ut."userName", ut."id" AS "user_tournament_id", hs.highest_score
FROM "UserTournament" ut
JOIN "UserNotificationTable" un ON ut."tgId" = un."tgid"
JOIN "UserTournamentScores" uts ON ut."id" = uts."userTournamentId"
JOIN highest_scores hs ON ut."tgId" = hs."tgId" AND uts."score" = hs.highest_score
WHERE ut."roomId" = $1
ORDER BY hs.highest_score DESC
               LIMIT ${count}`,
        values: [roomId],
      };

      // Execute the query to get the joined data
      const joinResult = await db.query(joinQuery);

      // Return the retrieved data
      return joinResult.rows;
    } else {
      // No matching room id found
      console.log("No matching room id found.");
      return [];
    }
  } catch (error) {
    console.error("Error executing queries: getTopPlayers: ", error);
    return [];
  }
};

export const newUsers = async () => {
  const prevDate = new Date(new Date().setDate(new Date().getDate() - 1));

  const query = {
    text: `SELECT * FROM "UserNotificationTable"
  WHERE "createdAt" > $1`,
    values: [prevDate],
  };

  try {
    const data = await db.query(query);
    console.log("newUsers fetched successfully:");
    return data;
  } catch (error) {
    console.error("Error executing newUsers query:", error);
    return 0;
  }
};

export const activeUsers = async (days) => {
  const fromDate = new Date(new Date().setDate(new Date().getDate() - days));

  const query = {
    text: `SELECT * FROM "UserNotificationTable"
  WHERE "updatedAt" > $1`,
    values: [fromDate],
  };

  try {
    const data = await db.query(query);
    console.log("newUsers fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing newUsers query:", error);
    return 0;
  }
};

export const totalRounds = async (iMessage) => {
  const query = {
    text: `select COUNT(*)  from "UserTournamentScores" uts
  left outer join "UserTournament" ut 
  on ut.id = uts."userTournamentId"
  where ut."iMessage" = $1`,
    values: [iMessage],
  };

  try {
    const data = await db.query(query);
    console.log("totalRounds fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing totalRounds query:", error);
    return 0;
  }
};

export const totalUsers = async (iMessage) => {
  const query = {
    text: `select COUNT(*)  from "UserTournament" ut
  where ut."iMessage" = $1`,
    values: [iMessage],
  };

  try {
    const data = await db.query(query);
    console.log("totalUsers fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing totalUsers query:", error);
    return 0;
  }
};

export const getGameID = async (iMessage) => {
  const query = {
    text: `select "gameId" from "Rooms" where "iMessage" = $1`,
    values: [iMessage],
  };

  try {
    const data = await db.query(query);
    console.log("getGameID fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("Error executing getGameID query:", error);
    return 0;
  }
};
