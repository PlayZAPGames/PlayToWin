import express from "express";
import prisma from '../../prisma/db.js';
import { handleRequest } from "../../helpers/requestHandler/asyncHandler.js";
import { makeResponse, statusCodes } from "../../helpers/index.js";

const router = express.Router();

router.get("/dashboard", handleRequest(async (req, res) => {


 // Parse date range
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end day

    const dateFilter = {
      createdAt: { gte: start, lte: end }
    };

    console.log("Date Filter:", dateFilter);
    

    // Fetch stats in parallel
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers,
      superUsers,
      gameStats,
      // currencyStats
    ] = await Promise.all([
      prisma.users.count({ where: dateFilter }),
      prisma.users.count({ where: { ...dateFilter, status: 0 } }),
      prisma.users.count({ where: { ...dateFilter, status: 1 } }),
      prisma.users.count({ where: { ...dateFilter, status: 2 } }),
      prisma.users.count({ where: { ...dateFilter, role: "super user" } }),
      prisma.users.aggregate({
        _sum: { gamesPlayed: true },
        where: dateFilter
      }),
      // prisma.users.aggregate({
      //   _sum: { virtual1: true, virtual2: true },
      //   where: dateFilter
      // })
    ]);

    // Derived stats
    const totalGamesPlayed = gameStats._sum.gamesPlayed || 0;

    // const totalVirtual1 = currencyStats._sum.virtual1 || 0;
    // const totalVirtual2 = currencyStats._sum.virtual2 || 0;







  return makeResponse(res, 200, true, "data fetched successfully",
     {  
      users: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        superUsers,
        blockedUsers
      },
      games: {
        totalGamesPlayed,
      },
      // currency: {
      //   totalVirtual1,
      //   totalVirtual2
      // } 
    
    });
}));


export default router;
