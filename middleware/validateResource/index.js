import Joi from "joi";
import { makeResponse, statusCodes, validationSchema } from "../../helpers/index.js";

// Input Validations
export const validators = (payload) =>
    async (req, res, next) => {
        const schema = Joi.object(validationSchema(payload));
        const { error } = schema.validate(req.body, { allowUnknown: false });
        if (error) return makeResponse(res, statusCodes.BAD_REQUEST, false, error?.message ? error?.message.replace(/"/g, '') : "error");
        next();
    };
    

// ✅ NEW: For query validation
export const queryValidators = (payload) =>
    async (req, res, next) => {
        const schema = Joi.object(validationSchema(payload));
        const { error } = schema.validate(req.query, { allowUnknown: false });
        if (error) {
            return makeResponse(
                res,
                statusCodes.BAD_REQUEST,
                false,
                error?.message ? error.message.replace(/"/g, '') : 'Invalid query parameters'
            );
        }
        next();
    };
