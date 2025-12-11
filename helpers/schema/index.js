import Joi from "joi";

import { LOGIN_TYPE, SOCIAL_LOGIN_TYPE, GAME_ENTRY_TYPE, CURRENCY_TYPE, STATUS, RANKS, USER_ROLE, STORE } from "../../utility/enums.js";

// Validation Cases
export const validationSchema = (action) => {
  switch (action) {

    case "USER_SIGNUP": {
      return {
        loginType: Joi.string().required().valid(...LOGIN_TYPE),
        socialId: Joi.string().required(),
        referralCode: Joi.string().optional(),
      };
    }

    case "SOCIAL_LOGIN": {
      return {
        loginType: Joi.string().required().valid(...SOCIAL_LOGIN_TYPE),
        socialId: Joi.string().required(),
      };
    }

    case "REFRESH_TOKEN": {
      return {
        refreshToken: Joi.string().required(),
      };
    }

    case "DEPOSIT_REQUEST": {
      return {
        amount: Joi.number().min(5).required(),
        paypalEmail: Joi.string().email().required(),
        proofImageUrl: Joi.string().uri().optional(),
      };
    }

    case "WITHDRAWAL_REQUEST": {
      return {
        amount: Joi.number().min(10).required(),
        paypalEmail: Joi.string().email().required(),
      };
    }

    case "UPDATE_PAYPAL_EMAIL": {
      return {
        paypalEmail: Joi.string().email().required(),
      };
    }

    case "APPROVE_PAYMENT": {
      return {
        paypalTransactionId: Joi.string().optional(),
        adminNotes: Joi.string().optional(),
      };
    }

    case "COMPLETE_PAYMENT": {
      return {
        paypalTransactionId: Joi.string().required(),
        adminNotes: Joi.string().optional(),
      };
    }

    case "REJECT_PAYMENT": {
      return {
        rejectionReason: Joi.string().required(),
        adminNotes: Joi.string().optional(),
      };
    }

    case "ADJUST_BALANCE": {
      return {
        amount: Joi.number().required(),
        reason: Joi.string().required(),
        balanceType: Joi.string().valid('cash', 'bonus').optional(),
      };
    }

    case "USER_UPDATE": {
      return {
        imageIndex: Joi.number().integer().min(0).max(25).optional(),
        username: Joi.string().optional(),
      };
    }


    case "ADMIN_LOGIN": {
      return {
        password: Joi.string().required(),
        email: Joi.string().required()
      };
    }

    case "SETUP_2FA": {
      return {
        email: Joi.string().required(),
        otp: Joi.string().required(),
        secret: Joi.string().required()
      };
    }



    case "GAME_START": {
      return {
        gameName: Joi.string().required(),
        maxPlayers: Joi.number().integer().min(2).max(4).required()
      };
    }


    case "GAME_PLAY": {
      return {
        roomName: Joi.string().required(),
        // maxPlayers: Joi.number().integer().min(2).max(4).required(),
        gameId: Joi.number().required()
      };
    }

    case "GAME_COMPLETE": {
      return {
        gameName: Joi.string().required(),
        roomId: Joi.number().required(),
        tournamentId: Joi.number().required(),
        score: Joi.number().required(),
        won: Joi.boolean().required(),
      };
    }



    case "GAME_FINISH": {
      return {
        gameId: Joi.number().required(),
        roomId: Joi.number().required(),
        tournamentId: Joi.number().required(),
        // points: Joi.number().required(),
        kills: Joi.number().required(),
        time: Joi.number().required(),
        bossKills: Joi.number().required(),
      };
    }


    case "GAME_RESULT": {
      return {
        roomId: Joi.number().required()
      };
    }


    case "COMPLETE_TASK": {
      return {
        taskId: Joi.number().required()
      };
    }

    case "ADD_SEASON": {
      return {
        name: Joi.string().required(),
        total_supply: Joi.number().required(),
        status: Joi.number().required(),
        start_time: Joi.string().required(),
        end_time: Joi.string().required(),
      };
    }
    case "UPDATE_SEASON": {
      return {
        name: Joi.string().optional(),
        total_supply: Joi.number().optional(),
        status: Joi.number().optional(),
        start_time: Joi.string().optional(),
        end_time: Joi.string().optional(),
      };
    }


    case "SETTING_JOIN_REWARD": {
      return Joi.object({
        virtual1: Joi.number().min(0).required(),
        virtual2: Joi.number().min(0).required()
      }).strict();
    }
    case "SETTING_GEM_TO_PZP": {
      return Joi.number().required();
    }

    case "SETTING_ADMINS": {
      return Joi.object({
        ids: Joi.array().items(Joi.number().integer().positive()).required()
      }).strict();
    }

    case "SETTING_MAINTENANCE": {
      return Joi.object({
        data: Joi.object({
          status: Joi.boolean().required()
        }).required()
      }).strict();
    }

    case "SETTING_WALLET_WITHDRAW": {
      return Joi.object({
        day_limit: Joi.number().min(0).required(),
        min_withdraw: Joi.number().min(0).required(),
        processing_fee: Joi.number().min(0).max(100).required(),
        withdraw_maintenance: Joi.boolean().required()
      }).strict();
    }

    case "SETTING_TICKET_SWAP_LIMIT": {
      return Joi.string().pattern(/^\d+$/).required();
    }

    case "SETTING_TICKET_MIN_SWAP": {
      return Joi.string().pattern(/^\d+$/).required();
    }

    case "SETTING_DAILY_REWARD_VALUES": {
      return Joi.object({
        days: Joi.array().items(
          Joi.object({
            value: Joi.number().min(0).required(),
            currencyType: Joi.string().required()
          })
        ).required()
      }).strict();
    }
   case "WEEKLY_PRIZE_POOL": {
  return Joi.object({
    rewards: Joi.array()
      .items(
        Joi.object({
          from: Joi.number()
            .integer()
            .min(1)
            .required()
            .messages({
              "number.base": "From rank must be a number",
              "number.min": "From rank must be at least 1",
              "number.integer": "From rank must be an integer",
              "any.required": "From rank is required",
            }),
          to: Joi.number()
            .integer()
            .min(Joi.ref('from'))
            .required()
            .messages({
              "number.base": "To rank must be a number",
              "number.min": "To rank must be greater than or equal to from rank",
              "number.integer": "To rank must be an integer",
              "any.required": "To rank is required",
            }),
          reward: Joi.number()
            .min(0)
            .required()
            .messages({
              "number.base": "Reward must be a number",
              "number.min": "Reward cannot be negative",
              "any.required": "Reward is required",
            }),
        }).strict()
      )
      .min(1)
      .custom((rewards, helpers) => {
        // Validate that rank ranges don't overlap and are continuous
        const sortedRewards = [...rewards].sort((a, b) => a.from - b.from);
        
        // Check if ranges start from 1
        if (sortedRewards[0].from !== 1) {
          return helpers.error('array.custom', {
            message: 'First rank range must start from 1'
          });
        }

        for (let i = 0; i < sortedRewards.length; i++) {
          const current = sortedRewards[i];
          
          // Check for overlapping ranges
          for (let j = i + 1; j < sortedRewards.length; j++) {
            const other = sortedRewards[j];
            if (current.to >= other.from) {
              return helpers.error('array.custom', {
                message: `Rank ranges overlap: ${current.from}-${current.to} and ${other.from}-${other.to}`
              });
            }
          }
          
          // Check if ranges are continuous (except for the last one)
          if (i < sortedRewards.length - 1) {
            const next = sortedRewards[i + 1];
            if (current.to + 1 !== next.from) {
              return helpers.error('array.custom', {
                message: `Gap in rank ranges: ${current.to + 1} to ${next.from - 1} is missing`
              });
            }
          }
        }
        
        return rewards;
      }, 'Rank range validation')
      .messages({
        "array.base": "Rewards must be an array",
        "array.min": "At least one reward entry is required",
        "array.custom": "{#label} validation failed", // This will be overridden by custom messages
      }),
  }).strict().messages({
    'object.unknown': 'Invalid field: {#label}',
  });
}


    case "SETTING_REFERRAL_SHARE_TEXT": {
      return Joi.object({
        text: Joi.string().min(10).required()
      }).strict();
    }

    case "SETTING_REFERRAL": {
      return Joi.object({
        referrerDailyRewardLimit: Joi.number().min(0).required()
      })
        .pattern(
          Joi.string().invalid("referrerDailyRewardLimit"),
          Joi.object({
            referreeReward: Joi.number().min(0).required(),
            referrerReward: Joi.number().min(0).required()
          }).strict()
        );
    }


    case "SETTING_TICKET_SWAP_FEE": {
      return Joi.number().required();
    }
    case "ADD_GAME": {
      return {
        gameName: Joi.string().required(),
        imageIndex: Joi.number().integer().min(0).max(25).optional(),
        // serverGameName: Joi.string().allow(null).optional(),
        // keyboardGameName: Joi.string().allow(null).optional(),
        // url: Joi.string().allow(null).optional(),
        // miniAppUrl: Joi.string().allow(null).optional(),
        // iMessage_Solo: Joi.string().allow(null).optional(),
        // entryFee: Joi.number().required(),
        // currencyType: Joi.string().required().valid(...GAME_ENTRY_TYPE),
        // winningCurrencyType: Joi.string().required().valid(...CURRENCY_TYPE),
        // kills: Joi.number().required(),
        // timeBonus: Joi.number().required(),
        // bossKills: Joi.number().required()
      
      };

    }
    case "ADD_TOURNAMENT": {
      return {
        name: Joi.string().required(),
        gameId: Joi.number().required(),
        entryFee: Joi.number().required(),
        currencyType: Joi.string().required().valid(...GAME_ENTRY_TYPE),
        prizePool: Joi.number().required(),
        players: Joi.number().required(),
        adsEnabled: Joi.boolean().required()
      };

    }
    case "ADD_SPINNER": {
      return {
        name: Joi.string().required(),
        is_disabled: Joi.boolean().optional(),
        perc: Joi.number().required(),
        virtual1: Joi.number().required(),
        virtual2: Joi.number().required(),
      };
    }
    case "UPDATE_SPINNER": {
      return {
        name: Joi.string().optional(),
        is_disabled: Joi.boolean().optional(),
        perc: Joi.number().optional(),
        virtual1: Joi.number().optional(),
        virtual2: Joi.number().optional(),
      };
    }

    case "UPDATE_INTERVAL": {
      return {
        hour: Joi.number().min(0).max(24).required(),
      };
    }
    case "UPDATE_ADDITIONAL_SUPPLY": {
      return {
        additionalSupply: Joi.string().required(),
      };
    }

    case "EARN_LUDY": {
      return {
        task_name: Joi.string().required(),
        task_desc: Joi.string().allow(null).optional(),
        reward: Joi.number().allow(null).optional(),
        reward_range: Joi.string().allow(null).optional(),
        currency_type: Joi.string().required().valid(...CURRENCY_TYPE),
        status: Joi.string().required().valid(...STATUS),
        task_pfp: Joi.string().allow(null).optional(),
        task_redirect: Joi.string().allow(null).optional()
      };
    }
    case "UPDATE_EARN_LUDY": {
      return {
        task_name: Joi.string().required(),
        task_desc: Joi.string().allow(null).optional(),
        reward: Joi.number().allow(null).optional(),
        reward_range: Joi.string().allow(null).optional(),
        currency_type: Joi.string().required().valid(...CURRENCY_TYPE),
        status: Joi.string().required().valid(...STATUS),
        task_pfp: Joi.string().allow(null).optional(),
        task_redirect: Joi.string().allow(null).optional()
      };
    }

    case "UPDATE_USER": {
      return {
        username: Joi.string().optional(),
        loginType: Joi.string().optional().valid(...LOGIN_TYPE),
        role: Joi.string().optional().valid(...USER_ROLE),
        status: Joi.number().optional(),
      };
    }

    case "ADD_STORE_ITEM": {
      return {
        name: Joi.string().required(),
        description: Joi.string().allow("").optional(),
        price: Joi.number().required(),
        type: Joi.string().required().valid(...STORE),
        isDefault: Joi.boolean().required(),
        isActive: Joi.boolean().required(),
      };
    }

    case "UPDATE_STORE_ITEM": {
      return {
        name: Joi.string().optional(),
        description: Joi.string().allow("").optional(),
        price: Joi.number().optional(),
        type: Joi.string().optional().valid(...STORE),
        isDefault: Joi.boolean().optional(),
        isActive: Joi.boolean().optional(),
      };
    }


    case "ADD_SUPER_POWER": {
      return {
        name: Joi.string().required(),
        price: Joi.number().required(),
        isActive: Joi.boolean().required(),
      };
    }

    case "UPDATE_SUPER_POWER": {
      return {
        name: Joi.string().optional(),
        price: Joi.number().optional(),
        isActive: Joi.boolean().optional(),
      };
    }
    case "BUY_SUPER_POWER": {
      return {
        superPowerId: Joi.number().required(),
        quantity: Joi.number().min(1).required(),
      };
    }
    case "SWAP": {
      return {
        swapType: Joi.string().required().valid("coreToBsc", "bscToCore"),
        amount: Joi.number().min(1).required(),
      };
    }



  }
  return {};
};

