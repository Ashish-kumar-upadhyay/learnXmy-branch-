import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../utils/logger';
import { User } from '../models/User.model';


export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', true);
  if (mongoose.connection.readyState === 1) return;
  const candidates = Array.from(
    new Set(
      [env.mongoUri, process.env.MONGODB_URI, process.env.MONGO_MONGODB_URI]
        .map((v) => String(v ?? '').trim())
        .filter(Boolean)
    )
  );

  let lastError: unknown = null;
  for (const uri of candidates) {
    try {
      await mongoose.connect(uri);
      logger.info('MongoDB connected');
      lastError = null;
      break;
    } catch (e) {
      lastError = e;
      logger.error(`MongoDB connect failed for one URI candidate: ${String(e)}`);
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

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
