import prisma from "../prisma/db.js";
import  *  as bank  from "../utility/walletService.js";
import { encrypt, decrypt, numberToSlug, slugType } from "../utility/cypher.js";
// import { ethers } from "ethers";
import { startOfDay, endOfDay } from "date-fns"; // help calculate start and end of the day
// import { getWalletBalance } from "../utility/blockChainServices.js";
import { getUserWallet } from "../utility/walletService.js";
// import { callWithdrawalAPI, callAssignSwappedToken } from "../utility/blockChainServices.js";



async function ticketConversion(user_id, amount, swapType) {
  const { walletAddress, user_papi } = await getUserWallet(user_id);
  if (!walletAddress || !user_papi) {
    return makeResponse(res, 400, false, "Wallet address or balance key not found for user", {});
  }

  const swap = await prisma.master.findUnique({
    where: { key: "swap" },
  });


  let cryptoBallance,from_currency,to_currency,commissionRate,symbol,symbolReward,recieverAddress;
  if(swapType=='coreToBsc'){
    symbol="pzp_core";
    symbolReward="pzp";
    from_currency='core';
    to_currency='bsc';
    commissionRate=swap.data1.core_to_bsc_processing_fee;
    recieverAddress=process.env.CORE_CONTRACT_ADDRESS;
   cryptoBallance = "await getWalletBalance(walletAddress, symbol)"
  }else{
    symbol="pzp";
    symbolReward="pzp_core";
    from_currency='bsc';
    to_currency='core';
    commissionRate=swap.data1.bsc_to_core_processing_fee;
    recieverAddress=process.env.BSC_CONTRACT_ADDRESS;
    cryptoBallance = "await getWalletBalance(walletAddress, symbol)"
  }

  const availableBalance = cryptoBallance?.balance || 0;
  const nativeBalance = cryptoBallance?.nativeBalance || 0;
  const commissionAmount = (amount * commissionRate)/100;
  const to_amount = amount - commissionAmount;
  
  if(availableBalance < amount){
    const error = new Error("Insufficient balance");
    error.statusCode = 400;
    throw error;
  }
 
  // check swap limit
  let swapLimit = await checkSwapLimit(user_id, swapType, amount);

  console.log("swapLimit-------", swapLimit);
  
  if (swapLimit.status == 0) {
    const error = new Error("Swap limit reached");
    error.statusCode = 400;
    throw error;
  }
  
  // check min swap

  let minSwap = swap.data1.min_swap;
  console.log("minSwap", minSwap);
  

  // let minSwap = await prisma.master.findFirst({ where: { key: "ticketMinSwap" } });
  if (amount < minSwap) {
    const error = new Error("swap amount should be greater than minimum swap amount");
    error.statusCode = 400;
    throw error;
  }

    let txn = await prisma.userWalletHistory.create({
    data: {
      user_id: user_id,
      from_amount: amount,
      from_currency: from_currency,
      operation: bank.operations.swap,
      transaction_type: bank.transactiontype[swapType],
      transaction_hash: null,
      status: "pending",
      to_amount: to_amount,
      amount: amount,
      to_address: recieverAddress,
      to_currency: to_currency,
    },
  });


  if (!txn ) {
    const error = new Error("transaction failed");
    error.statusCode = 400;
    throw error;
  }

  const txnId = txn.id;

  try {
    const withdrawalPayload = {
      RecieverAddress: recieverAddress, // User's BSC wallet
      Amount: to_amount,
      CommissionAmount: commissionAmount,
      CommissionAddress: process.env.COMMISSION_WALLET, // Commission address from env
      walletAddress,
      nativeBalance,
      symbol,
    };


    // return withdrawalPayload

    // Step 1: First API call - Withdrawal




    // const withdrawalResult = await callWithdrawalAPI(
    //   user_papi, // PAPI - user's core private key
    //   withdrawalPayload
    // );
       const withdrawalResult = "";

    if (!withdrawalResult.success) {
      await updateTransactionFailed(txnId, `Withdrawal failed: ${withdrawalResult.error}`);
      throw new Error(`Withdrawal failed: ${withdrawalResult.error}`);
    }

    console.log("Withdrawal API success:", withdrawalResult);

    // Step 3: Second API call - Escrow PZP
    const escrowPayload = {
      FunctionName: "RewardTransfer",
      Amount: to_amount,
      RecieverAddress: walletAddress,
      symbol:symbolReward
    };

    console.log("Calling Escrow API with payload:", escrowPayload);

    // const escrowResult = await callAssignSwappedToken(escrowPayload);
    const escrowResult = "";

    if (!escrowResult.success) {
      await updateTransactionFailed(txnId, `Escrow failed: ${escrowResult.error}`);
      throw new Error(`Escrow failed: ${escrowResult.error}`);
    }

    console.log("Escrow API success:", escrowResult);

    // Step 4: Update transaction as success
    await prisma.userWalletHistory.update({
      where: { id: txnId },
      data: {
        status: "success",
        // to_amount: to_amount,
        // transaction_hash:  escrowResult.txHash,
        transaction_hash: JSON.stringify({
          withdrawalTx: withdrawalResult.txHash,
          escrowTx: escrowResult.txHash,
          commission: commissionAmount
        }),
        // fee_amount: commissionAmount
      },
    });

    return {
      pzpTransferred: to_amount,
      commission: commissionAmount,
      withdrawalTx: withdrawalResult.txHash,
      escrowTx: escrowResult.txHash
    };

  } catch (error) {
    // Update transaction as failed in case of any error
    await updateTransactionFailed(txnId, error.message);
    throw error;
  }
}

