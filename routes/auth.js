import express from "express";
import { generateToken, generateRefreshToken, UserMiddleware, verifyToken, verifyRefreshToken } from "../utility/tokenAuthService.js";
import * as bank from "../utility/walletService.js";
import { handler } from "../controllers/referral.js";
import prisma from "../prisma/db.js";
// import { decodeJWT } from "../utility/gameController.js";
const router = express.Router();
import { validators } from "../middleware/validateResource/index.js";
import { numberToSlug, slugToNumber, slugType } from "../utility/cypher.js";
import { createUserWallet } from "../controllers/shop.js";
import { getFirebaseUser } from "../utility/verifyFirebaseToken.js";


import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
import { handleRequest } from "../helpers/requestHandler/asyncHandler.js";
const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;
import { encrypt, decrypt } from "../utility/cypher.js";
import { getUserWallet } from "../utility/walletService.js";

import { logActivity } from "../utility/activityServices.js";

router.get("/test", UserMiddleware ,async (req, res) => {

  const  cons = await getUserWallet(req.userId)

// const sec = '1873c0ff9e5eef5e616bd699a7f945ac:63096d3626ccef4c708eeab26543899730a464663090a59dc01b51d3038d6a2c106c8509a3f758f0402f40b0da7a165180010319a780f2dc56d3d557e2def0c9483f5965259d8ecc56945912d3b47ea2'
// const key = process.env.EncryptionKey;

//     const cons =  decrypt(sec, key)


  return res.json({ message: "Auth route is working", cons  });
});

// Login endpoint
router.post("/login", validators('USER_SIGNUP'), async (req, res) => {
  try {
    const { socialId, loginType, referralCode } = req.body;
    const authToken = req.headers.authentication?.split(' ')[1]; // Get token from header
    let username = "", imageUrl = null;
    let existingUserWithToken = null;

    // If token is provided, verify it and get the user
    if (authToken) {
      try {
        const decoded = await verifyToken(authToken);

        existingUserWithToken = await prisma.users.findUnique({
          where: { id: decoded.userId },
        });

        // Check if user is trying to convert from guest to social login
        if (existingUserWithToken && existingUserWithToken.loginType === 'guest' &&
          (loginType === 'google' || loginType === 'apple')) {

          // Verify the social login credentials
          if (loginType === 'google') {
            const userData = await getFirebaseUser(socialId);
            username = userData?.displayName;
            imageUrl = userData?.photoURL;
          }
          // Check if socialId is already used by another account
          const userWithSameSocialId = await prisma.users.findUnique({
            where: { socialId },
          });

          if (userWithSameSocialId) {
            // Social account exists - ignore guest upgrade and login with existing social account
            const token = await generateToken({ userId: userWithSameSocialId.id });
            const refreshToken = await generateRefreshToken({ userId: userWithSameSocialId.id });
            const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            // Store refresh token in database
            await prisma.users.update({
              where: { id: userWithSameSocialId.id },
              data: {
                refreshToken,
                refreshTokenExpiry,
                lastActive: Math.floor(Date.now() / 1000),
              },
            });

            await logActivity(
              userWithSameSocialId.id,
              'login',
              { message: 'User logged in with existing social account' },
              null,
              null
            );
            return makeResponse(res, SUCCESS, true, responseMessages.USER_LOGIN_SUCCESS, {
              token,
              refreshToken,
              tokenType: 'Bearer'
            });
          }

          // Process referral code if provided (MOVED THIS UP BEFORE USER UPDATE)
          if (referralCode) {
            const referrerUserID = slugToNumber(referralCode, slugType.user_id);
            if (!referrerUserID) {
              return makeResponse(res, BAD_REQUEST, false, 'Invalid referral code');
            }

            let referrerUserExist = await prisma.users.findUnique({
              where: { id: referrerUserID },
            });
            if (!referrerUserExist) {
              return makeResponse(res, BAD_REQUEST, false, 'Referrer user does not exist');
            }
            await handler(existingUserWithToken.id, referrerUserID);
          }

          // Update guest user to social user
          const updatedUser = await prisma.users.update({
            where: { id: existingUserWithToken.id },
            data: {
              socialId,
              loginType,
              username: username || existingUserWithToken.username,
              imageUrl: imageUrl || existingUserWithToken.imageUrl,
              lastActive: Math.floor(Date.now() / 1000),
            },
          });

          // Generate new token with the same user ID
          const token = await generateToken({ userId: updatedUser.id });
          const refreshToken = await generateRefreshToken({ userId: updatedUser.id });
          const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          // Store refresh token in database
          await prisma.users.update({
            where: { id: updatedUser.id },
            data: {
              refreshToken,
              refreshTokenExpiry,
            },
          });

          await logActivity(
            updatedUser.id,
            'login',
            { message: 'User logged in and Guest account successfully upgraded' },
            null,
            null
          );

          return makeResponse(res, SUCCESS, true, "Guest account successfully upgraded", {
            token,
            refreshToken,
            tokenType: 'Bearer'
          });
        }
      } catch (err) {
        // Token verification failed - proceed as new login
        console.log("Token verification failed, proceeding as new login:", err.message);
      }
    }

    // Proceed with normal login flow if no token or token didn't match upgrade case
    try {
      if (loginType === 'google') {
        const userData = await getFirebaseUser(socialId);
        username = userData?.displayName;
        imageUrl = userData?.photoURL;
      }
      // else if (loginType === 'apple') {
      //   return makeResponse(res, BAD_REQUEST, false, "Apple login is not supported yet, Try with Google");
      // }
    } catch (err) {
      return makeResponse(res, BAD_REQUEST, false, err.message);
    }

    // Find the user by socialId
    let user = await prisma.users.findUnique({
      where: { socialId },
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          socialId,
          loginType,
          username,
          imageUrl,
          lastActive: Math.floor(Date.now() / 1000),
        },
      });

      // Create a random wallet for the user
      // await createUserWallet(user.id);

      // Generate and send JWT token
      const token = await generateToken({ userId: user.id });
      const refreshToken = await generateRefreshToken({ userId: user.id });
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store refresh token in database
      await prisma.users.update({
        where: { id: user.id },
        data: {
          refreshToken,
          refreshTokenExpiry,
        },
      });

      // Check if referral code exists
      if (referralCode) {
        const referrerUserID = slugToNumber(referralCode, slugType.user_id);
        if (!referrerUserID) {
          return makeResponse(res, BAD_REQUEST, false, 'Invalid referral code');
        }

        let referrerUserExist = await prisma.users.findUnique({
          where: { id: referrerUserID },
        });
        if (!referrerUserExist) {
          return makeResponse(res, BAD_REQUEST, false, 'Referrer user does not exist');
        }
        await handler(user.id, referrerUserID);
      }

      let uid = user.id;
      // Joining reward
      let reward = await prisma.master.findUnique({
        where: { key: "joinReward" },
      });
      // Assign gems (virtual1) and create transaction
      const gemsReward = Number(reward?.data1?.gems) || 0;
      const cashReward = Number(reward?.data1?.cash) || 0;
      if (gemsReward > 0) {
        await bank.updateCurrency(
          uid,
          gemsReward,
          "gems",
          "credit",
          bank.transactiontype.loginBonus,
          null,
          "success"
        );
      }
      if (cashReward > 0) {
        await bank.updateCurrency(
          uid,
          cashReward,
          "cash",
          "credit",
          bank.transactiontype.loginBonus,
          null,
          "success"
        );
      }
      await logActivity(
        uid,
        'login',
        { message: `User logged in successfully and get joinReward: Gems ${reward?.data1?.gems || 0}, Cash $${reward?.data1?.cash || 0}` },
        null,
        null
      );
      return makeResponse(res, SUCCESS, true, responseMessages.USER_LOGIN_SUCCESS, {
        token,
        refreshToken,
        tokenType: 'Bearer'
      });
    }

      await logActivity(
        user.id,
        'login',
        { message: `User logged in successfully` },
        null,
        null
      );

    // Generate and send JWT token for existing user
    const token = await generateToken({ userId: user.id });
    const refreshToken = await generateRefreshToken({ userId: user.id });
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store refresh token in database
    await prisma.users.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiry,
        lastActive: Math.floor(Date.now() / 1000),
      },
    });

    return makeResponse(res, SUCCESS, true, responseMessages.USER_LOGIN_SUCCESS, {
      token,
      refreshToken,
      tokenType: 'Bearer'
    });
  } catch (error) {
    console.error("Login error:", error);
    return makeResponse(res, SERVER_ERROR, false, responseMessages.INTERNAL_SERVER_ERROR);
  }
});

