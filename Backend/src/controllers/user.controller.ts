import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { User } from '../models/User.model';
import * as authService from '../services/auth.service';
import { ensureRole, getRolesForUser, removeRole } from '../services/role.service';
import { AppRole } from '../types/auth.types';
import { ok, created, fail } from '../utils/response';

export async function listUsers(req: AuthRequest, res: Response) {
  const batch = req.query.batch as string | undefined;
  const users = await authService.listUsers({ batch });
  return ok(res, users);
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const out = await authService.createUserByAdmin(req.body);
    const { user, welcomeToken, welcomeEmailSent } = out;
    const studentId = 'studentId' in out ? out.studentId : undefined;
    const teacherCode = 'teacherCode' in out ? out.teacherCode : undefined;
    return created(res, {
      id: String(user._id),
      email: user.email,
      full_name: user.name,
      welcomeToken,
      studentId,
      teacherCode,
      welcomeEmailSent,
    });
  } catch (e) {
    return fail(res, 400, e instanceof Error ? e.message : 'Error');
  }
}

export async function getUserById(req: AuthRequest, res: Response) {
  const profile = await authService.getProfileUser(req.params.id);
  if (!profile) return fail(res, 404, 'Not found');
  return ok(res, profile);
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { full_name, class_name, username, is_approved } = req.body;
  const setData: Record<string, unknown> = { name: full_name, assignedClass: class_name ?? null, username };
  if (is_approved !== undefined) setData.is_approved = Boolean(is_approved);
  const u = await User.findByIdAndUpdate(
    req.params.id,
    { $set: setData },
    { new: true }
  )
    .select('-password -token_version')
    .lean();
  if (!u) return fail(res, 404, 'Not found');
  return ok(res, u);
}

export async function deleteUser(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const roles = req.authUser.roles ?? [];
  const targetId = req.params.id;

  if (roles.includes('admin')) {
    await authService.deleteUserCascade(targetId);
    return ok(res, null, 'Deleted');
  }

  if (roles.includes('teacher')) {
    const teacherDoc = await User.findById(req.authUser.id).lean();
    if (!teacherDoc || teacherDoc.role !== 'teacher') {
      return fail(res, 403, 'Forbidden');
    }
    const teacherClass = teacherDoc.assignedClass ?? '';
    if (!String(teacherClass).trim()) {
      return fail(res, 403, 'Set your assigned class in profile before removing students');
    }

    const target = await User.findById(targetId).lean();
    if (!target) return fail(res, 404, 'Student not found');
    if (target.role !== 'student') {
      return fail(res, 403, 'You can only remove students');
    }
    const studentClass = (target.assignedClass ?? '') as string;
    if (String(studentClass) !== String(teacherClass)) {
      return fail(res, 403, 'This student is not in your class');
    }

    await authService.deleteUserCascade(targetId);
    return ok(res, null, 'Deleted');
  }

  return fail(res, 403, 'Forbidden');
}

export async function assignRole(req: AuthRequest, res: Response) {
  const { role } = req.body as { role: AppRole };
  await ensureRole(req.params.id, role);
  // Keep primary role in sync for JWT/RBAC checks
  await User.findByIdAndUpdate(req.params.id, { $set: { role } }).lean();
  return ok(res, null, 'Role assigned');
}

export async function removeRoleFromUser(req: AuthRequest, res: Response) {
  const { role } = req.body as { role: AppRole };
  const userId = req.params.id;
  await removeRole(userId, role);

  const u = await User.findById(userId).lean();
  if (!u) return fail(res, 404, 'Not found');

  const remaining = await getRolesForUser(userId);

  if (remaining.length > 0) {
    await User.findByIdAndUpdate(userId, { $set: { role: remaining[0] } }).lean();
    return ok(res, null, 'Role removed');
  }

  const primary = (u as { role?: AppRole }).role;
  if (primary === role) {
    await authService.deleteUserCascade(userId);
    return ok(res, null, 'User removed');
  }

  await User.findByIdAndUpdate(userId, { $set: { role: primary } }).lean();
  return ok(res, null, 'Role removed');
}

export async function usersByBatch(req: AuthRequest, res: Response) {
  const users = await User.find({ assignedClass: req.params.batch }).select('-password -token_version').lean();
  return ok(res, users);
}
