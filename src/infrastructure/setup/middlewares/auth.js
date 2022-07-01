import asyncHandler from 'express-async-handler';
import Logger from '../logger.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { getDependency } from '../../config/injector.js';

// 로그인 유저만 private route 접근을 허락해주는 함수
// 토큰 유무와 유효성 검사

const protect = asyncHandler((req, res, next) => {
  const { authorization } = req.headers;

  if (!(authorization && authorization.startsWith('Bearer'))) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ message: 'Not authorized, no token' });
  }

  const token = authorization.split(' ')[1];
  try {
    req.user = getDependency('jwtManager').verify(token);
  } catch (e) {
    Logger.error(e.stack);
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ message: 'Not authorized, token failed' });
  }
  return next();
});

const admin = asyncHandler((req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    res
      .status(HTTP_STATUS.FORBIDDEN)
      .json({ message: 'Not authorized, as an admin' });
  }
});

export { protect, admin };
