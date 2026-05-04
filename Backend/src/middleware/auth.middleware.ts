import { NextFunction, Response } from 'express';
import { User } from '../models/User.model';
import { AuthRequest, AppRole } from '../types/auth.types';
import { verifyAccessToken } from '../utils/jwt';
import { fail } from '../utils/response';

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return fail(res, 401, 'Unauthorized');
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('+token_version');
    const tv = payload.tv ?? 0;
    const userTv = user?.token_version ?? 0;
    if (!user || userTv !== tv) {
      return fail(res, 401, 'Invalid or expired token');
    }
    const roles = ((payload.roles?.length ? payload.roles : [user.role]) as AppRole[]);
    req.authUser = {
      id: String(user._id),
      email: user.email,
      roles,
      tokenVersion: userTv,
    };
    next();
  } catch {
    return fail(res, 401, 'Unauthorized');
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('+token_version');
    const tv = payload.tv ?? 0;
    const userTv = user?.token_version ?? 0;
    if (user && userTv === tv) {
      const roles = (payload.roles?.length ? payload.roles : [user.role]) as AppRole[];
      req.authUser = {
        id: String(user._id),
        email: user.email,
        roles,
        tokenVersion: userTv,
      };
    }
  } catch {
    /* unauthenticated optional */
  }
  next();
}
