// import express from "express";
// const router = express.Router();
// import prisma from "../../prisma/db.js";
// // import walletList from "./multiSignWhitelistWallets.json";
// import { stringToSlug, slugToString } from "../../utility/cypher.js";
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const solWallet = require('./Solana_SnapShot.json');
// const solWallet2 = require('./Solana_SnapShot_db.json');

// // const whitelistedWallets = require("./multiSignWhitelistWallets.json");
// // check if user is whitelisted
// router.get("/isWhitelisted", async function (req, res) {
//   const wallet = req.headers.wallet; // Extract wallet address from headers
//   // Search for the wallet in the list and get its balance if whitelisted

//   let List = await prisma.master.findUnique({
//     where: { key: "multiSign_WhiteListWallets" },
//   });

//   if (!List) {
//     return res
//       .status(200)
//       .json({ msg: "WhiteList has been removed or is empty" });
//   }
//   let walletList = List.data1.walletList;

//   const walletDetails = walletList.find((walletObj) => {
//     if (walletObj.HolderAddress.toLowerCase() === wallet.toLowerCase()) {
//       return walletObj;
//     }
//   });

//   let data;
//   try {
//     data = await prisma.multiSignUsers.findUnique({
//       where: {
//         WalletAddress: wallet.toLowerCase(),
//       },
//     });
//   } catch (err) {
//     console.log(err);
//   }
//   if (!walletDetails)
//     return res.status(200).json({
//       whitelisted: false,
//       message: `
// <p>Wallet address is not whitelisted, as per the snapshot block number: 42796184.</p>
// <p>
//   Please contact <a
//     href="https://t.me/PlayZapsupportchat"
//     style={{ color: 'blue', textDecoration: 'underline' }}
//   >
//     support
//   </a>
// </p>

//       `,
//     });

//   let slug = stringToSlug(walletDetails.HolderAddress);
//   if (walletDetails) {
//     // Wallet found in the whitelist, return the balance as well
//     try {
//       await prisma.multiSignUsers.upsert({
//         where: { WalletAddress: walletDetails.HolderAddress.toLowerCase() }, // Unique identifier
//         update: {}, // Leave empty if you don't want to update existing records
//         create: {
//           WalletAddress: walletDetails.HolderAddress.toLowerCase(),
//           From_Amount: 0,
//           From_TransactionHash: walletDetails.HolderAddress.toLowerCase(),
//         },
//       });
//     } catch (err) {
//       console.log(err);
//     }

//     return res.status(200).json({
//       whitelisted: true,
//       wallet: walletDetails.HolderAddress,
//       balance: Math.floor(walletDetails.Balance),
//       request_id: slug,
//       hasRequested: data ? data.hasRequested : false,
//       isBriged: data?.Bridged,
//     });
//   } else {
//     // Wallet not found in the whitelist
//     return res.status(200).json({
//       whitelisted: false,
//       balance: null,
//     });
//   }
// });

// // function checkAndConvert(number) {
// //   if (number.toString().includes('e')) {
// //       let [intPart] = number.toString().split('e')[0].split('.');
// //       return parseInt(intPart, 10);
// //   }
// //   return Math.floor(number);
// // }

// router.patch("/updateEligible", async function (req, res) {
//   const id = parseInt(req.headers.id);

//   let data = await prisma.multiSignUsers.findUnique({
//     where: { id },
//   });

//   await prisma.multiSignUsers.update({
//     where: { id },
//     data: {
//       isEligible: !data.isEligible,
//     },
//   });
//   return res.status(200).json("user updated to " + data.isEligible);
// });

// router.post("/hasBridge", async function (req, res) {
//   const { wallets, To_TransactionHash, To_Amounts } = req.body;

//   for (let i = 0; i < wallets.length; i++) {
//     let wallet = wallets[i];
//     let To_Amount = To_Amounts[i];

//     try {
//       await prisma.multiSignUsers.update({
//         where: { WalletAddress: wallet.toLowerCase() }, // Unique identifier
//         data: {
//           To_Amount: To_Amount,
//           To_TransactionHash: To_TransactionHash,
//           Bridged: true,
//           isEligible: true,
//         },
//       });
//     } catch (err) {
//       console.log(err);
//     }
//   }
//   return res.status(200).json("all users set");
// });

// router.post("/setWalletRecord", async function (req, res) {
//   const isSolana = req.query.isSolana;
//   const { wallet, from_TransactionHash, source } = req.body;

//   console.log(isSolana);
//   let data = isSolana
//     ? await solHandler(wallet)
//     : await handler(wallet, from_TransactionHash, source);
//   return res.status(200).json(data);
// });



// router.get("/getHistory", async function (req, res) {
//   let wallet = req.headers.wallet;

//   wallet = wallet.toLowerCase();

