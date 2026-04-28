import mongoose, { Schema, Document } from 'mongoose';
import type { AppRole } from '../types/auth.types';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: AppRole;
  assignedClass?: string | null;
  avatar_url?: string | null;
  is_approved?: boolean;
  studentId?: string | null;
  teacherCode?: string | null;

  // Token invalidation (optional for existing data)
  token_version?: number;

  /** One-time link for welcome email (plain token stored; cleared after use). */
  welcome_login_token?: string | null;
  welcome_login_expires?: Date | null;

  // Existing naming from your current Mongo documents
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    assignedClass: { type: String, default: null },
    avatar_url: { type: String, default: null },
    is_approved: { type: Boolean, default: true },
    studentId: {
      type: String,
      default: null,
      sparse: true,
      unique: true,
      index: true,
      validate: {
        validator: function (this: IUser, value: string | null | undefined): boolean {
          if (this.role !== 'student') return true;
          return typeof value === 'string' && value.length > 0;
        },
        message: 'Student ID is required for student role',
      },
    },

    /** Only teachers have a code; do not default to null (unique index would reject multiple nulls). */
    teacherCode: {
      type: String,
      trim: true,
    },

    token_version: { type: Number, default: 0 },

    welcome_login_token: { type: String, default: null, select: false, sparse: true, index: true },
    welcome_login_expires: { type: Date, default: null, select: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

UserSchema.pre('save', function (next) {
  this.set('updatedAt', new Date());
  next();
});

/** Unique only when set (teachers); avoids E11000 duplicate key { teacherCode: null }. */
UserSchema.index(
  { teacherCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      teacherCode: { $exists: true, $type: 'string', $gt: '' },
    },
  }
);

// Performance indexes for frequently queried fields
UserSchema.index({ assignedClass: 1 });
UserSchema.index({ role: 1, assignedClass: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
