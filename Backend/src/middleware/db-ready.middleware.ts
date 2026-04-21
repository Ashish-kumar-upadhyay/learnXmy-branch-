import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { fail } from '../utils/response';

export function requireDatabaseReady(_req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState === 1) return next();
  return fail(
    res,
    503,
    'Database not connected yet. Check MongoDB URI / Atlas Network Access and try again.'
  );
}
