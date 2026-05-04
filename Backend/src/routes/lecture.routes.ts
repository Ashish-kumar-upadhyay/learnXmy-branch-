import { Router } from 'express';
import * as ctrl from '../controllers/lecture.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listLectures);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createLecture);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteLecture);

export default r;

