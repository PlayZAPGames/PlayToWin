import jwt from "jsonwebtoken";
import prisma from "../prisma/db.js";
import "dotenv/config.js";
// import { config } from "../config/config.js";
import { PlayerRole } from "./enums.js";

// Secret key for JWT (should be kept secret and not hard-coded)
const jwtSecret = process.env.JWT_SECRET;
import { makeResponse } from "../helpers/index.js";

async function UserMiddleware(req, res, next) {
  console.log(req.path);
  const auth = req.headers.authentication;
  let token;

  if (!auth) {
    return res
      .status(401)
      .json({ error: "Access denied. Token not provided." });
  }
  token = auth.split(" ")[1];

  if (!token) {

      return res
      .status(401)
      .json({ error: "Access denied. Invalid Token" });
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });
    const userId = decodedToken.userId;

    if (userId == null) {
      console.log("User id not provided in the auth token.");
      return null;
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    // console.log("decodedToken user", user);

    

    if (user == null) {
      console.log("User not found for the provided token.");
      return res
        .status(401)
        .json({ error: `User not found for the provided token.` });
    }

    if (user.status ===2) {
      console.log("User blocked by admin.");
      return res
        .status(200)
        .json({ status: 2, error: `User blocked by admin.` });
    } else if (user.status === 3) {
      console.log("User Restricted by admin.");
      return res.status(200).json({
        status: 3,
        error: `User Restricted by admin, can not play games`,
      });
    }

    const getMaintenance = await prisma.master.findUnique({ where: { key: "maintenance" } });
    const admins = await prisma.master.findUnique({ where: { key: "admins" } });
    const isAdmin = admins?.data1?.ids?.includes(user.id);
    const isSuperUser = user.role === 'super user';
    
    if (!isAdmin && !isSuperUser && getMaintenance?.data1?.data?.status) {
      return makeResponse(res, 503, false, "Maintenance mode is on.");
    }

    req.userId = userId;
    req.user = user;

    next();
  } catch (error) {
    console.error("Token authentication failed:", error.message);
      return makeResponse(res, 401, false, `Token authentication failed ${error.message}`);
  }

}

async function AdminMiddleware(req, res, next) {
  const auth = req.headers.authorization || req.headers.authentication;

  console.log("AdminMiddleware auth: ", auth);
  
  if (auth == null) {
    return res
      .status(401)
      .json({ error: "Access denied. Token not provided." });
  }
  const token = auth.split(" ")[1];
  try {
    if (!token) {
      
        return res
      .status(401)
      .json({ error: "Invalid Token format" });
    }

    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    
    const adminuser = await prisma.admins.findUnique({
      where: { id: decoded.id },
    });


    if (adminuser == null) {
      console.log("Admin not found for the provided token.");
      return res
        .status(401)
        .json({ error: `Admin not found for the provided token.` });
    }

    if (!decoded || !Object.values(PlayerRole).includes(decoded.player)) {
      return res.status(403).json({ message: "Invalid admin credentials" });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Token authentication failed:", error.message);
    return res
      .status(401)
      .json({ error: `Token authentication failed ${error.message}` });
  }
}

function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No admin context" });
    }

    if (!allowedRoles.includes(req.user.player)) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to access this API",
      });
    }

    next();
  };
}

async function generateToken(payload) {
  console.log(payload);
  return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
}

async function generateRefreshToken(payload) {
  console.log("Generating refresh token for:", payload);
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

async function verifyToken(token) {

   try {
    if (!token) {
      throw new Error('No token provided');
    }
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    // Handle different JWT errors specifically
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else {
      throw new Error('Failed to authenticate token');
    }
  }
}

async function verifyRefreshToken(token) {
  try {
    if (!token) {
      throw new Error('No refresh token provided');
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    // Verify the refresh token exists in database and hasn't expired
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        refreshToken: true, 
        refreshTokenExpiry: true,
        status: true 
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.refreshToken !== token) {
      throw new Error('Invalid refresh token');
    }

    if (user.refreshTokenExpiry && new Date(user.refreshTokenExpiry) < new Date()) {
      throw new Error('Refresh token expired');
    }

    if (user.status === 2) {
      throw new Error('User blocked by admin');
    }

    return decoded;
  } catch (error) {
    console.error('Refresh token verification error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else {
      throw error;
    }
  }
}

export { UserMiddleware, AdminMiddleware, generateToken, generateRefreshToken, requireRoles, verifyToken, verifyRefreshToken };
