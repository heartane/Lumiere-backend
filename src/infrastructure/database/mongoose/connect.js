import mongoose from 'mongoose';
import config from '../../config/env.js';
import Logger from '../../express-server/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.database.url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      autoIndex: true, // only development env
    });
    Logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    Logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// CONNECTION EVENTS
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    Logger.info('Disconnected through app termination');
    process.exit(0);
  });
});

export default connectDB;
