import { createLogger, format, transports } from 'winston';
import WinstonDaily from 'winston-daily-rotate-file';
import appRoot from 'app-root-path'; // app root 경로를 가져오는 라이브러리
import config from '../infrastructure/config/env.js';

const logDir = `${appRoot}/logs`;
const { combine, timestamp, colorize, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} / [${level}]: ${message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const Logger = createLogger({
  format: combine(
    format.json(),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // info 레벨 로그를 저장할 파일 설정
    new WinstonDaily({
      level: 'http',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `%DATE%.log`,
      maxFiles: 30, // 30일치 로그 파일 저장
      zippedArchive: true,
    }),
    // error 레벨 로그를 저장할 파일 설정
    new WinstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/error`, // error.log 파일은 /logs/error 하위에 저장
      filename: `%DATE%.error.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    new WinstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/error`,
      filename: `%DATE%.exception.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
});

if (config.server.env !== 'production') {
  Logger.add(
    new transports.Console({
      level: 'silly',
      format: combine(
        colorize({
          colors: { info: 'blue', error: 'red', http: 'yellow' },
          all: true,
        }),
        logFormat,
      ),
    }),
  );
}

Logger.stream = {
  write: (message) => {
    Logger.http(message);
  },
};

export default Logger;
