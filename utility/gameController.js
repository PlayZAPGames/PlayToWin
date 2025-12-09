// import { bot } from "../bot-handlers/bot.js";
// import userData from "./userData.js";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// dotenv.config();
// import { saveProfileImage } from "./profileService.js";
// import { generateToken } from "./tokenAuthService.js";
// import { numberToSlug, slugType } from "./cypher.js";
// import prisma from "../prisma/db.js";

// export async function FTUopenGame(chatId, gameName, userId) {
//   bot.telegram
//     .sendGame(chatId, gameName, {
//       type: "game",
//       id: 123,
//       game_short_name: gameName,
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: "Launch the App 🕹️", callback_game: "this will open game" }],
//           [{ text: "Play Challenge 🤜🤛", callback_data: "pickanother" }],
//           [{ text: "PlayZap Community 🤝", url: "https://t.me/PlayZapOfficial" }],
//         ],
//       },
//     })
//     .then(async () => {
//       await userData.GetUserProfilePic(userId);
//     })
//     .catch((error) => {
//       console.error("Error sending game:", error);
//     });
//   // }
// };

// export async function openGame(chatId, gameName, userId) {
//   bot.telegram
//     .sendGame(chatId, gameName, {
//       type: "game",
//       id: 123,
//       game_short_name: gameName,
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: "Launch the App 🕹️", callback_game: "this will open game" }],
//           [
//             {
//               text: "Challenge 🤜🤛",
//               switch_inline_query_chosen_chat: {
//                 query: gameName,
//                 allow_user_chats: true,
//                 allow_bot_chats: true,
//                 allow_group_chats: true,
//                 allow_channel_chats: true,
//               },
//             },
//           ],
//           [{ text: "Pick Another 🧩", callback_data: "pickanother" }],
//         ],
//       },
//     })
//     .then(async () => {
//       await userData.GetUserProfilePic(userId);
//     })
//     .catch((error) => {
//       console.error("Error sending game:", error);
//     });
// };

// export async function createJWT(
//   tgId,
//   userName,
//   inlineMessageID,
//   gameurl
// ) {
//   let pfpUrl = await userData.GetUserProfilePic(tgId);

//   let userdata = await prisma.users.findUnique({
//     where: { tgid: tgId },
//   })

//   if (userdata.length === 0) {
//     return "No user found";
//   }

//   let uid = userdata.id;
//   let hashId = numberToSlug(uid, slugType.user_id);
//   let gid = hashId;

//   await saveProfileImage(pfpUrl, uid);

//   let data = {
//     tg_Id: tgId,
//     iMessage: inlineMessageID,
//     pfp_url: pfpUrl,
//     user_name: userName,
//     uid: uid,
//     gid: gid,
//     language: "en",
//   };
//   // JWTtoken = jwt.sign(data, jwtSecretKey);
//   const JWTtoken = await generateToken({ userId: uid, data: data });
//   let merge = gameurl;
//   merge += JWTtoken;

//   console.log("GameUrl: ", merge);

//   return merge;
// };


// export function decodeJWT(token) {
//   console.log("GetPFP");
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log(decoded);
//   } catch (error) {
//     console.error(error);
//   }
// }