// Helper function to update failed transactions
async function updateTransactionFailed(txnId, errorMessage) {
  try {
    await prisma.userWalletHistory.update({
      where: { id: txnId },
      data: {
        status: "failed",
        transaction_hash: JSON.stringify({ error: errorMessage })
      },
    });
  } catch (updateError) {
    console.error("Failed to update transaction status:", updateError);
  }
}


async function withdrawPzpRequest(user_id, amount, toAddress) {
  const user = await prisma.users.findUnique({
    where: {
      id: user_id,
    },
    include: {
      Wallets: true,
    },
  });

  if (!user) return { status: 0, msg: "user not found" };
    if (!user.Wallets?.pzpEvmWallet) return res.status(200).json({ status: 0, message: "wallet not found" });

  let withdrawLimit = await checkWithdrawLimit(user_id, amount);
  if (withdrawLimit.status == 0) return { status: 0, msg: "daily withdraw limit reached" };

  let data = await prisma.master.findFirst({
    where: {
      key: "walletWithdraw",
    },
  });
  if (amount < data.data1.min_withdraw) return { status: 0, msg: "withdraw amount should be greater than minimum withdraw amount" };

  let address = user.Wallets.pzpEvmWallet;

  console.log("address", address);
  
  // const result = await getWalletBalance(address, "pzp");
  const result = {};

  console.log("result bloack chain API", result);
  if (result.balance < amount || amount < 1) return { status: 0, msg: "insufficient balance" };

  let fees = await prisma.master.findFirst({
    where: {
      key: "walletWithdraw",
    },
  });
  console.log("fees", fees);

  let to_amount = amount - (amount * fees.data1.processing_fee) / 100;

  let history = await prisma.userWalletHistory.create({
    data: {
      user_id: user_id,
      from_amount: amount,
      from_currency: bank.currencies.virtual2,
      operation: bank.operations.debit,
      transaction_type: bank.transactiontype.withdrawPzp,
      transaction_hash: null,
      status: "pending",
      to_amount: to_amount,
      amount: amount,
      to_address: toAddress,
      to_currency: bank.currencies.virtual2,
    },
  });

  let slug = numberToSlug(history.id, slugType.withdraw);
  return { status: 1, msg: { slug: slug } };
}

async function convertTicketsToPZP(ticketAmount) {
  const conversionRate = await prisma.master.findUnique({
    where: {
      key: "gemToPzp",
    },
  });

  const pzpAmount = ticketAmount / conversionRate.data2;

  // console.log("actual converted pzpAmount", pzpAmounts);
  
  // const pzpAmount = 0.00001; //set hardcoded value for testing

  return pzpAmount;
}

async function createUserWallet(user_id) {
  const user = await prisma.users.findUnique({
    where: {
      id: user_id,
    },
    include: {
      Wallets: true,
    },
  });

  // return existing evm wallet if already exist
  if (user.Wallets?.pzpEvmWallet) {
    await prisma.wallets.update({
      where: {
        id: user_id,
      },
      data: {
        isTonActive: false,
      },
    });
    return { address: user.Wallets.pzpEvmWallet };
  }

  // const wallet = ethers.Wallet.createRandom();
  const wallet = "";

  console.log("New Wallet address: ", wallet.address);
  console.log("New Wallet privateKey: ", wallet.privateKey);
  

  const address = wallet.address;
  const privateKey = encrypt(wallet.privateKey, process.env.EncryptionKey);

  console.log("New Wallet encrypt privateKey: ", privateKey);


  await prisma.wallets.upsert({
    where: {
      id: user_id, // Unique identifier for checking the record's existence
    },
    update: {
      pzpEvmWallet: address,
      evmWalletPapi: privateKey,
      isTonActive: false, // Initial value for creation
    },
    create: {
      id: user_id, // Required for creating the new record
      pzpEvmWallet: address,
      evmWalletPapi: privateKey,
    },
  });

  return {
    address: address,
  };
}

