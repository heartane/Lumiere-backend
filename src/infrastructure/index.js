import connectDB from './database/mongoose/connect.js';
import server from './express-server/index.js';
import serviceLocator from './config/serviceLocator.js';

export default async () => {
  await connectDB();

  // serviceLocator 호출
  server(serviceLocator);
};
