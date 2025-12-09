// middlewares/settingValidator.js
import { validationSchema } from "../helpers/index.js";
import { makeResponse, statusCodes } from "../helpers/index.js";

export const settingValidator = () => {
  return async (req, res, next) => {
    const { key } = req.params;
    const { value } = req.body;

    const validationMap = {
      'joinReward': 'SETTING_JOIN_REWARD',
      'gemToPzp': 'SETTING_GEM_TO_PZP',
      'admins': 'SETTING_ADMINS',
      'maintenance': 'SETTING_MAINTENANCE',
      'walletWithdraw': 'SETTING_WALLET_WITHDRAW',
      'ticketSwapLimit': 'SETTING_TICKET_SWAP_LIMIT',
      'ticketMinSwap': 'SETTING_TICKET_MIN_SWAP',
      'DailyRewardValues': 'SETTING_DAILY_REWARD_VALUES',
      'referralShareText': 'SETTING_REFERRAL_SHARE_TEXT',
      'referral': 'SETTING_REFERRAL',
      'ticketSwapFee': 'SETTING_TICKET_SWAP_FEE',
      'weeklyPrizePool': 'WEEKLY_PRIZE_POOL'
    };

    const validationCase = validationMap[key];
    if (!validationCase) {
      return makeResponse(res, statusCodes.BAD_REQUEST, false, 'Invalid setting key');
    }

    // Get the schema directly (no need for Joi.object() wrapper)
    const schema = validationSchema(validationCase);
    
    const { error, value: validatedValue } = schema.validate(value, { 
      allowUnknown: false,
      abortEarly: false
    });
    
    if (error) {
      const errorMessage = error.details.map(d => d.message.replace(/"/g, '')).join(', ');
      return makeResponse(res, statusCodes.BAD_REQUEST, false, errorMessage);
    }

    req.validatedSetting = {
      key,
      value: validatedValue,
      isComplex: typeof validatedValue === 'object' && validatedValue !== null
    };

    next();
  };
};