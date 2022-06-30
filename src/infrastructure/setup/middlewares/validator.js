import { validationResult } from 'express-validator';
import { HTTP_STATUS } from '../../config/constants.js';

export default function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ message: errors.array()[0].msg });
  }
  return next();
}
