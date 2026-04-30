import { Router } from 'express';
import * as ctrl from '../controllers/lecture.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listLectures);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createLecture);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteLecture);

export default r;

