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
  console.log('Notifying students for batch variants:', variants);
  const students = await User.find({ 
    $or: [
      { role: 'student', assignedClass: { $in: variants } },
      { role: 'student', class_name: { $in: variants } }
    ]
  }).select('_id').lean();
  console.log('Found students to notify:', students.length);
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

  // Debug: Log query parameters
  console.log('listExams query:', { teacherId, batch, status });

  const q: Record<string, unknown> = {};
  if (teacherId) q.teacher_id = new Types.ObjectId(teacherId);
  if (batch) {
    const variants = batchVariants(batch);
    console.log('Batch variants for query:', variants);
    q.$or = [
      { batch: { $in: variants } },
      { 'class_name': { $in: variants } },
      { assignedClass: { $in: variants } }
    ];
  }
  if (status) q.status = status;

  console.log('Final query object:', q);

  const items = await Exam.find(q).sort({ created_at: -1 }).lean();
  const out = (items as any[]).map((e) => ({ ...e, id: String(e._id) }));
  
  // Debug: Log results
  console.log('Exams found:', out.map(e => ({ title: e.title, batch: e.batch, status: e.status })));
  
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
    const qCount = await ExamQuestion.countDocuments({ exam_id: doc._id });
    if (qCount !== 5) return fail(res, 400, 'Publish requires exactly 5 questions');
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
  if (String(body.status ?? '').toLowerCase() === 'published') {
    const qCount = await ExamQuestion.countDocuments({ exam_id: new Types.ObjectId(req.params.id) });
    if (qCount !== 5) return fail(res, 400, 'Publish requires exactly 5 questions');
  }
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
  const isStudent = req.authUser?.roles.includes('student');
  const out = (items as any[]).map((q) => {
    const base = { ...q, id: String(q._id), exam_id: String(q.exam_id) } as any;
    if (isStudent) delete base.correct_answer;
    return base;
  });
  return ok(res, out);
}

export async function addQuestion(req: AuthRequest, res: Response) {
  const options = Array.isArray(req.body?.options) ? req.body.options.filter((o: unknown) => String(o ?? '').trim()) : [];
  if (options.length !== 4) return fail(res, 400, 'Each MCQ must have exactly 4 options');
  if (!options.includes(req.body?.correct_answer)) return fail(res, 400, 'Correct answer must match one of the 4 options');
  const doc = await ExamQuestion.create({
    ...req.body,
    options,
    exam_id: new Types.ObjectId(req.params.id),
  });
  return created(res, { ...doc.toObject(), id: String(doc._id), exam_id: String(doc.exam_id) });
}

