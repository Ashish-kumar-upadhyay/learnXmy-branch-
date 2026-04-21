import crypto from 'crypto';
import { User } from '../models/User.model';
import { UserRole } from '../models/UserRole.model';
import { hashPassword, verifyPassword } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppRole } from '../types/auth.types';
import { generateUniqueStudentId } from './studentId.service';
import { generateUniqueTeacherCode } from './teacherCode.service';
import { sendWelcomeEmailViaResend } from './mail.service';

const WELCOME_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function newWelcomeLoginToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const welcome_login_expires = new Date(Date.now() + WELCOME_TOKEN_TTL_MS);
  return { token, welcome_login_expires };
}

export async function registerUser(data: {
  email?: string;
  password: string;
  full_name: string;
  role: AppRole;
  batch?: string;
  username?: string;
  class_name?: string;
}) {
  if (data.role === 'student') {
    const emailTrim = data.email?.trim();
    const { user, welcomeToken } = await createStudent({
      email: emailTrim ? emailTrim.toLowerCase() : undefined,
      password: data.password,
      name: data.full_name,
      assignedClass: data.class_name ?? null,
      is_approved: true,
    });
    const tokens = await issueTokens(user);
    return { ...tokens, welcomeToken };
  }

  if (!data.email?.trim()) {
    throw new Error('Email is required');
  }
  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) {
    throw new Error('Email already registered');
  }
  const password = await hashPassword(data.password);
  const { token, welcome_login_expires } = newWelcomeLoginToken();
  const teacherCode = data.role === 'teacher' ? await generateUniqueTeacherCode() : null;
  const user = await User.create({
    email: data.email.toLowerCase(),
    password,
    name: data.full_name,
    role: data.role,
    assignedClass: data.class_name ?? null,
    is_approved: true,
    welcome_login_token: token,
    welcome_login_expires,
    ...(teacherCode ? { teacherCode } : {}),
  });
  const tokens = await issueTokens(user);
  return { ...tokens, welcomeToken: token };
}

async function issueTokens(
  user: {
    _id: unknown;
    email: string;
    name: string;
    role: AppRole;
    token_version?: number | null;
    studentId?: string | null;
    teacherCode?: string | null;
  }
) {
  const tv = user.token_version ?? 0;
  const roles: AppRole[] = [user.role];
  const accessToken = signAccessToken({
    sub: String(user._id),
    roles,
    tv,
  });
  const refreshToken = signRefreshToken({ sub: String(user._id), tv });
  const sid = user.studentId && String(user.studentId).length > 0 ? String(user.studentId) : null;
  const tc = user.teacherCode && String(user.teacherCode).length > 0 ? String(user.teacherCode) : null;
  return {
    accessToken,
    refreshToken,
    user: {
      id: String(user._id),
      email: user.email,
      full_name: user.name,
      roles,
      ...(sid ? { student_id: sid } : {}),
      ...(tc ? { teacher_code: tc } : {}),
    },
  };
}

export async function loginWithWelcomeToken(token: string) {
  if (!token || token.length < 32) throw new Error('Invalid link');
  const user = await User.findOne({ welcome_login_token: token }).select(
    '+welcome_login_token +welcome_login_expires +token_version'
  );
  if (!user || !(user as any).welcome_login_token) throw new Error('Invalid or expired link');
  const exp = (user as any).welcome_login_expires as Date | undefined;
  if (!exp || exp.getTime() < Date.now()) throw new Error('Invalid or expired link');
  await User.findByIdAndUpdate(user._id, {
    $unset: { welcome_login_token: '', welcome_login_expires: '' },
  });
  return issueTokens(user);
}

export async function loginUser(
  email?: string,
  studentId?: string,
  password?: string,
  teacherCode?: string
) {
  if (!password) {
    throw new Error('Password is required');
  }

  const tc = teacherCode?.trim();

  if (!email && !studentId && !tc) {
    throw new Error('Either email, student ID, or teacher code is required');
  }

  let user;

  if (studentId) {
    user = await User.findOne({ studentId }).select('+password +token_version');
    if (!user) {
      throw new Error('Student ID not found');
    }
    if (user.role !== 'student') {
      throw new Error('Student ID login is only allowed for students');
    }
  } else if (tc) {
    user = await User.findOne({ teacherCode: tc }).select('+password +token_version');
    if (!user) {
      throw new Error('Teacher code not found');
    }
    if (user.role !== 'teacher') {
      throw new Error('Teacher code login is only allowed for teachers');
    }
  } else {
    user = await User.findOne({ email: email!.toLowerCase() }).select('+password +token_version');
    if (!user) {
      throw new Error('Email not found');
    }
  }
  
  if (!(await verifyPassword(password, user.password))) {
    throw new Error('Invalid credentials');
  }
  
  return issueTokens(user);
}

export async function refreshTokens(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select('+token_version');
  const tv = user?.token_version ?? 0;
  if (!user || tv !== (payload.tv ?? 0)) {
    throw new Error('Invalid refresh token');
  }
  return issueTokens(user);
}

export async function incrementTokenVersion(userId: string) {
  await User.findByIdAndUpdate(userId, { $inc: { token_version: 1 } });
}

