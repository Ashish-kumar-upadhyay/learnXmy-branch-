import { Response } from 'express';
import { Types } from 'mongoose';
import { ok, created, fail } from '../utils/response';
import { Lecture } from '../models/Lecture.model';
import { AuthRequest } from '../types/auth.types';

export async function listLectures(req: AuthRequest, res: Response) {
  const teacherId = typeof req.query.teacher_id === 'string' ? req.query.teacher_id : undefined;
  const q: Record<string, unknown> = { status: 'published' };
  if (teacherId) q.teacher_id = teacherId;

  const items = await Lecture.find(q).sort({ created_at: -1 }).lean();
  const out = (items as any[]).map((l) => ({ ...l, id: l.id ?? String(l._id) }));
  return ok(res, out);
}

export async function createLecture(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const body = { ...req.body };
  const doc = await Lecture.create({
    ...body,
    teacher_id: body.teacher_id ?? req.authUser.id,
    status: body.status ?? 'published',
  });
  const out = { ...doc.toObject(), id: String(doc._id) };
  return created(res, out);
}

export async function deleteLecture(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const id = req.params.id;
  const or: Record<string, unknown>[] = [{ id }];
  if (Types.ObjectId.isValid(id)) or.push({ _id: new Types.ObjectId(id) });

  await Lecture.deleteOne({ $or: or });
  return ok(res, null, 'Deleted');
}

