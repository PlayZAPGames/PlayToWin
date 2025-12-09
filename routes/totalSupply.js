import express from "express";
const router = express.Router();

router.get("/pzpTotalSupply", async function (req, res) {
    return res.status(200).json(146599998);
});

router.get("/pzpCirculatingSupply", async function (req, res) {
    return res.status(200).json(84495698);
});

export default router;