import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { Attendance } from '../models/Attendance.model';
import { TeacherAttendance } from '../models/TeacherAttendance.model';
import { AttendanceWindow } from '../models/AttendanceWindow.model';
import { User } from '../models/User.model';
import { ok, fail } from '../utils/response';

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function tomorrowStart() {
  const t = startOfDay(new Date());
  t.setDate(t.getDate() + 1);
  return t;
}

function parseHHMM(s: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

async function getEffectiveWindow(batch: string, day: Date) {
  return AttendanceWindow.findOne({
    batch,
    effective_from: { $lte: day },
  })
    .sort({ effective_from: -1 })
    .lean();
}

function timeDecision(now: Date, w?: { start_time?: string; end_time?: string } | null) {
  if (!w?.start_time || !w?.end_time) return { started: true, within: true };
  const startMin = parseHHMM(String(w.start_time));
  const endMin = parseHHMM(String(w.end_time));
  if (startMin === null || endMin === null) return { started: true, within: true };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return { started: nowMin >= startMin, within: nowMin <= endMin };
}

export async function getAttendanceWindow(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const batch =
    typeof req.query.batch === 'string'
      ? req.query.batch.trim()
      : (await User.findById(req.authUser.id).select('assignedClass').lean())?.assignedClass ?? '';
  if (!batch) return ok(res, null);
  const w = await getEffectiveWindow(String(batch), startOfDay(new Date()));
  return ok(res, w ?? null);
}

export async function setAttendanceWindow(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { batch, start_time, end_time } = req.body as {
    batch: string;
    start_time: string;
    end_time: string;
  };
  const b = String(batch || '').trim();
  if (!b) return fail(res, 400, 'batch required');
  const startMin = parseHHMM(start_time);
  const endMin = parseHHMM(end_time);
  if (startMin === null || endMin === null) return fail(res, 400, 'Invalid time format (HH:MM)');
  if (endMin <= startMin) return fail(res, 400, 'end_time must be after start_time');

  // Requirement: teacher can change any time; new timing applies from next day
  const doc = await AttendanceWindow.create({
    batch: b,
    start_time: String(start_time).trim(),
    end_time: String(end_time).trim(),
    effective_from: tomorrowStart(),
    created_by: req.authUser.id,
  });
  return ok(res, { ...doc.toObject(), id: String(doc._id) }, 'Attendance timing updated (effective tomorrow)');
}

export async function markDayAttendance(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { date, kind } = req.body as { date?: string; kind?: 'full' | 'half_day' };
  const day = date ? new Date(date) : new Date(NaN);
  if (!Number.isFinite(day.getTime())) return fail(res, 400, 'Invalid date');

  const selected = startOfDay(day);
  const today = startOfDay(new Date());
  if (selected.getTime() !== today.getTime()) return fail(res, 400, 'Only today attendance can be marked');

  const now = new Date();
  const student = await User.findById(req.authUser.id).select('assignedClass').lean();
  const batch = String(student?.assignedClass ?? '').trim();
  const w = batch ? await getEffectiveWindow(batch, today) : null;
  const td = timeDecision(now, w as any);
  if (!td.started) return fail(res, 400, 'Attendance window has not started yet');

  // Option B: half-day allowed even after end time
  const status: 'present' | 'late' | 'half_day' =
    kind === 'half_day' ? 'half_day' : td.within ? 'present' : 'late';

  const doc = await Attendance.findOneAndUpdate(
    { student_id: new Types.ObjectId(req.authUser.id), date: today },
    {
      $set: {
        status,
        checked_in_at: now,
        verified: false,
      },
      $setOnInsert: { student_id: new Types.ObjectId(req.authUser.id), date: today },
    },
    { upsert: true, new: true }
  ).lean();
  return ok(res, doc);
}

export async function batchAttendanceSummary(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const batch = typeof req.query.batch === 'string' ? req.query.batch.trim() : '';
  const dateRaw = typeof req.query.date === 'string' ? req.query.date : '';
  if (!batch) return fail(res, 400, 'batch required');
  const day = dateRaw ? startOfDay(new Date(dateRaw)) : startOfDay(new Date());
  if (!Number.isFinite(day.getTime())) return fail(res, 400, 'Invalid date');

  const students = await User.find({ role: 'student', assignedClass: batch })
    .select('_id name email avatar_url assignedClass')
    .lean();

  const sids = (students as any[]).map((s) => new Types.ObjectId(String(s._id)));
  const attendanceRows = sids.length
    ? await Attendance.find({ student_id: { $in: sids }, date: day }).lean()
    : [];
  const map = new Map<string, any>();
  (attendanceRows as any[]).forEach((a) => map.set(String(a.student_id), a));

  const out = (students as any[]).map((s) => {
    const sid = String(s._id);
    const a = map.get(sid);
    return {
      student_id: sid,
      full_name: s.name ?? null,
      email: s.email ?? null,
      avatar_url: s.avatar_url ?? null,
      batch: s.assignedClass ?? batch,
      status: a?.status ?? 'absent',
      checked_in_at: a?.checked_in_at ?? null,
    };
  });
  return ok(res, out);
}

function verifyGps(
  lat: number,
  lng: number,
  expected?: { latitude: number; longitude: number; radiusMeters?: number }
) {
  if (!expected) return true;
  const R = 6371000;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (expected.latitude * Math.PI) / 180;
  const Δφ = ((expected.latitude - lat) * Math.PI) / 180;
  const Δλ = ((expected.longitude - lng) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d <= (expected.radiusMeters ?? 200);
}

export async function studentCheckin(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { class_id, selfie_url, latitude, longitude, expected_location } = req.body;
  const lat = Number(latitude);
  const lng = Number(longitude);
  const gpsOk =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? verifyGps(lat, lng, expected_location)
      : false;

  const today = startOfDay(new Date());
  const now = new Date();
  const student = await User.findById(req.authUser.id).select('assignedClass').lean();
  const batch = String(student?.assignedClass ?? '').trim();

  let status: 'present' | 'late' | 'absent' | 'half_day' = 'present';
  if (batch) {
    const w = await getEffectiveWindow(batch, today);
    if (w?.start_time && w?.end_time) {
      const td = timeDecision(now, w as any);
      if (!td.started) return fail(res, 400, 'Attendance window has not started yet');
      status = td.within ? 'present' : 'late';
    }
  }

  // One record per student per day (upsert)
  const doc = await Attendance.findOneAndUpdate(
    { student_id: new Types.ObjectId(req.authUser.id), date: today },
    {
      $set: {
        class_id: class_id ? new Types.ObjectId(class_id) : undefined,
        status,
        selfie_url,
        checked_in_at: now,
        location:
          Number.isFinite(lat) && Number.isFinite(lng)
            ? { latitude: lat, longitude: lng, verified: gpsOk }
            : undefined,
        verified: gpsOk,
      },
      $setOnInsert: { student_id: new Types.ObjectId(req.authUser.id), date: today },
    },
    { upsert: true, new: true }
  );
  return ok(res, doc);
}

export async function attendanceHistory(req: AuthRequest, res: Response) {
  const userId = req.params.userId;
  const query: { student_id: Types.ObjectId } = { student_id: new Types.ObjectId(userId) };
  const items = await Attendance.find(query).sort({ checked_in_at: -1 }).lean();

  // Get missed days from analytics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Create attendance map for gap detection
  const attendanceMap = new Map<string, any>();
  items.forEach((record: any) => {
    const dateKey = new Date(record.date).toDateString();
    attendanceMap.set(dateKey, record);
  });

  // Create sorted attendance dates
  const attendanceDates = Array.from(attendanceMap.keys())
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());

  // Find gaps and create missed records
  const missedRecords = [];
  for (let i = 1; i < attendanceDates.length; i++) {
    const prevDate = attendanceDates[i - 1];
    const currentDate = attendanceDates[i];
    const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If gap is more than 1 day, create missed records
    if (daysDiff > 1) {
      for (let dayOffset = 1; dayOffset < daysDiff; dayOffset++) {
        const missedDate = new Date(prevDate.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
        
        // Only add if within last 30 days
        if (missedDate >= thirtyDaysAgo && missedDate <= new Date()) {
          missedRecords.push({
            _id: `missed-${missedDate.getTime()}`,
            student_id: new Types.ObjectId(userId),
            date: missedDate,
            status: 'absent',
            checked_in_at: missedDate,
            notes: 'Automatically marked as absent (gap in attendance)',
            class_id: null,
            verified: false,
            isMissedDay: true // Flag to identify missed days
          });
        }
      }
    }
  }

  // Combine actual records with missed records
  const allRecords = [...items, ...missedRecords].sort((a, b) => 
    new Date(b.date || b.checked_in_at).getTime() - new Date(a.date || a.checked_in_at).getTime()
  );

  return ok(res, allRecords);
}

export async function classAttendance(req: AuthRequest, res: Response) {
  const dateRaw = typeof req.query.date === 'string' ? req.query.date : undefined;
  const day = dateRaw ? startOfDay(new Date(dateRaw)) : undefined;
  const q: Record<string, unknown> = { class_id: new Types.ObjectId(req.params.id) };
  if (day && Number.isFinite(day.getTime())) q.date = day;

  const items = await Attendance.find(q)
    .sort({ date: -1 })
    .lean();
  return ok(res, items);
}

export async function markClassAttendance(req: AuthRequest, res: Response) {
  const classId = req.params.id;
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return fail(res, 400, 'rows required');
  const dateRaw = typeof req.body?.date === 'string' ? req.body.date : undefined;
  const day = dateRaw ? startOfDay(new Date(dateRaw)) : startOfDay(new Date());

  const saved: unknown[] = [];
  for (const row of rows) {
    const studentId = row?.student_id;
    if (!studentId) continue;
    const status = row?.status || 'present';
    const notes = row?.notes;

    const doc = await Attendance.findOneAndUpdate(
      {
        class_id: new Types.ObjectId(classId),
        student_id: new Types.ObjectId(studentId),
        date: day,
      },
      {
        $set: {
          status,
          checked_in_at: new Date(),
          verified: false,
          ...(notes ? { notes } : {}),
        },
        $setOnInsert: {
          class_id: new Types.ObjectId(classId),
          student_id: new Types.ObjectId(studentId),
          date: day,
        },
      },
      { upsert: true, new: true }
    ).lean();
    if (doc) saved.push(doc);
  }

  return ok(res, saved, 'Attendance saved');
}

export async function updateAttendance(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  if (body.class_id) body.class_id = new Types.ObjectId(body.class_id);
  const a = await Attendance.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
  if (!a) return fail(res, 404, 'Not found');
  return ok(res, a);
}

export async function teacherCheckin(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { status, notes } = req.body;
  const today = startOfDay(new Date());
  const now = new Date();

  // One check-in per teacher per day (upsert)
  const doc = await TeacherAttendance.findOneAndUpdate(
    { teacher_id: new Types.ObjectId(req.authUser.id), date: today },
    {
      $set: {
        status: status || 'present',
        check_in_time: now,
        notes,
      },
      $setOnInsert: {
        teacher_id: new Types.ObjectId(req.authUser.id),
        date: today,
      },
    },
    { upsert: true, new: true }
  ).lean();
  return ok(res, doc, 'Teacher attendance marked');
}

export async function teacherAttendanceHistory(req: AuthRequest, res: Response) {
  const teacherId = req.query.teacher_id as string | undefined;
  const tid = teacherId || req.authUser?.id;
  if (!tid) return fail(res, 400, 'teacher_id required');
  const items = await TeacherAttendance.find({ teacher_id: tid }).sort({ date: -1 }).lean();
  return ok(res, items);
}

export async function myAttendance(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  
  const attendance = await Attendance.find({ 
    student_id: new Types.ObjectId(req.authUser.id) 
  })
  .populate('class_id', 'title subject scheduled_at')
  .sort({ date: -1 })
  .lean();
  
  const formattedAttendance = attendance.map(record => {
    const classData = record.class_id as any;
    return {
      id: record._id,
      class_id: classData?._id,
      class_title: classData?.title,
      class_subject: classData?.subject,
      present: record.status === 'present',
      date: record.date,
      scheduled_at: classData?.scheduled_at
    };
  });
  
  return ok(res, formattedAttendance);
}

export async function updateTeacherAttendance(req: AuthRequest, res: Response) {
  const a = await TeacherAttendance.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean();
  if (!a) return fail(res, 404, 'Not found');
  return ok(res, a);
}
