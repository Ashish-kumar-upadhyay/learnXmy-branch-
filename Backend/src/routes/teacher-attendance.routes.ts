import { Router } from 'express';
import * as ctrl from '../controllers/attendance.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.post('/checkin', requireRoles('teacher', 'admin'), ctrl.teacherCheckin);
r.get('/history', ctrl.teacherAttendanceHistory);
r.put('/:id', requireRoles('admin'), ctrl.updateTeacherAttendance);

export default r;
