import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { Exam } from '../models/Exam.model';
import { ExamQuestion } from '../models/ExamQuestion.model';
import { ExamSubmission } from '../models/ExamSubmission.model';
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

async function notifyExamPublished(batch: string | null | undefined, title: string) {
  if (!batch) return;
  const variants = batchVariants(batch);
  const students = await User.find({ role: 'student', assignedClass: { $in: variants } }).select('_id').lean();
  if (!students.length) return;
  await Promise.all(
    (students as any[]).map(async (s) => {
      const uid = String(s._id);
      const doc = await Notification.create({
        user_id: uid,
        title: 'New exam/quiz published',
        message: `"${title}" has been published. Please check Exams.`,
        type: 'exam',
        target_path: '/exams',
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

export async function listExams(_req: AuthRequest, res: Response) {
  const teacherId = typeof _req.query.teacher_id === 'string' ? _req.query.teacher_id : undefined;
  const batch = typeof _req.query.batch === 'string' ? _req.query.batch : undefined;
  const status = typeof _req.query.status === 'string' ? _req.query.status : undefined;

  const q: Record<string, unknown> = {};
  if (teacherId) q.teacher_id = new Types.ObjectId(teacherId);
  if (batch) q.batch = { $in: batchVariants(batch) };
  if (status) q.status = status;

  const items = await Exam.find(q).sort({ created_at: -1 }).lean();
  const out = (items as any[]).map((e) => ({ ...e, id: String(e._id) }));
  return ok(res, out);
}

export async function createExam(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  const teacherId = body.teacher_id ?? req.authUser?.id;
  if (!teacherId) return fail(res, 400, 'teacher_id is required');
  body.teacher_id = new Types.ObjectId(teacherId);
  if (body.class_id) body.class_id = new Types.ObjectId(body.class_id);
  const doc = await Exam.create(body);
  if (String(body.status ?? '').toLowerCase() === 'published') {
    await notifyExamPublished(body.batch ?? null, body.title ?? 'New Exam');
  }
  return created(res, { ...doc.toObject(), id: String(doc._id) });
}

export async function getExam(req: AuthRequest, res: Response) {
  const e = await Exam.findById(req.params.id).lean();
  if (!e) return fail(res, 404, 'Not found');
  return ok(res, e);
}

export async function updateExam(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  if (body.teacher_id) body.teacher_id = new Types.ObjectId(body.teacher_id);
  if (body.class_id) body.class_id = new Types.ObjectId(body.class_id);
  const e = await Exam.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
  if (!e) return fail(res, 404, 'Not found');
  if (String((e as any).status ?? '').toLowerCase() === 'published') {
    await notifyExamPublished((e as any).batch ?? null, (e as any).title ?? 'New Exam');
  }
  return ok(res, e);
}

export async function deleteExam(req: AuthRequest, res: Response) {
  const eid = new Types.ObjectId(req.params.id);
  await ExamQuestion.deleteMany({ exam_id: eid });
  await ExamSubmission.deleteMany({ exam_id: eid });
  await Exam.findByIdAndDelete(eid);
  return ok(res, null, 'Deleted');
}

export async function listQuestions(req: AuthRequest, res: Response) {
  const eid = new Types.ObjectId(req.params.id);
  const items = await ExamQuestion.find({ exam_id: eid }).sort({ sort_order: 1 }).lean();
  const out = (items as any[]).map((q) => ({ ...q, id: String(q._id), exam_id: String(q.exam_id) }));
  return ok(res, out);
}

export async function addQuestion(req: AuthRequest, res: Response) {
  const doc = await ExamQuestion.create({
    ...req.body,
    exam_id: new Types.ObjectId(req.params.id),
  });
  return created(res, { ...doc.toObject(), id: String(doc._id), exam_id: String(doc.exam_id) });
}

export async function updateQuestion(req: AuthRequest, res: Response) {
  const eid = new Types.ObjectId(req.params.id);
  const q = await ExamQuestion.findOneAndUpdate(
    { _id: req.params.qid, exam_id: eid },
    { $set: req.body },
    { new: true }
  ).lean();
  if (!q) return fail(res, 404, 'Not found');
  return ok(res, { ...(q as any), id: String((q as any)._id), exam_id: String((q as any).exam_id) });
}

export async function deleteQuestion(req: AuthRequest, res: Response) {
  const eid = new Types.ObjectId(req.params.id);
  await ExamQuestion.deleteOne({ _id: req.params.qid, exam_id: eid });
  return ok(res, null, 'Deleted');
}

export async function submitExam(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { answers } = req.body as { answers: Record<string, string> };
  const eid = new Types.ObjectId(req.params.id);
  const questions = await ExamQuestion.find({ exam_id: eid }).lean();
  let score = 0;
  let totalMarks = 0;
  for (const q of questions) {
    totalMarks += q.marks;
    if (answers[String(q._id)] === q.correct_answer) score += q.marks;
  }
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
  const sid = new Types.ObjectId(req.authUser.id);
  const sub = await ExamSubmission.findOneAndUpdate(
    { exam_id: eid, student_id: sid },
    {
      $set: { answers, score, percentage, submitted_at: new Date(), status: 'submitted' },
      $setOnInsert: { exam_id: eid, student_id: sid },
    },
    { upsert: true, new: true }
  );
  return ok(res, {
    ...(sub.toObject ? sub.toObject() : (sub as any)),
    id: String((sub as any)._id),
    exam_id: String((sub as any).exam_id),
    student_id: String((sub as any).student_id),
  });
}

export async function examResults(req: AuthRequest, res: Response) {
  const eid = new Types.ObjectId(req.params.id);
  const items = await ExamSubmission.find({ exam_id: eid }).lean();
  const out = (items as any[]).map((s) => ({
    ...s,
    id: String(s._id),
    exam_id: String(s.exam_id),
    student_id: String(s.student_id),
  }));
  return ok(res, out);
}

export async function mySubmissions(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const sid = new Types.ObjectId(req.authUser.id);
  const items = await ExamSubmission.find({ student_id: sid }).sort({ submitted_at: -1 }).lean();
  const out = (items as any[]).map((s) => ({
    ...s,
    id: String(s._id),
    exam_id: String(s.exam_id),
    student_id: String(s.student_id),
  }));
  return ok(res, out);
}
