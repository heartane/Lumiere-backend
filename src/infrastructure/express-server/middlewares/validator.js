import { validationResult } from 'express-validator';
import { HTTP_STATUS } from '../../config/constants.js';
import Logger from '../logger.js';

export default function validator(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg;
    Logger.error(message);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message });
  }
  return next();
}
