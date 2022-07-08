import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import env from '../config/env.js';

import apiRouter from '../../interface/routes/index.js';
import { errHandler, notFound } from './middlewares/error.js';

export default (serviceLocator) => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(
    cors({
      origin: JSON.parse(env.cors.origin),
    }),
  );
  const morganFormat = env.server.env !== 'production' ? 'dev' : 'combined';
  app.use(morgan(morganFormat, { stream: serviceLocator.logger.stream }));

  app.get('/', (req, res) => {
    res.send('Lumiere API is running...');
  });

  app.use(`${env.apiRoot}`, apiRouter(serviceLocator));

  app.use(notFound);
  app.use(errHandler);

  app.listen(env.server.port, () =>
    serviceLocator.logger.info(
      `Server running in ${env.server.env} mode on port ${env.server.port}`,
    ),
  );
};
