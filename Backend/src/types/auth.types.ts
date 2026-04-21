import { Request } from 'express';

export type AppRole = 'student' | 'teacher' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  roles: AppRole[];
  tokenVersion: number;
};

// Important: do NOT use `req.user` because passport also uses `req.user`.
export type AuthRequest = Request & { authUser?: AuthUser };