export async function updateQuestion(req: AuthRequest, res: Response) {
  const eid = new Types.ObjectId(req.params.id);
  const patch: Record<string, unknown> = { ...req.body };
  if (Array.isArray(patch.options)) {
    const options = (patch.options as unknown[]).filter((o) => String(o ?? '').trim()).map((o) => String(o));
    if (options.length !== 4) return fail(res, 400, 'Each MCQ must have exactly 4 options');
    patch.options = options;
    if (patch.correct_answer && !options.includes(String(patch.correct_answer))) {
      return fail(res, 400, 'Correct answer must match one of the 4 options');
    }
  }
  const q = await ExamQuestion.findOneAndUpdate(
    { _id: req.params.qid, exam_id: eid },
    { $set: patch },
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

export async function startExam(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const eid = new Types.ObjectId(req.params.id);
  const exam = await Exam.findById(eid).lean();
  if (!exam) return fail(res, 404, 'Exam not found');
  if ((exam as any).status !== 'published') return fail(res, 400, 'Exam is not published');

  const questionCount = await ExamQuestion.countDocuments({ exam_id: eid });
  if (questionCount !== 5) return fail(res, 400, 'Exam must have exactly 5 questions before attempting');

  const sid = new Types.ObjectId(req.authUser.id);
  const existing = await ExamSubmission.findOne({ exam_id: eid, student_id: sid }).lean();
  if (existing && ((existing as any).status === 'submitted' || (existing as any).status === 'auto_submitted')) {
    return fail(res, 400, 'You have already attempted this exam');
  }

  const now = new Date();
  const duration = Math.max(1, Number((exam as any).duration_minutes || 30));
  const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

  const sub = await ExamSubmission.findOneAndUpdate(
    { exam_id: eid, student_id: sid },
    {
      $set: {
        status: 'in_progress',
        started_at: now,
        expires_at: expiresAt,
        warning_count: Number((existing as any)?.warning_count ?? 0),
      },
      $setOnInsert: { exam_id: eid, student_id: sid, answers: {} },
    },
    { upsert: true, new: true }
  );

  return ok(res, {
    id: String((sub as any)._id),
    exam_id: String((sub as any).exam_id),
    student_id: String((sub as any).student_id),
    status: (sub as any).status,
    started_at: (sub as any).started_at,
    expires_at: (sub as any).expires_at,
    warning_count: (sub as any).warning_count ?? 0,
  });
}

export async function myAttempt(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const eid = new Types.ObjectId(req.params.id);
  const sid = new Types.ObjectId(req.authUser.id);
  const sub = await ExamSubmission.findOne({ exam_id: eid, student_id: sid }).lean();
  if (!sub) return ok(res, null);
  return ok(res, {
    ...(sub as any),
    id: String((sub as any)._id),
    exam_id: String((sub as any).exam_id),
    student_id: String((sub as any).student_id),
  });
}

export async function submitExam(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { answers = {}, auto_submit_reason = null } = req.body as {
    answers?: Record<string, string>;
    auto_submit_reason?: 'time_up' | 'tab_switch' | 'reload' | null;
  };
  const eid = new Types.ObjectId(req.params.id);
  const exam = await Exam.findById(eid).lean();
  if (!exam) return fail(res, 404, 'Exam not found');
  const questions = await ExamQuestion.find({ exam_id: eid }).lean();
  let score = 0;
  let totalMarks = 0;
  const resultBreakdown: Array<{
    question_id: string;
    question: string;
    selected_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
  }> = [];
  for (const q of questions) {
    totalMarks += q.marks;
    const selected = answers[String(q._id)] ?? null;
    const isCorrect = selected === q.correct_answer;
    if (isCorrect) score += q.marks;
    resultBreakdown.push({
      question_id: String(q._id),
      question: q.question,
      selected_answer: selected,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
    });
  }
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
  const sid = new Types.ObjectId(req.authUser.id);
  const existing = await ExamSubmission.findOne({ exam_id: eid, student_id: sid }).lean();
  if (existing && ((existing as any).status === 'submitted' || (existing as any).status === 'auto_submitted')) {
    return fail(res, 400, 'Exam already submitted');
  }
  const now = new Date();
  const examEnded = existing?.expires_at ? now.getTime() > new Date((existing as any).expires_at).getTime() : false;
  const finalStatus = auto_submit_reason || examEnded ? 'auto_submitted' : 'submitted';
  const sub = await ExamSubmission.findOneAndUpdate(
    { exam_id: eid, student_id: sid },
    {
      $set: {
        answers,
        score,
        percentage,
        submitted_at: now,
        status: finalStatus,
        auto_submit_reason: auto_submit_reason ?? (examEnded ? 'time_up' : null),
        result_breakdown: resultBreakdown,
      },
      $setOnInsert: { exam_id: eid, student_id: sid },
    },
    { upsert: true, new: true }
  );
  return ok(res, {
    ...(sub.toObject ? sub.toObject() : (sub as any)),
    id: String((sub as any)._id),
    exam_id: String((sub as any).exam_id),
    student_id: String((sub as any).student_id),
    score,
    percentage,
    total_questions: questions.length,
    correct_answers: resultBreakdown.filter((x) => x.is_correct).length,
    wrong_answers: resultBreakdown.filter((x) => !x.is_correct).length,
    status: (sub as any).status,
    auto_submit_reason: (sub as any).auto_submit_reason ?? null,
    result_breakdown: resultBreakdown,
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