router.patch("/user/", UserMiddleware, validators('USER_UPDATE'), async (req, res) => {
  try {
    const user = await prisma.users.update({
      where: { id: req.userId },
      data: {
        ...req.body,
        lastActive: Math.floor(Date.now() / 1000),
      },
    });

    return makeResponse(res, SUCCESS, true, responseMessages.USER_UPDATE, user);
  }
  catch (error) {
    console.error("update profile error:", error);
    return makeResponse(res, SERVER_ERROR, false, responseMessages.INTERNAL_SERVER_ERROR);
  }
});

router.get("/user/:userId?", UserMiddleware, handleRequest(async (req, res) => {

  const targetUserId = req.params.userId ? parseInt(req.params.userId, 10) : req.user.id;
  const user = await prisma.users.findUnique({
    where: { id: targetUserId },
  });

  if (user) {
    user.slug = numberToSlug(user.id, slugType.user_id)
  }

  return makeResponse(res, SUCCESS, true, responseMessages.USER_FOUND, user);

}));

// Refresh token endpoint
router.post("/refresh-token", validators('REFRESH_TOKEN'), handleRequest(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return makeResponse(res, BAD_REQUEST, false, 'Refresh token is required');
  }

  // Verify the refresh token
  const decoded = await verifyRefreshToken(refreshToken);

  // Generate new access token
  const newAccessToken = await generateToken({ userId: decoded.userId });

  // Optionally, rotate the refresh token (generate a new one)
  const newRefreshToken = await generateRefreshToken({ userId: decoded.userId });
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Update the refresh token in database
  await prisma.users.update({
    where: { id: decoded.userId },
    data: {
      refreshToken: newRefreshToken,
      refreshTokenExpiry,
      lastActive: Math.floor(Date.now() / 1000),
    },
  });

  await logActivity(
    decoded.userId,
    'refresh_token',
    { message: 'Access token refreshed successfully' },
    null,
    null
  );

  return makeResponse(res, SUCCESS, true, 'Token refreshed successfully', {
    token: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer'
  });
}));

// Logout endpoint
router.post("/logout", UserMiddleware, handleRequest(async (req, res) => {
  // Invalidate the refresh token by removing it from the database
  await prisma.users.update({
    where: { id: req.userId },
    data: {
      refreshToken: null,
      refreshTokenExpiry: null,
    },
  });

  await logActivity(
    req.userId,
    'logout',
    { message: 'User logged out successfully' },
    null,
    null
  );

  return makeResponse(res, SUCCESS, true, 'Logged out successfully');
}));

// router.post("/decodeJwt", UserMiddleware, async (req, res) => {
//   const { token } = req.body;
//   console.log(token);
//   let decoded = await decodeJWT(token);
//   res.json(decoded);
// });

export default router;