//   try {
//     let data = await prisma.multiSignUsers.findUnique({
//       where: {
//         WalletAddress: wallet,
//       },
//     });
//     let slug = stringToSlug(data.WalletAddress);
//     return res.status(200).json({ msg: data, slug });
//   } catch (err) {
//     console.log(err);
//     return res.status(200).json({ msg: "No record found for this wallet" });
//   }
// });

// router.post("/Bridgelogin", async function (req, res) {
//   let { wallet, loginData, email } = req.body;
//   wallet = wallet.toLowerCase();
//   let data = await prisma.multiSignUsers.findUnique({
//     where: {
//       WalletAddress: wallet,
//     },
//   });

//   if (!data) {
//     return res.status(200).json({ message: "No record found for this wallet" });
//   }

//   await prisma.multiSignUsers.update({
//     where: {
//       WalletAddress: wallet,
//     },
//     data: {
//       GoogleLogin: loginData,
//       Email: email,
//     },
//   });

//   return res
//     .status(200)
//     .json({ status: 1, message: "Login Data added successfully" });
// });

// router.get("/checkHash", async function (req, res) {
//   let hash = req.headers["hash"];
//   let data = await checkTransactionHash(hash);

//   return res.status(data.status).json(data.msg);
// });

// router.get("/createJsonData", async function (req, res) {});

// router.get("/enableMaintenance", async function (req, res) {
//   const result = await prisma.Master.update({
//     where: { key: "migrationMaintenance" },
//     data: {
//       data2: true,
//     },
//   });
//   return res
//     .status(200)
//     .json({ status: 1, message: "Maintenance mode enabled" });
// });

// router.get("/verifySolanaWallet", async function (req, res) {
//   const wallet = req.headers.wallet;

//   if (!wallet) {
//     return res.status(200).json({ message: "Please provide a wallet" });
//   }

//   const walletDetails = solWallet.find((walletObj) => {
//     if (walletObj.address.toLowerCase() === wallet.toLowerCase()) {
//       return walletObj;
//     }
//   });

//   if (!walletDetails) {
//     return res
//       .status(200)
//       .json({ whitelisted: false, message: "Wallet is not whitelisted" });
//   }

//   // let checkWallet = await prisma.multiSignUsers.findUnique({
//   //   where: { WalletAddress: walletDetails.address.toLowerCase() },
//   // });

//   // if (checkWallet) {
//   //   return res
//   //     .status(200)
//   //     .json({
//   //       whitelisted: true,
//   //       msg: "Wallet is already whitelisted",
//   //       balance: parseFloat(walletDetails.amount),
//   //       hasRequested: checkWallet.hasRequested,
//   //     });
//   // }
//   let data
//   try {
//     data = await prisma.multiSignUsers.upsert({
//       where: { WalletAddress: walletDetails.address.toLowerCase() },
//       update: {},
//       create: {
//         WalletAddress: walletDetails.address.toLowerCase(),
//         From_Amount: parseFloat(walletDetails.amount),
//         From_TransactionHash: walletDetails.address,
//         isSolanaAddress: true,
//         isManualUser: true,
//       },
//     })
//   } catch (err) {
//     console.log(err);
//   }
//   console.log(walletDetails);
//   console.log(data);
//   return res.status(200).json({ whitelisted: true,
//     wallet: walletDetails.address.toLowerCase(),
//     balance: Math.floor(walletDetails.amount),
//     hasRequested: data ? data.hasRequested : false,
//     isBriged: data?.Bridged });
// });

// router.get("/slugToString", async function (req, res) {
//   let slug = req.headers["slug"];
//   let data = slugToString(slug);
//   return res.status(200).json({ status: 1, data: data });
// });

// // Helper Functions

// async function solHandler(address) {
//   try {
//     await prisma.multiSignUsers.update({
//       where: { WalletAddress: address },
//       data: {
//         hasRequested: true,
//       },
//     });
//     let slug = stringToSlug(address);

//     return {
//       whitelisted: true,
//       message: "Record Created or Updated",
//       request_id: slug,
//       status: 1,
//     };
//   } catch (err) {
//     return {
//       message: `
//        Something went wrong`,
//       status: 2,
//       error: err,
//     };
//   }
// }
// async function checkTransactionHash(hash) {
//   const myHeaders = new Headers();
//   myHeaders.append("key", process.env.Blockpuri_Key);
//   myHeaders.append("hash", hash);
//   myHeaders.append("symbol", "bsc");
//   myHeaders.append("Content-Type", "application/json");

//   const requestOptions = {
//     method: "POST",
//     headers: myHeaders,
//     redirect: "follow",
//   };

//   try {
//     const response = await fetch(
//       `${process.env.Blockpuri_BaseUrl}/api/checkTransactionHash`,
//       requestOptions
//     );

//     if (!response.ok) {
//       return { status: 500, msg: response.statusText };
//     }
//     const result = await response.json(); // Use `.json()` to parse JSON response directly

