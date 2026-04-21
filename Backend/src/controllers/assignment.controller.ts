import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { Assignment } from '../models/Assignment.model';
import { AssignmentSubmission } from '../models/AssignmentSubmission.model';
import { User } from '../models/User.model';
import { Notification } from '../models/Notification.model';
import { notifyUser } from '../realtime';
import { ok, created, fail } from '../utils/response';

function normalizeDueDate(due: Date | string | null | undefined) {
  if (!due) return null;
  const dt = new Date(due);
  if (
    dt.getHours() === 0 &&
    dt.getMinutes() === 0 &&
    dt.getSeconds() === 0 &&
    dt.getMilliseconds() === 0
  ) {
    const eod = new Date(dt);
    eod.setHours(23, 59, 59, 999);
    return eod;
  }
  return dt;
}

async function notifyAssignmentPublished(batch: string | null | undefined, title: string) {
  if (!batch) return;
  const students = await User.find({ role: 'student', assignedClass: batch }).select('_id').lean();
  if (!students.length) return;
  await Promise.all(
    (students as any[]).map(async (s) => {
      const uid = String(s._id);
      const doc = await Notification.create({
        user_id: uid,
        title: 'New assignment published',
        message: `"${title}" is now available. Please check Assignments.`,
        type: 'assignment',
        target_path: '/assignments',
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

export async function listAssignments(_req: AuthRequest, res: Response) {
  const req = _req;
  const teacherId = typeof req.query.teacher_id === 'string' ? req.query.teacher_id : undefined;
  const batch = typeof req.query.batch === 'string' ? req.query.batch : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const q: Record<string, unknown> = {};
  if (teacherId) q.teacher_id = new Types.ObjectId(teacherId);
  if (batch) q.batch = batch;
  if (status) q.status = status;
  const items = await Assignment.find(q).sort({ created_at: -1 }).lean();
  const out = (items as any[]).map((a) => ({ ...a, id: String(a._id) }));
  return ok(res, out);
}

export async function createAssignment(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  const teacherId = body.teacher_id ?? req.authUser?.id;
  if (!teacherId) return fail(res, 400, 'teacher_id is required');
  body.teacher_id = new Types.ObjectId(teacherId);
  if (body.class_id) body.class_id = new Types.ObjectId(body.class_id);
  const doc = await Assignment.create(body);
  if (String(body.status ?? '').toLowerCase() === 'published') {
    await notifyAssignmentPublished(body.batch ?? null, body.title ?? 'New Assignment');
  }
  return created(res, { ...doc.toObject(), id: String(doc._id) });
}

export async function getAssignment(req: AuthRequest, res: Response) {
  const a = await Assignment.findById(req.params.id).lean();
  if (!a) return fail(res, 404, 'Not found');
  return ok(res, a);
}

export async function updateAssignment(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  if (body.teacher_id) body.teacher_id = new Types.ObjectId(body.teacher_id);
  if (body.class_id) body.class_id = new Types.ObjectId(body.class_id);
  const a = await Assignment.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
  if (!a) return fail(res, 404, 'Not found');
  if (String((a as any).status ?? '').toLowerCase() === 'published') {
    await notifyAssignmentPublished((a as any).batch ?? null, (a as any).title ?? 'New Assignment');
  }
  return ok(res, a);
}

export async function deleteAssignment(req: AuthRequest, res: Response) {
  const aid = new Types.ObjectId(req.params.id);
  await Assignment.findByIdAndDelete(aid);
  await AssignmentSubmission.deleteMany({ assignment_id: aid });
  return ok(res, null, 'Deleted');
}

export async function submitAssignment(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { submission_link } = req.body;
  if (!submission_link) return fail(res, 400, 'submission_link is required');
  const aid = new Types.ObjectId(req.params.id);
  const sid = new Types.ObjectId(req.authUser.id);
  const assignment = await Assignment.findById(aid).lean();
  if (!assignment) return fail(res, 404, 'Assignment not found');

  const due = normalizeDueDate(assignment.due_date);
  if (due && Date.now() > due.getTime()) {
    return fail(res, 400, 'Deadline has passed. Submission editing is closed.');
  }

  const existing = await AssignmentSubmission.findOne({ assignment_id: aid, student_id: sid });
  let sub;
  if (existing) {
    existing.submission_link = submission_link;
    existing.submitted_at = new Date();
    sub = await existing.save();
  } else {
    sub = await AssignmentSubmission.create({
      assignment_id: aid,
      student_id: sid,
      submission_link,
      submitted_at: new Date(),
    });
  }

  // Notify teacher that a student submitted/updated assignment.
  const teacherId = String(assignment.teacher_id);
  if (teacherId) {
    const student = await User.findById(sid).select('name').lean();
    const studentName = (student as any)?.name || 'A student';
    const doc = await Notification.create({
      user_id: teacherId,
      title: 'Assignment submission received',
      message: `${studentName} submitted "${assignment.title}".`,
      type: 'assignment_submission',
      target_path: '/teacher?tab=assignments',
    });
    notifyUser(teacherId, 'notification', {
      id: String(doc._id),
      title: doc.title,
      message: doc.message,
      type: doc.type,
      target_path: (doc as any).target_path ?? null,
    });
  }

  return ok(res, sub, existing ? 'Submission updated' : 'Submission created');
}

export async function listSubmissions(req: AuthRequest, res: Response) {
  const items = await AssignmentSubmission.find({
    assignment_id: new Types.ObjectId(req.params.id),
  }).lean();
  const studentIds = [...new Set((items as any[]).map((i) => String(i.student_id)))];
  const students = await User.find({
    _id: { $in: studentIds.map((id) => new Types.ObjectId(id)) },
  })
    .select('name email')
    .lean();
  const studentMap = new Map<string, { name?: string; email?: string }>();
  (students as any[]).forEach((s) => studentMap.set(String(s._id), { name: s.name, email: s.email }));

  const out = (items as any[]).map((s) => ({
    ...s,
    id: String(s._id),
    assignment_id: String(s.assignment_id),
    student_id: String(s.student_id),
    student_name: studentMap.get(String(s.student_id))?.name ?? null,
    student_email: studentMap.get(String(s.student_id))?.email ?? null,
  }));
  return ok(res, out);
}

export async function mySubmissions(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const sid = new Types.ObjectId(req.authUser.id);
  const items = await AssignmentSubmission.find({ student_id: sid }).sort({ submitted_at: -1 }).lean();
  const out = (items as any[]).map((s) => ({ ...s, id: String(s._id), assignment_id: String(s.assignment_id) }));
  return ok(res, out);
}

export async function gradeSubmission(req: AuthRequest, res: Response) {
  const { student_id, grade, feedback } = req.body;
  const sid = typeof student_id === 'string' ? new Types.ObjectId(student_id) : student_id;
  const sub = await AssignmentSubmission.findOneAndUpdate(
    {
      assignment_id: new Types.ObjectId(req.params.id),
      student_id: sid,
    },
    { $set: { grade, feedback, graded_at: new Date() } },
    { new: true }
  );
  if (!sub) return fail(res, 404, 'Submission not found');

  // Notify student about grading/feedback update.
  const a = await Assignment.findById(req.params.id).select('title').lean();
  const doc = await Notification.create({
    user_id: String(sid),
    title: 'Assignment reviewed',
    message: `Your assignment "${(a as any)?.title ?? 'assignment'}" has been reviewed.${feedback ? ` Feedback: ${feedback}` : ''}`,
    type: 'assignment_review',
    target_path: '/assignments',
  });
  notifyUser(String(sid), 'notification', {
    id: String(doc._id),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    target_path: (doc as any).target_path ?? null,
  });

  return ok(res, sub);
}
