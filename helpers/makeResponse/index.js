export const responseMessages = {
  USER_LOGIN_SUCCESS: "You are successfully logged in",
  USER_UPDATE: "User updated successfully",
  ACCOUNT_TYPE_UPDATE: "Account type updated successfully",
  USER_FOUND: "User found successfully",
  BALANCE_FETCHED: "User balanced fetched successfully",
  USER_NOT_FOUND: "User not found",
  BAD_REQUEST: "Bad request",
  LOGIN_TYPE_REQUIRED: "loginType is required",
  ROOM_CREATED: "Room created successfully",
  TOURNAMNENT_NOT_FOUND: "User tournament not found",
  TOURNAMNENT_SCORE_NOT_FOUND: "User tournament score not found",
  SCORE_ALREADY_SUBMIT: "Game completed and score already submitted",
  GAME_COMPLETE: "Game completed successfully",
  DAILY_TASK_VALUE_ADDED: "Daliy task value added successfully",
  RECORD_FOUND: "Record found successfully",
  RECORD_CREATED: "Record created successfully",
  RECORD_UPDATED: "Record updated successfully",
  RECORD_DELETE: "Record deleted successfully",
  
  USER_EXIST: "User already exist",
  USER_ALREADY_DELETED: "User already deleted",
  USER_VERIFIED_SUCCESS: "User verified successfully",
  NAME_REQUIRED: "Name is required",
  EMAIL_REQUIRED: "Email is required",
  INTERNAL_SERVER_ERROR: "Something went wrong",
  INVALID_CRED: "Invalid credentials",
  ADMIN_NOT_FOUND: "Admin not found",
  ADMIN_UPDATE: "Admin profile updated successfully",
  INVALID_EMAIL_PWD: "Invalid email or password",
  PASSWORD_RESET_SUCCESS: "Password reset successfully",
  INVALID_PAGE_NUMBER: "Invalid page number",
  PERMISSION_DENIED: "Permission denied",
  AUTH_FAIL: "Authentication failed",

};

export const notificationPayload = {};

export const statusCodes = {
  SUCCESS: 200,
  RECORD_CREATED: 201,
  RECORD_NOT_FOUND: 204,
  RECORD_ALREADY_REPORTED: 208,
  BAD_REQUEST: 400,
  AUTH_ERROR: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_REQUEST: 405,
  UNPROCESSABLE: 422,
  RECORD_ALREADY_EXISTS: 409,
  SERVER_ERROR: 500,
};

  const makeResponse = async (
    res,
    statusCode,
    success,
    message,
    payload = null,
  ) =>
    new Promise((resolve) => {
      const responseObj = {
        success,
        code: statusCode,
      };

      if (message !== null) {
        responseObj.message = message;
      }
  
      if (payload !== null) {
        responseObj.data = payload;
      }
  
      res.status(statusCode).send(responseObj);
      resolve(statusCode);
    });

export { makeResponse };
