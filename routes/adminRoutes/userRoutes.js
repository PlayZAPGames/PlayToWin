import express from "express";
import prisma from '../../prisma/db.js';
import { handleRequest } from "../../helpers/requestHandler/asyncHandler.js";
import { makeResponse,responseMessages } from "../../helpers/index.js";
import { numberToSlug, slugToNumber, slugType } from "../../utility/cypher.js";
import { validators } from "../../middleware/validateResource/index.js";

const router = express.Router();

router.get("/users", handleRequest(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { slug, name, role, loginType, status } = req.query;

  // ✅ Build dynamic Prisma filter
  const filters = {};
  if (slug) {
    filters.id = slugToNumber(slug, slugType.user_id) ;
  }
  if (name) {
    filters.username = { contains: name, mode: 'insensitive' }; // partial + case-insensitive match
  }
   if (role) {
    filters.role =  role ; // partial + case-insensitive match
  }
  if (loginType) {
    filters.loginType = loginType;
  }
  if (status !== undefined) {
    filters.status = parseInt(status); // status comes as string
  }

  // ✅ Get filtered total count
  const total = await prisma.users.count({
    where: filters
  });

  // ✅ Get filtered users
  const users = await prisma.users.findMany({
    where: filters,
    skip,
    take: limit,
    orderBy: { id: 'asc' }
  });

  const usersWithSlug = users.map(user => ({
    ...user,
    slug: numberToSlug(user.id, slugType.user_id)
  }));


  const totalPages = Math.ceil(total / limit);
  const pagination = {
    total,
    page,
    limit,
    totalPages
  };

  return makeResponse(res, 200, true, "User listing fetched successfully", { users:usersWithSlug, pagination });
}));


router.put("/users/:id", validators('UPDATE_USER'), handleRequest(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { username, loginType, role, status } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(username !== undefined && { username }),
        ...(loginType !== undefined && { loginType }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status: parseInt(status, 10) }),
      },
    });

  return makeResponse(res, 200, true, responseMessages.RECORD_UPDATED,  user);

}));

// router.get("/users/:id", handleRequest(async (req, res) => {
//   const userId = parseInt(req.params.id, 10);
//   if (isNaN(userId)) {
//     return res.status(400).json({ error: "Invalid user ID" });
//   }

//   // 1. Get user and total redeemed earnings in parallel
//   const [user, totalRedeemed] = await Promise.all([
//     prisma.users.findFirst({ where: { id: userId } }),
//     prisma.userReferral.aggregate({
//       where: {
//         referrer: userId,
//         redeem: true
//       },
//       _sum: {
//         referrerAmount: true
//       }
//     })
//   ]);

//   if (!user) {
//     return makeResponse(res, 404, false, responseMessages.NOT_FOUND, null);
//   }
  
//   // 2. Attach the redeemed amount to user object
//   user.slug = numberToSlug(user.id, slugType.user_id);
//   user.referralEarnings = totalRedeemed._sum.referrerAmount || 0;

//   return makeResponse(res, 200, true, responseMessages.RECORD_FOUND, user);
// }));

router.get("/users/:id", handleRequest(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // Pagination params (default: page 1, limit 10)
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // 1. Fetch user & earnings
  const [user, totalRedeemed] = await Promise.all([
    prisma.users.findFirst({
    where: { id: userId },
     include: { Wallets: { select: { pzpEvmWallet: true }  },
    }
   }),
    prisma.userReferral.aggregate({
      where: { referrer: userId, redeem: true },
      _sum: { referrerAmount: true }
    })
  ]);

  if (!user) {
    return makeResponse(res, 404, false, responseMessages.NOT_FOUND, null);
  }

  // 2. Fetch activities with pagination
  const [activities, totalActivities] = await Promise.all([
    prisma.activities.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" }, // newest first
      skip,
      take: limit
    }),
    prisma.activities.count({ where: { userId: userId } })
  ]);

  // 3. Attach extra data
  user.slug = numberToSlug(user.id, slugType.user_id);
  user.referralEarnings = totalRedeemed._sum.referrerAmount || 0;

  // 4. Response payload
  return makeResponse(res, 200, true, responseMessages.RECORD_FOUND, {
    ...user,
    activities: {
      records: activities,
      pagination: {
        total: totalActivities,
        page,
        limit,
        totalPages: Math.ceil(totalActivities / limit)
      }
    }
  });
}));





export default router;
