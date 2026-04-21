import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { Timetable } from '../models/Timetable.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';
import { notifyUser } from '../realtime';
import { ok, created, fail } from '../utils/response';

function batchVariants(batchRaw: string) {
  const b = String(batchRaw || '').trim();
  const stripped = b.replace(/^batch\s+/i, '').trim();
  const withPrefix = stripped ? `Batch ${stripped}` : '';
  const out = [b, stripped, withPrefix].filter(Boolean);
  return Array.from(new Set(out));
}

export async function listTimetable(req: AuthRequest, res: Response) {
  const q: Record<string, unknown> = {};
  if (req.query.batch) q.batch = req.query.batch;
  if (req.query.class_id) q.class_id = req.query.class_id;
  const items = await Timetable.find(q).sort({ day_of_week: 1, start_time: 1 }).lean();
  const teacherIds = [...new Set((items as any[]).map((i) => String(i.teacher_id)).filter(Boolean))];
  const teachers = teacherIds.length
    ? await User.find({ _id: { $in: teacherIds.map((id) => new Types.ObjectId(id)) } }).select('name').lean()
    : [];
  const teacherMap = new Map<string, string>();
  (teachers as any[]).forEach((t) => teacherMap.set(String(t._id), t.name ?? 'Unknown'));

  const out = (items as any[]).map((i) => ({
    ...i,
    id: String(i._id),
    teacher_id: i.teacher_id ? String(i.teacher_id) : null,
    class_id: i.class_id ? String(i.class_id) : null,
    teacher_name: i.teacher_id ? teacherMap.get(String(i.teacher_id)) ?? 'Unknown' : 'Unknown',
  }));
  return ok(res, out);
}

export async function createTimetable(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  if (body.class_id) body.class_id = new Types.ObjectId(body.class_id);
  body.teacher_id = body.teacher_id ? new Types.ObjectId(body.teacher_id) : new Types.ObjectId(req.authUser?.id);
  if (body.day_of_week !== undefined && body.day_of_week !== null) {
    body.day_of_week = Number(body.day_of_week);
  }
  const doc = await Timetable.create(body);
  
  // Notify students of this batch (so unread count + sound works)
  try {
    const batch = String((doc as any).batch ?? '').trim();
    if (batch) {
      const variants = batchVariants(batch);
      const students = await User.find({ role: 'student', assignedClass: { $in: variants } })
        .select('_id')
        .lean();
      await Promise.all(
        (students as any[]).map(async (s) => {
          const uid = String(s._id);
          const n = await Notification.create({
            user_id: uid,
            title: 'Timetable updated',
            message: `New class added to timetable for batch ${batch}.`,
            type: 'timetable',
            target_path: '/timetable',
          });
          notifyUser(uid, 'notification', {
            id: String(n._id),
            title: n.title,
            message: n.message,
            type: (n as any).type,
            target_path: (n as any).target_path ?? null,
          });
        })
      );
    }
  } catch (e) {
    // Timetable create already succeeded; log only.
    console.error('Timetable notification failed', e);
  }

  return created(res, { ...doc.toObject(), id: String(doc._id), teacher_id: String((doc as any).teacher_id) });
}

export async function updateTimetable(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  if (body.class_id) body.class_id = new Types.ObjectId(body.class_id);
  if (body.teacher_id) body.teacher_id = new Types.ObjectId(body.teacher_id);
  if (body.day_of_week !== undefined && body.day_of_week !== null) {
    body.day_of_week = Number(body.day_of_week);
  }
  const t = await Timetable.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
  if (!t) return fail(res, 404, 'Not found');
  return ok(res, {
    ...t,
    id: String((t as any)._id),
    teacher_id: (t as any).teacher_id ? String((t as any).teacher_id) : null,
    class_id: (t as any).class_id ? String((t as any).class_id) : null,
  });
}

export async function deleteTimetable(req: AuthRequest, res: Response) {
  await Timetable.findByIdAndDelete(req.params.id);
  return ok(res, null, 'Deleted');
}
