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
import { SprintPlan } from '../models/SprintPlan.model';
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

function batchVariants(batchRaw: string | null | undefined): string[] {
  const b = String(batchRaw || '').trim();
  if (!b) return [];
  const stripped = b.replace(/^batch\s+/i, '').trim();
  const withPrefix = stripped ? `Batch ${stripped}` : '';
  return Array.from(new Set([b, stripped, withPrefix].filter(Boolean)));
}

export async function myAnalytics(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const uid = new Types.ObjectId(req.authUser.id);
  
  // Use aggregation for better performance
  const [userStats, weeklyActivity] = await Promise.all([
    // Get user stats in single aggregation
    User.aggregate([
      { $match: { _id: uid } },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'student_id',
          as: 'attendance'
        }
      },
      {
        $lookup: {
          from: 'examsubmissions',
          localField: '_id',
          foreignField: 'student_id',
          as: 'examSubmissions'
        }
      },
      {
        $lookup: {
          from: 'assignments',
          let: { batch: '$assignedClass' },
          pipeline: [
            { $match: { $expr: { $eq: ['$batch', '$$batch'] }, status: 'published' } },
            {
              $lookup: {
                from: 'assignmentsubmissions',
                let: { assignmentId: '$_id', studentId: uid },
                pipeline: [
                  { $match: { $expr: { $and: [{ $eq: ['$assignment_id', '$$assignmentId'] }, { $eq: ['$student_id', '$$studentId'] }] } } }
                ],
                as: 'mySubmission'
              }
            },
            { $addFields: { hasSubmitted: { $gt: [{ $size: '$mySubmission' }, 0] } } }
          ],
          as: 'assignments'
        }
      },
      {
        $project: {
          attendancePercent: {
            $let: {
              vars: {
                presentCount: {
                  $size: {
                    $filter: {
                      input: '$attendance',
                      cond: { $in: ['$$this.status', ['present', 'late']] }
                    }
                  }
                },
                totalCount: { $size: '$attendance' }
              },
              in: {
                $cond: {
                  if: { $gt: ['$$totalCount', 0] },
                  then: { $multiply: [{ $divide: ['$$presentCount', '$$totalCount'] }, 100] },
                  else: 0
                }
              }
            }
          },
          assignmentPercent: {
            $let: {
              vars: {
                submittedCount: {
                  $size: {
                    $filter: {
                      input: '$assignments',
                      cond: '$$this.hasSubmitted'
                    }
                  }
                },
                totalAssignments: { $size: '$assignments' }
              },
              in: {
                $cond: {
                  if: { $gt: ['$$totalAssignments', 0] },
                  then: { $multiply: [{ $divide: ['$$submittedCount', '$$totalAssignments'] }, 100] },
                  else: 0
                }
              }
            }
          },
          examAvg: {
            $let: {
              vars: {
                scores: {
                  $filter: {
                    input: '$examSubmissions',
                    cond: { $and: [{ $isNumber: '$$this.percentage' }, { $gte: ['$$this.percentage', 0] }] }
                  }
                }
              },
              in: {
                $cond: {
                  if: { $gt: [{ $size: '$$scores' }, 0] },
                  then: { $divide: [{ $reduce: { input: '$$scores', in: { $add: ['$$value', '$$this.percentage'] }, initial: 0 } }, { $size: '$$scores' }] },
                  else: 0
                }
              }
            }
          },
          sprintPercent: 0 // Simplified for now
        }
      }
    ]),
    
    // Generate weekly activity data
    Attendance.aggregate([
      { $match: { student_id: uid } },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const stats = userStats[0] || { attendancePercent: 0, assignmentPercent: 0, examAvg: 0, sprintPercent: 0 };
  
  // Simple weekly activity mapping
  const weeklyActivityMap = new Map(weeklyActivity.map((w: any) => [w._id, w.count]));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyActivityData = days.map((day, index) => ({
    day,
    hours: weeklyActivityMap.get(index + 1) || 0
  }));

  return ok(res, { 
    attendancePercent: Math.round(stats.attendancePercent), 
    assignmentPercent: Math.round(stats.assignmentPercent), 
    examAvg: Math.round(stats.examAvg), 
    sprintPercent: stats.sprintPercent,
    weeklyData: weeklyActivityData 
  });
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
