import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { fail } from '../utils/response';
import { connectDatabase } from '../config/database';

let reconnectPromise: Promise<void> | null = null;

export async function requireDatabaseReady(_req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState === 1) return next();

  try {
    if (!reconnectPromise) {
      reconnectPromise = connectDatabase().finally(() => {
        reconnectPromise = null;
      });
    }
    await reconnectPromise;
  } catch {
    return fail(
      res,
      503,
      'Database not connected yet. Check MongoDB URI / Atlas Network Access and try again.'
    );
  }

  return next();
}
