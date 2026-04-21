import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/response';
import { logger } from '../utils/logger';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'ValidationError') {
    return fail(res, 400, (err as Error).message);
  }
  if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
    return fail(res, 409, 'Duplicate key');
  }
  if (err instanceof Error) {
    logger.error(err.message, { stack: err.stack });
    return fail(res, 500, err.message);
  }
  return fail(res, 500, 'Internal server error');
}
