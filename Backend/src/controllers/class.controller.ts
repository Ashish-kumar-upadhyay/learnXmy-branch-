import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { Class } from '../models/Class.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';
import { notifyUser } from '../realtime';
import { ok, created, fail } from '../utils/response';

async function notifyClassCreated(batch: string | null | undefined, title: string, schedule?: Date | string) {
  const query: Record<string, unknown> = { role: 'student' };
  if (batch) query.assignedClass = batch;
  let students = await User.find(query).select('_id').lean();
  // Fallback: if class batch has no mapped students, notify all students so no one misses it.
  if ((!students || students.length === 0) && batch) {
    students = await User.find({ role: 'student' }).select('_id').lean();
  }
  if (!students.length) return;
  const when = schedule ? new Date(schedule).toLocaleString() : 'scheduled time';
  await Promise.all(
    (students as any[]).map(async (s) => {
      const uid = String(s._id);
      const doc = await Notification.create({
        user_id: uid,
        title: 'New class scheduled',
        message: `"${title}" class has been scheduled for ${when}.`,
        type: 'timetable',
        target_path: '/attendance',
      });
      notifyUser(uid, 'notification', {
        id: String(doc._id),
        title: doc.title,
        message: doc.message,
        type: doc.type,
        target_path: (doc as any).target_path ?? null,
      });
    })
  );
}

export async function listClasses(_req: AuthRequest, res: Response) {
  const items = await Class.find().sort({ created_at: -1 }).lean();
  const out = (items as any[]).map((c) => ({ ...c, id: String(c._id) }));
  return ok(res, out);
}

export async function createClass(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  const teacherId = body.teacher_id ?? req.authUser?.id;
  if (!teacherId) return fail(res, 400, 'teacher_id is required');
  body.teacher_id = new Types.ObjectId(teacherId);
  // Legacy compatibility: classes collection may enforce unique index on `name`.
  if (!body.name) {
    const base = String(body.title ?? 'class');
    body.name = `${base}-${Date.now()}`;
  }
  const doc = await Class.create(body);
  await notifyClassCreated(body.batch ?? null, body.title ?? 'New Class', body.schedule ?? body.scheduled_at);
  return created(res, { ...doc.toObject(), id: String(doc._id) });
}

export async function getClass(req: AuthRequest, res: Response) {
  const c = await Class.findById(req.params.id).lean();
  if (!c) return fail(res, 404, 'Not found');
  return ok(res, { ...(c as any), id: String((c as any)._id) });
}

export async function updateClass(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  if (body.teacher_id) body.teacher_id = new Types.ObjectId(body.teacher_id);
  const c = await Class.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
  if (!c) return fail(res, 404, 'Not found');
  return ok(res, { ...(c as any), id: String((c as any)._id) });
}

export async function deleteClass(req: AuthRequest, res: Response) {
  await Class.findByIdAndDelete(req.params.id);
  return ok(res, null, 'Deleted');
}

export async function classesByTeacher(req: AuthRequest, res: Response) {
  const tid = new Types.ObjectId(req.params.id);
  const items = await Class.find({ teacher_id: tid }).sort({ schedule: 1 }).lean();
  const out = (items as any[]).map((c) => ({ ...c, id: String(c._id) }));
  return ok(res, out);
}

export async function classesByBatch(req: AuthRequest, res: Response) {
  const items = await Class.find({ batch: req.params.batch }).lean();
  return ok(res, items);
}
