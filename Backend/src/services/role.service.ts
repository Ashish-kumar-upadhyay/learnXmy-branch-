import { UserRole } from '../models/UserRole.model';
import { AppRole } from '../types/auth.types';

export async function getRolesForUser(userId: string): Promise<AppRole[]> {
  const rows = await UserRole.find({ user_id: userId }).lean();
  return rows.map((r) => r.role as AppRole);
}

export async function ensureRole(userId: string, role: AppRole): Promise<void> {
  await UserRole.updateOne(
    { user_id: userId, role },
    { $setOnInsert: { assigned_at: new Date() } },
    { upsert: true }
  );
}

export async function removeRole(userId: string, role: AppRole): Promise<void> {
  await UserRole.deleteOne({ user_id: userId, role });
}
