import { Router } from 'express';
import * as ctrl from '../controllers/timetable.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listTimetable);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createTimetable);
r.put('/:id', requireRoles('teacher', 'admin'), ctrl.updateTimetable);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteTimetable);

export default r;
