import { Router } from 'express';
import * as ctrl from '../controllers/timetable.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listTimetable);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createTimetable);
r.put('/:id', requireRoles('teacher', 'admin'), ctrl.updateTimetable);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteTimetable);

export default r;