async function checkSwapLimit(user_id, swapType, ticketAmount = 0) {

  let key;
  if(swapType=='coreToBsc'){
     key = 'core_to_bsc_day_limit'

  }else{
      key = 'bsc_to_core_day_limit'
  }
  //get the swap limit from master

  const swap = await prisma.master.findUnique({
    where: { key: "swap" },
  });
  let swapLimit = swap.data1[key];
  console.log("swapLimit", swapLimit);
  //check if user has crossed the today's total swap limit or not from the user wallet history table
  const todayStart = startOfDay(new Date()); // Get today's start (midnight)
  const todayEnd = endOfDay(new Date()); // Get today's end (23:59:59)

  const swaped = await prisma.userWalletHistory.findMany({
    where: {
      user_id: user_id,
      transaction_type: {
      in: ["coreToBsc", "bscToCore"], // <-- multiple types
    },
      createdAt: {
        gte: todayStart, // Greater than or equal to the start of the day
        lte: todayEnd, // Less than or equal to the end of the day
      },
    },
  });

  console.log("swaped", swaped);
  

  let totalSwapAmount = 0;
  swaped.forEach((element) => {
    if (element.user_id == user_id) totalSwapAmount += element.amount;
  });

  console.log("totalSwapAmount", totalSwapAmount);
  console.log("ticketAmount", ticketAmount);
  console.log("swapLimit", swapLimit);
  

  if (totalSwapAmount >= swapLimit || totalSwapAmount + ticketAmount > swapLimit) {
    return {
      status: 0,
      msg: "swap limit reached",
      availableLimit: swapLimit - totalSwapAmount,
    };
  }

  return { status: 1, availableLimit: swapLimit - totalSwapAmount, global: swap.data1 };
}

async function checkWithdrawLimit(user_id, amount = 0) {
  //get the swap limit from master
  const wL = await prisma.master.findUnique({
    where: { key: "walletWithdraw" },
  });
  let withdrawLimit = wL.data1.day_limit;
  //check if user has crossed the today's total swap limit or not from the user wallet history table
  const todayStart = startOfDay(new Date()); // Get today's start (midnight)
  const todayEnd = endOfDay(new Date()); // Get today's end (23:59:59)

  const withdrawn = await prisma.userWalletHistory.findMany({
    where: {
      user_id: user_id,
      transaction_type: bank.transactiontype.withdrawPzp,
      createdAt: {
        gte: todayStart, // Greater than or equal to the start of the day
        lte: todayEnd, // Less than or equal to the end of the day
      },
    },
  });

  let totalWithdrawAmount = 0;
  withdrawn.forEach((element) => {
    if (element.user_id == user_id) totalWithdrawAmount += element.from_amount;
  });

  if (totalWithdrawAmount >= withdrawLimit || totalWithdrawAmount + amount > withdrawLimit) {
    return {
      status: 0,
      msg: "withdraw limit reached",
      availableLimit: withdrawLimit - totalWithdrawAmount,
    };
  }

  return { status: 1, availableLimit: withdrawLimit - totalWithdrawAmount, global: wL.data1 };
}
async function deductEvmBalance(papi, amount, key, recieverAddress = null, type = null) {
  console.log("User PAPI: ", papi);
  console.log("User PAPI afeter decrypt: ", await decrypt(papi, key));
  
  
  const myHeaders = new Headers();
  myHeaders.append("key", process.env.ESCROW_KEY);
  myHeaders.append("papi", await decrypt(papi, key));
  myHeaders.append("symbol", process.env.SYMBOL);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    RecieverAddress: type == bank.transactiontype.withdrawPzp ? recieverAddress : process.env.CoreContract_Address,
    Amount: amount,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  try {
    // Generate and print cURL command
    const curlCommand = generateCurlCommand(
      `${process.env.BLOCKCHAIN_BASE_URL}/DeductBalance`,
      requestOptions
    );
    console.log("cURL command:");
    console.log(curlCommand);

    const response = await fetch(`${process.env.BLOCKCHAIN_BASE_URL}/DeductBalance`, requestOptions);

    console.log("Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
    }

    const result = await response.json();
    return { status: 200, msg: result };
  } catch (error) {
    console.error("Fetch error: ", error.message);
    return {
      status: 500,
      msg: "An error occurred while deducting the balance.",
      error: error.message
    };
  }
}

