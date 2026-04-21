import { NextFunction, Response } from 'express';
import { AuthRequest, AppRole } from '../types/auth.types';
import { fail } from '../utils/response';

export function requireRoles(...allowed: AppRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const roles = req.authUser?.roles ?? [];
    const ok = allowed.some((r) => roles.includes(r));
    if (!ok) {
      return fail(res, 403, 'Forbidden');
    }
    next();
  };
}
