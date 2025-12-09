// import express from "express";
// const router = express.Router();
// import { encrypt, decrypt, slugToNumber, slugToString, numberToSlug, decryptRubyData, slugType } from "../utility/cypher.js";

// router.post("/cypher/encrypt", async function (req, res) {
//     const { text, secret } = req.body;
//     console.log(text);
//     const result = await encrypt(text, secret );
//     return res.status(200).json({ status: 1, data: result });
// });

// router.post("/cypher/decrypt", async function (req, res) {
//     const { text, secret } = req.body;
//     const result = await decrypt(text, secret);
//     return res.status(200).json({ status: 1, data: result });
// });

// router.post("/cypher/decryptRubyData", async function (req, res) {
//     const { text, secret } = req.body;
//     const result = await decryptRubyData(text, secret);
//     return res.status(200).json({ status: 1, data: result });
// });

// router.get("/cypher/slugToNumber", async function (req, res) {
//     const slug  = req.headers["slug"];
//     let type  = req.headers["type"];

//     Object.keys(slugType).forEach((key) => {
//         if(key == type){
//             type = slugType[key];
//         }
//     });

//     const result = await slugToNumber(slug,type);
//     return res.status(200).json({ status: 1, data: result });
// });

// router.patch("/cypher/numberToSlug", async function (req, res) {
//     const slug  = req.headers["slug"];
//     let type  = req.headers["type"];

//     Object.keys(slugType).forEach((key) => {
//         if(key == type){
//             type = slugType[key];
//         }
//     });

//     const result = await numberToSlug(slug,type);

//     return res.status(200).json({ status: 1, data: result });
// });

// router.get("/cypher/slugToString", async function (req, res) {
//     const slug  = req.headers["slug"];
//     const result = await slugToString(slug);
//     return res.status(200).json({ status: 1, data: result });
// });

// export default router;
