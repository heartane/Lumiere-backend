import config from '../../config/env.js';
import Logger from '../logger.js';

const notFound = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(err);
};

const errHandler = (err, req, res) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const data = {
    message: err.message,
    stack: config.server.env === 'production' ? null : err.stack,
  };
  Logger.error(data);
  res.status(statusCode).json(data);
};
// 개발 환경일 경우에만 스텍 보여주기

export { notFound, errHandler };
