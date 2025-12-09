import express from "express";
const router = express.Router();
import  *  as bank  from "../utility/walletService.js";
import { UserMiddleware } from "../utility/tokenAuthService.js";


router.post("/deductAmount",UserMiddleware, async function (req, res) {
    const {amount, currency} = req.body;
    const userId = req.userId

    //check balance 
    let balance = await bank.getBalance(userId);
    if(balance[currency] < amount) {
        return res.status(400).send("Insufficient balance");
    }

    await bank.updateCurrency(userId, amount, "virtual1","debit",bank.transactiontype.matchEntry);
    return res.status(200).send("OK Resp");
});

export default router;