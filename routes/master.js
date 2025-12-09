import express from "express";
import prisma from "../prisma/db.js";

const router = express.Router();

router.get("/getMaintenance", async function (req, res) {
    const result = await prisma.master.findUnique({
        where: { key: "maintenance" },
    });

    return res.status(200).send({status: 15, data: result.data1.data.status});
});

router.get("/getTicketSwapFee", async function (req, res) {
    const result = await prisma.master.findUnique({
        where: { key: "ticketSwapFee" },
    });

    return res.status(200).send({fee_percent: result.data2});
});

router.get("/getTicketMinSwap", async function (req, res) {
    const result = await prisma.master.findUnique({
        where: { key: "ticketMinSwap" },
    });

    return res.status(200).send({min_Swap: result.data2});
});


// router.get("/withdrawDetail", async function (req, res) {
//     const result = await prisma.Master.findUnique({
//         where: { key: "walletWithdraw" },
//     });

//     return res.status(200).send({data: result.data1});
// });


router.get("/migrationMaintenance", async function (req, res) {
    const result = await prisma.Master.findUnique({
        where: { key: "migrationMaintenance" },
    });

    return res.status(200).send(result.data2);
});

export default router;