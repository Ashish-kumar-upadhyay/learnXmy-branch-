import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { Notification } from '../models/Notification.model';
import { Announcement } from '../models/Announcement.model';
import { LeaveRequest } from '../models/LeaveRequest.model';
import { User } from '../models/User.model';
import { ok, created, fail } from '../utils/response';
import { notifyUser } from '../realtime';

/** Notifications */
export async function listNotifications(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const limitRaw = Number(req.query.limit);
  const offsetRaw = Number(req.query.offset);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  const items = await Notification.find({ user_id: req.authUser.id })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return ok(res, items);
}

export async function createNotification(req: AuthRequest, res: Response) {
  // Frontend sometimes passes arbitrary string ids; backend keeps notifications keyed by `user_id` string.
  const body = { ...req.body, user_id: String(req.body.user_id) };
  const doc = await Notification.create(body);
  notifyUser(String(body.user_id), 'notification', {
    id: String(doc._id),
    title: doc.title,
    message: doc.message,
    type: (doc as any).type,
    target_path: (doc as any).target_path ?? null,
  });
  return created(res, doc);
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user_id: req.authUser.id },
    { $set: { is_read: true } },
    { new: true }
  ).lean();
  if (!n) return fail(res, 404, 'Not found');
  return ok(res, n);
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  await Notification.deleteOne({ _id: req.params.id, user_id: req.authUser.id });
  return ok(res, null, 'Deleted');
}

export async function unreadCount(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const count = await Notification.countDocuments({ user_id: req.authUser.id, is_read: false });
  return ok(res, { count });
}

/** Announcements */
export async function listAnnouncements(req: AuthRequest, res: Response) {
  const teacherId = typeof req.query.teacher_id === 'string' ? req.query.teacher_id : undefined;
  const batch = typeof req.query.batch === 'string' ? req.query.batch : undefined;
  const q: Record<string, unknown> = {};
  if (teacherId) q.teacher_id = new Types.ObjectId(teacherId);
  if (batch) q.batch = batch;
  const items = await Announcement.find(q).sort({ created_at: -1 }).lean();
  const out = (items as any[]).map((a) => ({ ...a, id: String(a._id), teacher_id: String(a.teacher_id) }));
  return ok(res, out);
}

export async function createAnnouncement(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const doc = await Announcement.create({
    ...req.body,
    teacher_id: new Types.ObjectId(req.authUser.id),
  });
  const batch = (doc as any).batch as string | null | undefined;
  const userQuery: Record<string, unknown> = { role: 'student' };
  if (batch) userQuery.assignedClass = batch;
  const students = await User.find(userQuery).select('_id').lean();
  await Promise.all(
    (students as any[]).map(async (s) => {
      const uid = String(s._id);
      const n = await Notification.create({
        user_id: uid,
        title: 'New announcement',
        message: `${(doc as any).title}`,
        type: 'announcement',
        target_path: '/notifications',
      });
      notifyUser(uid, 'notification', {
        id: String(n._id),
        title: n.title,
        message: n.message,
        type: n.type,
        target_path: (n as any).target_path ?? null,
      });
    })
  );
  return created(res, doc);
}

export async function updateAnnouncement(req: AuthRequest, res: Response) {
  const a = await Announcement.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean();
  if (!a) return fail(res, 404, 'Not found');
  return ok(res, a);
}

export async function deleteAnnouncement(req: AuthRequest, res: Response) {
  await Announcement.findByIdAndDelete(req.params.id);
  return ok(res, null, 'Deleted');
}

/** Leave requests */
export async function listLeaveRequests(req: AuthRequest, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.user_id) filter.user_id = req.query.user_id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.user_type) filter.user_type = req.query.user_type;
  const items = await LeaveRequest.find(filter).sort({ created_at: -1 }).lean();
  return ok(res, items);
}

export async function submitLeaveRequest(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { user_type, start_date, end_date, leave_date, type, reason } = req.body;
  const doc = await LeaveRequest.create({
    user_id: new Types.ObjectId(req.authUser.id),
    user_type: user_type || (req.authUser.roles.includes('teacher') ? 'teacher' : 'student'),
    start_date,
    end_date,
    leave_date,
    type,
    reason,
  });
  return created(res, doc);
}

export async function approveLeaveRequest(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { status, reviewer_note } = req.body as { status: 'approved' | 'rejected'; reviewer_note?: string };
  const lr = await LeaveRequest.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status,
        reviewed_by: new Types.ObjectId(req.authUser.id),
        reviewer_note,
      },
    },
    { new: true }
  ).lean();
  if (!lr) return fail(res, 404, 'Not found');

  const recipientId = String((lr as { user_id: unknown }).user_id);
  const leaveDateRaw = (lr as { leave_date?: Date }).leave_date;
  const dateLabel = leaveDateRaw ? new Date(leaveDateRaw).toLocaleDateString() : 'your selected date';
  const typeLabel = (lr as { type?: string }).type === 'half_day' ? 'half day' : 'full day';
  const title = status === 'approved' ? 'Leave approved' : 'Leave rejected';
  const noteSuffix = reviewer_note?.trim() ? ` Admin note: ${reviewer_note.trim()}` : '';
  const message =
    status === 'approved'
      ? `Your ${typeLabel} leave on ${dateLabel} has been approved.${noteSuffix}`
      : `Your ${typeLabel} leave on ${dateLabel} was rejected.${noteSuffix}`;

  try {
    const doc = await Notification.create({
      user_id: recipientId,
      title,
      message,
      type: 'leave_response',
      target_path: '/leave-requests',
    });
    notifyUser(recipientId, 'notification', {
      id: String(doc._id),
      title: doc.title,
      message: doc.message,
      type: (doc as any).type,
      target_path: (doc as any).target_path ?? null,
    });
  } catch (e) {
    // Leave update already succeeded; log only.
    console.error('Leave approval notification failed', e);
  }

  return ok(res, lr);
}
