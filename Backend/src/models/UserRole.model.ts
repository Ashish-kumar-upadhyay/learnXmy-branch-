import mongoose, { Schema, Document } from 'mongoose';
import type { AppRole } from '../types/auth.types';

export interface IUserRole extends Document {
  // In your current Mongo, user_roles.user_id is a UUID string (not ObjectId)
  user_id: string;
  role: AppRole;
  assigned_at?: Date;
}

const UserRoleSchema = new Schema<IUserRole>(
  {
    user_id: { type: String, required: true, index: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    assigned_at: { type: Date, default: Date.now },
  },
  { collection: 'user_roles' }
);

UserRoleSchema.index({ user_id: 1, role: 1 }, { unique: true });

export const UserRole = mongoose.model<IUserRole>('UserRole', UserRoleSchema);
