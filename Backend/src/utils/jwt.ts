import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export type AccessPayload = {
  sub: string;
  roles: string[];
  tv: number;
};

export type RefreshPayload = {
  sub: string;
  tv: number;
};

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, jwtConfig.accessSecret) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, jwtConfig.refreshSecret) as RefreshPayload;
}
