import { body, query, param } from 'express-validator';
import validator from '../../infrastructure/setup/middlewares/validator.js';

export const email = [
  body('email') //
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('이메일 형식이 유효하지 않습니다'),
  validator,
];

export const password = [
  body('password') //
    .trim()
    .isLength({ min: 8 })
    .withMessage('비밀번호를 8자 이상 입력해주세요')
    .bail()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/)
    .withMessage('비밀번호 형식이 유효하지 않습니다'),
  validator,
];

export const credentials = [...email, ...password, validator];

export const register = [
  ...credentials,
  body('name') //
    .trim()
    .isLength({ min: 2, max: 52 })
    .withMessage('성함을 2글자 이상, 52글자 이하로 입력해주세요'),
  validator,
];

export const code = [
  param('corp', '권한 제공 기관이 필요합니다')
    .trim()
    .notEmpty()
    .bail()
    .isAlpha(),
  query('code', 'authorization_code가 필요합니다').notEmpty(),
  validator,
];

export const productInfo = [
  body('artist', 'ObjectId required').trim().exists().isAlphanumeric(),
  body('artCode', '4자리의 코드가 필요합니다')
    .trim()
    .exists()
    .isLength({ min: 4 })
    .isNumeric(),
  body('title', 'product title required').trim().exists(),
  body('image', 'impage url required').trim().exists().isURL(),
  body('theme', 'theme invalid')
    .trim()
    .exists()
    .isString()
    .bail()
    .isIn(['인물', '풍경', '정물', '동물', '상상', '추상']),
  body('price', 'price invalid').trim().exists().isNumeric(),
  body('info.details', 'Product info details requird')
    .trim()
    .exists()
    .isString(),
  body('info.size', 'canvas size required').trim().exists().isAlphanumeric(),
  body('info.canvas', 'canvas range must be 1 - 100 ')
    .trim()
    .exists()
    .isInt({ min: 1, max: 100 }),
  body('info.createdAt', 'created year must be 4 character')
    .trim()
    .exists()
    .isLength({ min: 4, max: 4 }),

  validator,
];
