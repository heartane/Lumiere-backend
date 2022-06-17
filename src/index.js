import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import connectDB from './setup/db.js';
import {
  userRoutes,
  artistRoutes,
  productRoutes,
  orderRoutes,
  eventRoutes,
} from './routes/index.js';
import { errHandler, notFound } from './middlewares/error.js';
import Logger from './setup/logger.js';
import config from './setup/config/env.js';

connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(
  cors({
    origin: JSON.parse(config.cors.origin),
  }),
);

const morganFormat = config.server.env !== 'production' ? 'dev' : 'combined';
app.use(morgan(morganFormat, { stream: Logger.stream }));

app.get('/', (req, res) => {
  res.send('Lumiere API is running...');
});

app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/events', eventRoutes);

app.use(notFound);
app.use(errHandler);

app.listen(config.server.port, () =>
  Logger.info(
    `Server running in ${config.server.env} mode on port ${config.server.port}`,
  ),
);