export async function getProfileUser(userId: string) {
  const user = await User.findById(userId).lean();
  if (!user) return null;
  const roles: AppRole[] = [user.role];
  return {
    id: String(user._id),
    email: user.email,
    full_name: user.name,
    avatar_url: user.avatar_url ?? null,
    batch: null,
    class_name: user.assignedClass ?? null,
    is_approved: (user as any).is_approved ?? true,
    student_id: (user as { studentId?: string | null }).studentId ?? null,
    teacher_code: (user as { teacherCode?: string | null }).teacherCode ?? null,
    roles,
  };
}

export async function updateProfile(
  userId: string,
  body: Partial<{
    full_name: string;
    batch: string | null;
    class_name: string | null;
    avatar_url: string | null;
    username: string | null;
  }>
) {
  // Build $set only for fields provided; otherwise we may accidentally null out values.
  const $set: Record<string, unknown> = {};
  if (body.full_name !== undefined) $set.name = body.full_name;
  if (body.class_name !== undefined) $set.assignedClass = body.class_name ?? null;
  if (body.avatar_url !== undefined) $set.avatar_url = body.avatar_url ?? null;

  const user = await User.findByIdAndUpdate(userId, { $set }, { new: true }).lean();

  if (!user) return null;
  return getProfileUser(userId);
}

export async function createUserByAdmin(data: {
  email?: string;
  password: string;
  full_name: string;
  role: AppRole;
  batch?: string;
  is_approved?: boolean;
}) {
  if (data.role === 'student') {
    const emailTrim = data.email?.trim();
    if (!emailTrim) {
      throw new Error('Email is required for students');
    }
    const out = await createStudent({
      email: emailTrim.toLowerCase(),
      password: data.password,
      name: data.full_name,
      assignedClass: data.batch ?? null,
      is_approved: data.is_approved ?? true,
    });
    return {
      user: out.user,
      welcomeToken: out.welcomeToken,
      studentId: out.studentId,
      welcomeEmailSent: out.welcomeEmailSent,
    };
  }

  if (data.role === 'teacher') {
    const emailTrim = data.email?.trim();
    if (!emailTrim) {
      throw new Error('Email is required for teachers');
    }
    const exists = await User.findOne({ email: emailTrim.toLowerCase() });
    if (exists) throw new Error('Email already registered');
    const teacherCode = await generateUniqueTeacherCode();
    const password = await hashPassword(data.password);
    const { token, welcome_login_expires } = newWelcomeLoginToken();
    const user = await User.create({
      email: emailTrim.toLowerCase(),
      password,
      name: data.full_name,
      role: 'teacher',
      assignedClass: data.batch ?? null,
      is_approved: data.is_approved ?? true,
      teacherCode,
      welcome_login_token: token,
      welcome_login_expires,
    });
    const welcomeEmailSent = await sendWelcomeEmailViaResend({
      to: user.email,
      name: user.name,
      role: 'teacher',
      welcomeToken: token,
      teacherCode,
    });
    return { user, welcomeToken: token, teacherCode, welcomeEmailSent };
  }

  if (!data.email?.trim()) {
    throw new Error('Email is required');
  }
  const exists = await User.findOne({ email: data.email.toLowerCase() });
  if (exists) throw new Error('Email already registered');
  const password = await hashPassword(data.password);
  const { token, welcome_login_expires } = newWelcomeLoginToken();
  const user = await User.create({
    email: data.email.toLowerCase(),
    password,
    name: data.full_name,
    role: data.role,
    assignedClass: data.batch ?? null,
    is_approved: data.is_approved ?? true,
    welcome_login_token: token,
    welcome_login_expires,
  });
  const welcomeEmailSent = await sendWelcomeEmailViaResend({
    to: user.email,
    name: user.name,
    role: data.role,
    welcomeToken: token,
  });
  return { user, welcomeToken: token, welcomeEmailSent };
}

export async function listUsers(filter: { batch?: string } = {}) {
  const q: Record<string, unknown> = {};
  // `batch` param in older frontend maps to user's assigned class.
  if (filter.batch) q.assignedClass = filter.batch;
  return User.find(q).select('-password -token_version').lean();
}

export async function createStudent(data: {
  email?: string;
  password: string;
  name: string;
  assignedClass?: string | null;
  is_approved?: boolean;
}) {
  const studentId = await generateUniqueStudentId();
  
  // Check if email is provided and already exists
  if (data.email) {
    const exists = await User.findOne({ email: data.email.toLowerCase() });
    if (exists) {
      throw new Error(
        'This email is already used by another LearnX account. Remove it, use a different address, or leave optional email empty — student login uses Student ID, not email.'
      );
    }
  }
  
  const password = await hashPassword(data.password);
  const { token, welcome_login_expires } = newWelcomeLoginToken();
  
  const user = await User.create({
    email: data.email ? data.email.toLowerCase() : `${studentId}@learnx.local`,
    password,
    name: data.name,
    role: 'student',
    assignedClass: data.assignedClass ?? null,
    is_approved: data.is_approved ?? true,
    studentId,
    welcome_login_token: token,
    welcome_login_expires,
  });

  const welcomeEmailSent = await sendWelcomeEmailViaResend({
    to: user.email,
    name: user.name,
    role: 'student',
    welcomeToken: token,
    studentId,
  });

  return { user, studentId, welcomeToken: token, welcomeEmailSent };
}

export async function deleteUserCascade(userId: string) {
  const id = String(userId);
  await UserRole.deleteMany({ user_id: id });
  await User.findByIdAndDelete(userId);
}
