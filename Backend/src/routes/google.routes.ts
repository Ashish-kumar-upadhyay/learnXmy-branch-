import { Router } from 'express';
import passport from 'passport';
import { env } from '../config/environment.js';
import { User } from '../models/User.model.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import type { AppRole } from '../types/auth.types.js';

const r = Router();

r.get('/login', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

r.get(
  '/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.frontendUrl}/auth?error=google` }),
  async (req, res) => {
    const googleUser = (req as any).user as unknown as { email?: string; userId?: string; name?: string };
    const email = googleUser?.email;
    const userId = googleUser?.userId;

    const user = userId ? await User.findById(userId) : email ? await User.findOne({ email }) : null;
    if (!user) return res.redirect(`${env.frontendUrl}/auth?error=google_user_not_found`);

    const roles: AppRole[] = [user.role];
    const tv = user.token_version ?? 0;
    const accessToken = signAccessToken({ sub: String(user._id), roles, tv });
    const refreshToken = signRefreshToken({ sub: String(user._id), tv });

    const cb = `${env.frontendUrl}/auth/google/callback`;
    const url = `${cb}?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(
      refreshToken
    )}`;
    return res.redirect(url);
  }
);

export default r;

