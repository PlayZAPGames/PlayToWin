import jwt from 'jsonwebtoken';
import Admin from '../models/admin/Admin.js'
import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
const { AUTH_ERROR, SERVER_ERROR, INVALID_REQUEST } = statusCodes;

export default async (req, res, next) => {
  // Get the token from the request headers
  const token = req.headers.authorization;

  if (!token) {
    return makeResponse(res, AUTH_ERROR, false, responseMessages.AUTH_TOKEN_MISSING);
  }

  try {
    // Verify the token using your secret key
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.SECRET_KEY);
    if (decoded._id) {
      // Try to find the user by ID And Delete Status
      try {
        const adminExist = await Admin.findOne({_id:decoded._id}).exec();
        if (!adminExist) {
          return makeResponse(res, INVALID_REQUEST, false, responseMessages.AUTH_FAIL);
        }
          // Attach the decoded user information to the request object
          req.user = decoded;
          // Include a success flag in the response
          res.locals.success = true;
          return next(); // Token is valid, proceed to the next middleware

      } catch (error) {
        res.locals.success = false;
        return makeResponse(res, SERVER_ERROR, false, responseMessages.INTERNAL_SERVER_ERROR);
      }
    }
    return makeResponse(res, INVALID_REQUEST, false, responseMessages.AUTH_FAIL);
  } catch (error) {
    console.log('errror', error)
    // Include a success flag in the response
    res.locals.success = false;
    return makeResponse(res, AUTH_ERROR, false, responseMessages.AUTH_FAIL);
  }
}