//     let chainId = "0x38";
//     let resp = result.msg;
//     if (resp.chainId != chainId) {
//       return { status: 200, msg: "Invalid Chain Hash" };
//     }

//     if (
//       resp.receiverAddress.toLowerCase() !=
//       process.env.Bridge_Address.toLowerCase()
//     ) {
//       return { status: 200, msg: "Invalid Receiver Address" };
//     }

//     // let data = await handler(resp.fromAddress, hash, "", true);

//     return { status: 200, msg: resp };
//   } catch (error) {
//     console.error("Fetch error: ", error);
//     return {
//       status: 500,
//       msg: "An error occurred while transferring the native amount.",
//     };
//   }
// }


// router.get("/matchAndCopyAddresses", async function (req, res) {
//   const updatedJson2 = matchAndCopyAddresses(solWallet, solWallet2);
//   return res.status(200).json(updatedJson2);
// });

// // Function to match and copy addresses from json1 to json2
// function matchAndCopyAddresses(json1, json2) {
//   // Create a map for quick lookup of addresses in json1, using lowercase addresses as keys
//   const addressMap = new Map();
//   json1.forEach(item => {
//     addressMap.set(item.address.toLowerCase(), item.address);
//   });

//   // Update json2 with addresses from json1 if a match is found
//   json2.forEach(item => {
//     const lowerCaseAddress = item.address.toLowerCase();
//     if (addressMap.has(lowerCaseAddress)) {
//       item.address = addressMap.get(lowerCaseAddress); // Update to match the address in json1
//     }
//   });

//   console.log(json2);

//   return json2;
// }

// // Run the function and log the updated json2






// async function handler(
//   wallet,
//   From_TransactionHash = null,
//   source = "",
//   isManualUser = false
// ) {
//   const result = await prisma.Master.findUnique({
//     where: { key: "migrationMaintenance" },
//   });

//   if (result.data2 === true) {
//     return { status: 0, msg: "Maintenance Mode" };
//   }

//   if (!wallet) return { status: 0, msg: "Wallet not found" };
//   wallet = wallet.toLowerCase();

//   let hashData = await checkTransactionHash(From_TransactionHash);

//   if (
//     hashData.msg.receiverAddress.toLowerCase() !=
//     process.env.Bridge_Address.toLowerCase()
//   )
//     return { status: 0, msg: "Invalid Transaction Hash" };
//   if (hashData.msg.fromAddress.toLowerCase() != wallet)
//     return { status: 0, msg: "Hash doesn't belong to this wallet" };

//   let List = await prisma.master.findUnique({
//     where: { key: "multiSign_WhiteListWallets" },
//   });

//   if (!List) {
//     return res
//       .status(200)
//       .json({ msg: "WhiteList has been removed or is empty" });
//   }
//   let walletList = List.data1.walletList;

//   const walletDetails = walletList.find(
//     (walletObj) =>
//       walletObj.HolderAddress.toLowerCase() === wallet.toLowerCase()
//   );

//   if (!walletDetails)
//     return {
//       whitelisted: false,
//       message: `
//         <p>Wallet address is not whitelisted, as per the snapshot block number: 42796184.</p>
// <p>
// Please contact <a
//     href="https://t.me/PlayZapsupportchat"
//     style={{ color: 'blue', textDecoration: 'underline' }}
//   >
//     support
//   </a>
// </p>
//       `,
//       status: 0,
//     };

//   try {
//     try {
//       await prisma.multiSignUsers.update({
//         where: { WalletAddress: walletDetails.HolderAddress.toLowerCase() }, // Unique identifier
//         data: {
//           From_Amount: walletDetails.Balance,
//           From_TransactionHash: From_TransactionHash,
//           Source: source,
//           hasRequested: true,
//           isManualUser: isManualUser,
//         },
//       });
//     } catch (error) {
//       return {
//         message: `
//          Something went wrong`,
//         status: 2,
//         error: error,
//       };
//     }

//     let slug = stringToSlug(walletDetails.HolderAddress);

//     walletList = walletList.map((wallet) => {
//       if (wallet.HolderAddress === walletDetails.HolderAddress) {
//         wallet.HasRequested = "Yes"; // Change the value to "Yes"
//       }
//       return wallet;
//     });

//     await prisma.master.update({
//       where: { key: "multiSign_WhiteListWallets" },
//       data: {
//         data1: {
//           walletList: walletList, // Update with the modified walletList
//         },
//       },
//     });

//     console.log("Wallet list updated successfully.");

//     return {
//       whitelisted: true,
//       message: "Record Created or Updated",
//       request_id: slug,
//       status: 1,
//     };
//   } catch (err) {
//     console.log(err);
//     return {
//       status: 0,
//       message: "Something went wrong, or transaction hash already submitted",
//     };
//   }
// }

// export default router;
