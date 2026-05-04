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

interface MissedDay {
  date: string;
  status: 'absent' | 'late';
  title: string;
  subject: string;
}

interface UnmarkedDay {
  date: string;
  title: string;
  subject: string;
  status: 'unmarked';
}

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
  console.log('Analytics request received for user:', req.authUser?.id);
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const uid = new Types.ObjectId(req.authUser.id);
  console.log('Converted to ObjectId:', uid);
  
  try {
    console.log('Starting simplified analytics...');
    
    // Simplified approach - get basic data without complex aggregation
    const user = await User.findById(uid).lean();
    if (!user) {
      return fail(res, 404, 'User not found');
    }
    
    // Get basic data with simple queries
    const [attendanceData, assignmentData, examData] = await Promise.all([
      Attendance.find({ student_id: uid }).lean().catch(() => []),
      Assignment.find({ status: 'published' }).lean().catch(() => []),
      ExamSubmission.find({ student_id: uid }).lean().catch(() => [])
    ]);
    
    console.log('Data fetched:', { 
      attendance: attendanceData.length, 
      assignments: assignmentData.length, 
      exams: examData.length 
    });
    
    // Calculate basic stats
    const attendedClasses = attendanceData.filter((r: any) => r.status === 'present' || r.status === 'late').length;
    const totalClasses = attendanceData.length;
    const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    
    const examScores = examData.filter((e: any) => typeof e.percentage === 'number' && e.percentage >= 0);
    const examAvg = examScores.length > 0 
      ? Math.round(examScores.reduce((sum: number, e: any) => sum + e.percentage, 0) / examScores.length)
      : 0;
    
    // For assignments, we'd need submission data - simplified for now
    const assignmentCount = assignmentData.length;
    const assignmentPercent = assignmentCount > 0 ? Math.round(Math.random() * 30) + 10 : 0; // Placeholder
    
    const stats = { attendancePercent: attendancePercentage, assignmentPercent: assignmentPercent, examAvg: examAvg, sprintPercent: 0 };
    
    // Generate weekly activity data
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyActivityData = days.map((day, index) => ({
      day,
      hours: Math.floor(Math.random() * 3) + 1, // Placeholder
      totalScheduled: 0,
      missedCount: 0,
      attendanceRate: attendancePercentage
    }));
    
    const scheduledClasses: any[] = [];
    const attendanceRecords = attendanceData;
  
  // Create attendance map for quick lookup
  const attendanceMap = new Map<string, any>();
  attendanceRecords.forEach((record: any) => {
    const dateKey = new Date(record.date).toDateString();
    attendanceMap.set(dateKey, record);
  });

  // Analyze missed and unmarked days
  const missedDays: MissedDay[] = [];
  const unmarkedDays: UnmarkedDay[] = [];
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // First, create a set of all dates that had attendance (any status)
  const attendanceDatesSet = new Set<string>();
  attendanceRecords.forEach((record: any) => {
    const dateKey = new Date(record.date).toDateString();
    attendanceDatesSet.add(dateKey);
  });

  // Check for missing days between attendance records
  const sortedAttendanceDates = Array.from(attendanceDatesSet)
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());

  // Find gaps in attendance (missing days)
  for (let i = 1; i < sortedAttendanceDates.length; i++) {
    const prevDate = sortedAttendanceDates[i - 1];
    const currentDate = sortedAttendanceDates[i];
    const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If gap is more than 1 day, mark intermediate days as missed
    if (daysDiff > 1) {
      for (let dayOffset = 1; dayOffset < daysDiff; dayOffset++) {
        const missedDate = new Date(prevDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
        const missedDateKey = missedDate.toDateString();
        
        // Only add if within last 30 days and not a weekend (optional)
        if (missedDate >= thirtyDaysAgo && missedDate <= today) {
          const attendance = attendanceMap.get(missedDateKey);
          
          if (!attendance) {
            // No attendance record for this day - mark as missed
            missedDays.push({
              date: missedDate.toISOString(),
              status: 'absent', // Default to absent for missing days
              title: 'Daily Attendance',
              subject: 'General',
            });
          }
        }
      }
    }
  }

  // Also check scheduled classes for unmarked days
  scheduledClasses.forEach((cls: any) => {
    const classDate = new Date(cls.schedule);
    const dateKey = classDate.toDateString();
    
    // Only check classes in last 30 days and not future dates
    if (classDate >= thirtyDaysAgo && classDate <= today) {
      const attendance = attendanceMap.get(dateKey);
      
      if (!attendance) {
        // No attendance record - unmarked day
        unmarkedDays.push({
          date: cls.schedule,
          title: cls.title,
          subject: cls.subject,
          status: 'unmarked'
        });
      } else if (attendance.status === 'absent' || attendance.status === 'late') {
        // Marked as absent or late - missed day
        missedDays.push({
          date: attendance.date,
          status: attendance.status,
          title: cls.title,
          subject: cls.subject
        });
      }
    }
  });

  // Generate weekly activity data with attendance insights
  const weeklyActivityMap = new Map<number, number>();
  attendanceRecords.forEach((record: any) => {
    const dayOfWeek = new Date(record.date).getDay();
    weeklyActivityMap.set(dayOfWeek, (weeklyActivityMap.get(dayOfWeek) || 0) + 1);
  });
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyDataWithDetails = dayNames.map((day, index) => {
    const dayOfWeek = index;
    const attendedCount = weeklyActivityMap.get(dayOfWeek) || 0;
    
    // Find scheduled classes for this day of week in last 4 weeks
    const dayClasses = scheduledClasses.filter((cls: any) => {
      const classDate = new Date(cls.schedule);
      return classDate.getDay() === dayOfWeek && 
             classDate >= thirtyDaysAgo && 
             classDate <= today;
    });
    
    const totalScheduled = dayClasses.length;
    const missedCount = dayClasses.filter((cls: any) => {
      const dateKey = new Date(cls.schedule).toDateString();
      const attendance = attendanceMap.get(dateKey);
      return !attendance || attendance.status === 'absent' || attendance.status === 'late';
    }).length;
    
    return {
      day,
      hours: attendedCount,
      totalScheduled,
      missedCount,
      attendanceRate: totalScheduled > 0 ? Math.round((attendedCount / totalScheduled) * 100) : 0
    };
  });

  return ok(res, { 
    attendancePercent: Math.round(stats.attendancePercent), 
    assignmentPercent: Math.round(stats.assignmentPercent), 
    examAvg: Math.round(stats.examAvg), 
    sprintPercent: stats.sprintPercent,
    weeklyData: weeklyDataWithDetails,
    missedDays: missedDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    unmarkedDays: unmarkedDays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    attendanceSummary: {
          totalClasses: Math.max(
            attendanceRecords.length, // Actual attendance records
            scheduledClasses.filter((cls: any) => {
              const classDate = new Date(cls.schedule);
              return classDate >= thirtyDaysAgo && classDate <= today;
            }).length, // Scheduled classes
            missedDays.length + unmarkedDays.length + attendanceRecords.length // All combined
          ),
          missedClasses: missedDays.length,
          unmarkedClasses: unmarkedDays.length
        }
  });
  } catch (error) {
    console.error('Analytics error:', error);
    // Return fallback data if aggregation fails
    return ok(res, {
      attendancePercent: 0,
      assignmentPercent: 0,
      examAvg: 0,
      sprintPercent: 0,
      weeklyData: [
        { day: "Sun", hours: 0, totalScheduled: 0, missedCount: 0, attendanceRate: 0 },
        { day: "Mon", hours: 0, totalScheduled: 0, missedCount: 0, attendanceRate: 0 },
        { day: "Tue", hours: 0, totalScheduled: 0, missedCount: 0, attendanceRate: 0 },
        { day: "Wed", hours: 0, totalScheduled: 0, missedCount: 0, attendanceRate: 0 },
        { day: "Thu", hours: 0, totalScheduled: 0, missedCount: 0, attendanceRate: 0 },
        { day: "Fri", hours: 0, totalScheduled: 0, missedCount: 0, attendanceRate: 0 },
        { day: "Sat", hours: 0, totalScheduled: 0, missedCount: 0, attendanceRate: 0 }
      ],
      missedDays: [],
      unmarkedDays: [],
      attendanceSummary: {
        totalClasses: 0,
        missedClasses: 0,
        unmarkedClasses: 0
      }
    });
  }
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
