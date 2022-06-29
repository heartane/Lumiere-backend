import asyncHandler from 'express-async-handler';
import Logger from '../logger.js';
import jwtManager from '../security/jwtTokenManager.js';
import { HTTP_STATUS } from '../../config/constants.js';

// 로그인 유저만 private route 접근을 허락해주는 함수
// 토큰 유무와 유효성 검사

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const { authorization } = req.headers;

  if (authorization && authorization.startsWith('Bearer')) {
    try {
      // eslint-disable-next-line prefer-destructuring
      token = authorization.split(' ')[1];
      req.user = jwtManager.verify(token);
      next();
    } catch (e) {
      Logger.error(e.stack);
      res.status(HTTP_STATUS.UNAUTHORIZED);
      throw new Error('Not authorized, token failed');
    }
  }
  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED);
    throw new Error('Not authorized, no token');
  }
});

const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(HTTP_STATUS.UNAUTHORIZED);
    throw new Error('Not authorized as an admin');
  }
});

export { protect, admin };
