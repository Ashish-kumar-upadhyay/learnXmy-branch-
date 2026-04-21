import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import * as authService from '../services/auth.service';
import { ok, created, fail } from '../utils/response';

export async function register(req: AuthRequest, res: Response) {
  try {
    const out = await authService.registerUser(req.body);
    return created(res, out, 'Registered');
  } catch (e) {
    return fail(res, 400, e instanceof Error ? e.message : 'Error');
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, studentId, teacherCode, password } = req.body;
    const out = await authService.loginUser(email, studentId, password, teacherCode);
    return ok(res, out);
  } catch (e) {
    return fail(res, 401, e instanceof Error ? e.message : 'Error');
  }
}

export async function welcomeLogin(req: AuthRequest, res: Response) {
  try {
    const { token } = req.body as { token?: string };
    const out = await authService.loginWithWelcomeToken(String(token || ''));
    return ok(res, out);
  } catch (e) {
    return fail(res, 401, e instanceof Error ? e.message : 'Error');
  }
}

export async function logout(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  await authService.incrementTokenVersion(req.authUser.id);
  return ok(res, null, 'Logged out');
}

export async function refreshToken(req: AuthRequest, res: Response) {
  try {
    const { refreshToken: rt } = req.body;
    if (!rt) return fail(res, 400, 'refreshToken required');
    const out = await authService.refreshTokens(rt);
    return ok(res, out);
  } catch (e) {
    return fail(res, 401, e instanceof Error ? e.message : 'Error');
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const profile = await authService.getProfileUser(req.authUser.id);
  if (!profile) return fail(res, 404, 'Not found');
  return ok(res, profile);
}

export async function updateProfile(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const profile = await authService.updateProfile(req.authUser.id, req.body);
  if (!profile) return fail(res, 404, 'Not found');
  return ok(res, profile, 'Updated');
}

export async function createStudent(req: AuthRequest, res: Response) {
  try {
    if (!req.authUser) return fail(res, 401, 'Unauthorized');
    const roles = req.authUser.roles ?? [];
    if (!roles.includes('admin') && !roles.includes('teacher')) {
      return fail(res, 403, 'Only admin or teacher can create students');
    }

    const out = await authService.createStudent(req.body);
    const u = out.user as { _id: unknown; name?: string; email?: string; toObject?: () => Record<string, unknown> };
    const plain = typeof u.toObject === 'function' ? u.toObject() : { _id: u._id, name: u.name, email: u.email };
    return created(
      res,
      {
        id: String(plain._id),
        studentId: out.studentId,
        welcomeToken: out.welcomeToken,
        welcomeEmailSent: out.welcomeEmailSent,
        full_name: typeof plain.name === 'string' ? plain.name : u.name,
        email: typeof plain.email === 'string' ? plain.email : u.email,
      },
      'Student created successfully'
    );
  } catch (e) {
    return fail(res, 400, e instanceof Error ? e.message : 'Error');
  }
}
