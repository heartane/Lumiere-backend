import connectDB from './database/mongoose/connect.js';
import server from './express-server/index.js';

export default async () => {
  await connectDB();
  // serviceLocator 호출
  server();
};
