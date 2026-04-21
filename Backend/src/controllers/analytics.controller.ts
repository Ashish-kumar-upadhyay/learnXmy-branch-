import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { User } from '../models/User.model';
import { ExamSubmission } from '../models/ExamSubmission.model';
import { AssignmentSubmission } from '../models/AssignmentSubmission.model';
import { Attendance } from '../models/Attendance.model';
import { Class } from '../models/Class.model';
import { Assignment } from '../models/Assignment.model';
import { SprintPlanTask } from '../models/SprintPlanTask.model';
import { ok, fail } from '../utils/response';

function weekBuckets() {
  const now = new Date();
  const buckets: Array<{ label: string; start: Date; end: Date }> = [];
  for (let i = 5; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    buckets.push({ label: `W${6 - i}`, start, end });
  }
  return buckets;
}

export async function myAnalytics(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const uid = new Types.ObjectId(req.authUser.id);
  const me = await User.findById(uid).lean();
  const batch = me?.assignedClass ?? null;

  const [attRows, classRows, myAssignSubs, pubAssignments, myExamSubs, sprintRows] = await Promise.all([
    Attendance.find({ student_id: uid }).select('status date checked_in_at').lean(),
    batch ? Class.find({ batch }).select('schedule created_at').lean() : Promise.resolve([] as any[]),
    AssignmentSubmission.find({ student_id: uid }).select('submitted_at').lean(),
    batch ? Assignment.find({ batch, status: 'published' }).select('created_at').lean() : Promise.resolve([] as any[]),
    ExamSubmission.find({ student_id: uid }).select('percentage submitted_at').lean(),
    SprintPlanTask.find({}).select('is_done').lean(),
  ]);

  const presentCount = (attRows as any[]).filter((a) => a.status === 'present' || a.status === 'late').length;
  const totalClasses = (classRows as any[]).length;
  const attendancePercent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  const assignmentPercent =
    (pubAssignments as any[]).length > 0
      ? Math.round(((myAssignSubs as any[]).length / (pubAssignments as any[]).length) * 100)
      : 0;

  const examScores = (myExamSubs as any[])
    .map((e) => Number(e.percentage))
    .filter((n) => Number.isFinite(n));
  const examAvg = examScores.length > 0 ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length) : 0;

  const sprintPercent =
    (sprintRows as any[]).length > 0
      ? Math.round((((sprintRows as any[]).filter((s) => s.is_done).length || 0) / (sprintRows as any[]).length) * 100)
      : 0;

  const buckets = weekBuckets();
  const weeklyData = buckets.map((w) => {
    const weekClasses = (classRows as any[]).filter((c) => {
      const d = new Date(c.schedule ?? c.created_at ?? 0);
      return d >= w.start && d < w.end;
    }).length;
    const weekAtt = (attRows as any[]).filter((a) => {
      const d = new Date(a.date ?? a.checked_in_at ?? 0);
      return d >= w.start && d < w.end && (a.status === 'present' || a.status === 'late');
    }).length;
    const attendance = weekClasses > 0 ? Math.round((weekAtt / weekClasses) * 100) : 0;

    const weekAssTotal = (pubAssignments as any[]).filter((a) => {
      const d = new Date(a.created_at ?? 0);
      return d >= w.start && d < w.end;
    }).length;
    const weekAssDone = (myAssignSubs as any[]).filter((s) => {
      const d = new Date(s.submitted_at ?? 0);
      return d >= w.start && d < w.end;
    }).length;
    const assignments = weekAssTotal > 0 ? Math.round((weekAssDone / weekAssTotal) * 100) : 0;

    const weekExamScores = (myExamSubs as any[])
      .filter((e) => {
        const d = new Date(e.submitted_at ?? 0);
        return d >= w.start && d < w.end;
      })
      .map((e) => Number(e.percentage))
      .filter((n) => Number.isFinite(n));
    const exams =
      weekExamScores.length > 0
        ? Math.round(weekExamScores.reduce((a, b) => a + b, 0) / weekExamScores.length)
        : 0;

    return { week: w.label, attendance, assignments, exams };
  });

  return ok(res, { attendancePercent, assignmentPercent, examAvg, sprintPercent, weeklyData });
}

export async function leaderboard(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const me = await User.findById(req.authUser.id).lean();
  const isAdmin = req.authUser.roles.includes('admin');

  const userFilter: Record<string, unknown> = { role: 'student' };
  if (!isAdmin && me?.assignedClass) userFilter.assignedClass = me.assignedClass;

  const students = await User.find(userFilter).select('name assignedClass').lean();
  if (students.length === 0) return ok(res, []);

  const studentIds = students.map((s: any) => s._id);
  const [examSubs, assignSubs, attRows] = await Promise.all([
    ExamSubmission.find({ student_id: { $in: studentIds } }).select('student_id percentage').lean(),
    AssignmentSubmission.find({ student_id: { $in: studentIds } }).select('student_id').lean(),
    Attendance.find({ student_id: { $in: studentIds } }).select('student_id status').lean(),
  ]);

  const examScoresByStudent = new Map<string, number[]>();
  (examSubs as any[]).forEach((e) => {
    const sid = String(e.student_id);
    const p = Number(e.percentage);
    if (!Number.isFinite(p)) return;
    if (!examScoresByStudent.has(sid)) examScoresByStudent.set(sid, []);
    examScoresByStudent.get(sid)!.push(p);
  });

  const assignmentCountByStudent = new Map<string, number>();
  (assignSubs as any[]).forEach((a) => {
    const sid = String(a.student_id);
    assignmentCountByStudent.set(sid, (assignmentCountByStudent.get(sid) ?? 0) + 1);
  });

  const attendanceCountByStudent = new Map<string, number>();
  (attRows as any[]).forEach((a) => {
    if (!(a.status === 'present' || a.status === 'late')) return;
    const sid = String(a.student_id);
    attendanceCountByStudent.set(sid, (attendanceCountByStudent.get(sid) ?? 0) + 1);
  });

  const badges = ['🏆', '🥈', '🥉'];
  const entries = (students as any[])
    .map((s) => {
      const sid = String(s._id);
      const scores = examScoresByStudent.get(sid) ?? [];
      const examAvg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const assignmentsDone = assignmentCountByStudent.get(sid) ?? 0;
      const attendance = attendanceCountByStudent.get(sid) ?? 0;
      const xp = Math.round(examAvg * 30 + assignmentsDone * 50 + attendance * 10);
      const name = s.name ?? 'Student';
      return {
        rank: 0,
        name,
        avatar: String(name)
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        xp,
        examAvg,
        assignmentsDone,
        userId: sid,
        isYou: sid === req.authUser?.id,
        badge: '',
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .map((e, i) => ({ ...e, rank: i + 1, badge: badges[i] ?? '' }));

  return ok(res, entries);
}
