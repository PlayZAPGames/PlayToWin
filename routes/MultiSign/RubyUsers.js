// import express from "express";
// const router = express.Router();
// import prisma from "../../prisma/db.js";
// import  *  as db from "../../database/db.js";
// import { getEvmBalance } from "../../controllers/shop.js";
// async function handler() {
//   let data;
//   const query = {
//     text: `SELECT u.id, u.user_name, u.last_active , w.key1
//                 FROM users u
//                 JOIN wallets w ON u.id = w.user_id
//                 WHERE u.last_active >= NOW() - INTERVAL '3 months'`,
//   };


//   try {
//     const { rows } = await db.query(query);
//     data = rows;
//     console.log(rows[0].last_active);

//     console.log("last_active fetched successfully");
//   } catch (error) {
//     console.error("Error executing last_active query:", error);
//     return 0;
//   }

//   let finalData = [];
//   for (let i = 0; i < data.length; i++) {
//     console.log("<-------------------");

//     // Check if user_id already exists in the table
//     const existingEntry = await prisma.rubyPZPMigration.findUnique({
//       where: { user_id: data[i].id },
//     });

//     if (existingEntry) {
//       console.log("user_id already exists, skipping...");
//       console.log("------------------->");

//       continue;
//     }

//     console.log(data[i].id);
//     console.log(data[i].user_name);

//     const { result } = await getEvmBalance(data[i].key1, "pzp");
//     const dateOnly = new Date(data[i].last_active).toISOString().split("T")[0];

//     console.log(data[i].key1);
//     console.log(result.data.balance);
//     console.log(dateOnly);
//     if (result.data.balance <= 0) {
//       console.log("balance less than equal to 0");
//       console.log("------------------->");
//       continue;
//     }
//     finalData.push({
//       id: data[i].id,
//       user_name: data[i].user_name,
//       last_active: dateOnly,
//       key1: data[i].key1,
//       old_balance: result.data.balance,
//     });
//     // finalData.push(data[i]);

//     console.log("Adding to DB", data[i].id);
//     console.log("------------------->");
//     await prisma.rubyPZPMigration.create({
//       data: {
//         user_id: data[i].id,
//         user_name: data[i].user_name,
//         last_active: data[i].last_active,
//         key1: data[i].key1,
//         old_balance: result.data.balance,
//       },
//     });
//   }

//   console.log(
//     "All data is added in table, now starting to add new PZP balance"
//   );

//   return finalData;
// }

// router.get("/activeUsers", async function (req, res) {
//   let data = await handler(req, res);

//   return res.status(200).json({ status: 1, data: data });
// });

// export default router;
