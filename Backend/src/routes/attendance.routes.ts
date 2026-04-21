import { Router } from 'express';
import * as ctrl from '../controllers/attendance.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();

r.get('/window', authMiddleware, ctrl.getAttendanceWindow);
r.put('/window', authMiddleware, requireRoles('teacher', 'admin'), ctrl.setAttendanceWindow);
r.post('/mark-day', authMiddleware, requireRoles('student', 'admin'), ctrl.markDayAttendance);
r.get('/summary', authMiddleware, requireRoles('teacher', 'admin'), ctrl.batchAttendanceSummary);

r.post('/checkin', authMiddleware, requireRoles('student', 'admin'), ctrl.studentCheckin);
r.get('/my-attendance', authMiddleware, ctrl.myAttendance);
r.get('/history/:userId', authMiddleware, ctrl.attendanceHistory);
r.get('/class/:id', authMiddleware, requireRoles('teacher', 'admin'), ctrl.classAttendance);
r.post('/class/:id/mark', authMiddleware, requireRoles('teacher', 'admin'), ctrl.markClassAttendance);
r.put('/:id', authMiddleware, requireRoles('admin', 'teacher'), ctrl.updateAttendance);

export default r;