// Function to generate cURL command from fetch options
function generateCurlCommand(url, options) {
  let curl = `curl -X ${options.method} \\\n  '${url}' \\\n`;

  // Add headers
  if (options.headers) {
    const headers = options.headers;
    if (headers instanceof Headers) {
      headers.forEach((value, name) => {
        curl += `  -H '${name}: ${value}' \\\n`;
      });
    } else if (typeof headers === 'object') {
      for (const [name, value] of Object.entries(headers)) {
        curl += `  -H '${name}: ${value}' \\\n`;
      }
    }
  }

  // Add body
  if (options.body) {
    // Escape single quotes in JSON body
    const escapedBody = options.body.replace(/'/g, `'\\''`);
    curl += `  -d '${escapedBody}'`;
  }

  return curl;
}


async function transferPzpReward(wallet, amount, key) {
  const myHeaders = new Headers();
  myHeaders.append("key", process.env.ESCROW_KEY);
  myHeaders.append("papi", process.env.ADMIN_PAPI);
  myHeaders.append("symbol", 'pzp_core');
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    FunctionName: "RewardTransfer",
    Amount: amount,
    RecieverAddress: wallet,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

    // 🔥 Print equivalent CURL command
  let curl = `curl -X POST '${process.env.BLOCKCHAIN_BASE_URL}/escrowPZP' \\\n`;
  for (let [key, value] of myHeaders.entries()) {
    curl += `  -H '${key}: ${value}' \\\n`;
  }
  curl += `  -d '${raw}'`;
  console.log("Generated CURL:\n", curl);


  try {
    const response = await fetch(`${process.env.BLOCKCHAIN_BASE_URL}/escrowPZP`, requestOptions);

    if (!response.ok) {
      return { status: 500, msg: response.statusText };
    }
    const result = await response.json(); // Use `.json()` to parse JSON response directly
    return { status: 200, msg: result };
  } catch (error) {
    console.error("Fetch error: ", error);
    return {
      status: 500,
      msg: "An error occurred while calling PZP Reward Transfer.",
    };
  }
}


async function transferEvmNativeBalance(user, key, amount = 0.002) {
  const myHeaders = new Headers();
  myHeaders.append("key", process.env.ESCROW_KEY);
  myHeaders.append("papi", process.env.ADMIN_PAPI);
  myHeaders.append("symbol", "pzp_core");
  // myHeaders.append("symbol", 'ludi_opBnb');
  myHeaders.append("Content-Type", "application/json");

  console.log("process.env.ESCROW_KEY ", process.env.ESCROW_KEY);
  console.log("process.env.Block_papi ", process.env.ADMIN_PAPI);
  const raw = JSON.stringify({
    FunctionName: "TransferNative",
    Amount: amount,
    RecieverAddress: user.Wallets.pzpEvmWallet,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  try {
    const response = await fetch(`${process.env.BLOCKCHAIN_BASE_URL}/escrowPZP`, requestOptions);
    console.log("response status", response);
    
    
    if (response.status == 500) {
      console.log("response", 500);
      return { status: 500, msg: response.statusText };
    }
    console.log("response", 200);

    const result = await response.json(); // Use `.json()` to parse JSON response directly
    return { status: 200, msg: result };
  } catch (error) {
    console.error("Fetch error: ", error);
    return {
      status: 500,
      msg: "An error occurred while transferring the native amount.",
    };
  }
}


// async function getEvmBalance(address, chain = "ludi_opBnb") {
//   const myHeaders = new Headers();
//   myHeaders.append("key", process.env.BALANCE_KEY);
//   myHeaders.append("walletaddress", address);
//   myHeaders.append("symbol", chain);
//   myHeaders.append("refresh", true);

//   const url = `${process.env.BLOCKCHAIN_BASE_URL}/getBalance`;

//   // Convert headers to curl format
//   const headerString = Array.from(myHeaders.entries())
//     .map(([k, v]) => `-H "${k}: ${v}"`)
//     .join(" ");

//   // Build curl command
//   const curlCmd = `curl -X POST ${headerString} "${url}"`;

//   console.log("Generated curl command:\n", curlCmd);

//   const requestOptions = {
//     method: "POST",
//     headers: myHeaders,
//     redirect: "follow",
//   };

//   try {
//     const response = await fetch(url, requestOptions);

//     if (!response.ok) {
//       throw new Error(`Error: ${response.statusText}`);
//     }

//     return response.json(); // parse JSON response
//   } catch (error) {
//     throw new Error(error.message);
//   }
// }

export {
  convertTicketsToPZP,
  ticketConversion,
  createUserWallet,
  // getEvmBalance,
  withdrawPzpRequest,
  deductEvmBalance,
  transferEvmNativeBalance,
  // withdrawEVMNative,
  checkSwapLimit,
  checkWithdrawLimit,
  transferPzpReward,
};
