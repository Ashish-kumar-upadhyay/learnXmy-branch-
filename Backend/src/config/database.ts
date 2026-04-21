import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../utils/logger';
import { User } from '../models/User.model';


export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.mongoUri);
  logger.info('MongoDB connected');
  try {
    await User.syncIndexes();
    await User.collection.updateMany(
      { $or: [{ teacherCode: null }, { teacherCode: '' }] },
      { $unset: { teacherCode: '' } }
    );
  } catch (e) {
    logger.error(
      `User index sync / cleanup failed (if E11000 persists, drop old teacherCode index in Atlas): ${String(e)}`
    );
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
