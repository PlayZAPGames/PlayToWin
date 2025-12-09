// helpers/asyncHandler.js
import { makeResponse, statusCodes, responseMessages } from '../index.js';

export function handleRequest(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("❌ Request Error:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code || "N/A",
      });

      // Default values
      let status = statusCodes.SERVER_ERROR;
      let message = responseMessages.INTERNAL_SERVER_ERROR;

      // Use custom code/message if set in the error object
      if (error.statusCode && typeof error.statusCode === 'number') {
        status = error.statusCode;
      }

      if (error.message && typeof error.message === 'string') {
        message = error.message;
      }

      // Optionally attach validation/database details for dev environments
      const isDev = process.env.NODE_ENV !== 'production';
      const errorPayload = isDev
        ? {
            error: error.name,
            stack: error.stack,
            details: error.details || null, // e.g. Prisma, Joi, etc.
          }
        : null;

      return makeResponse(res, status, false, message, errorPayload);
    }
  };
}
