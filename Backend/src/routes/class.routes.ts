import { Router } from 'express';
import * as ctrl from '../controllers/class.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/teacher/:id', ctrl.classesByTeacher);
r.get('/batch/:batch', ctrl.classesByBatch);
r.get('/', ctrl.listClasses);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createClass);
r.get('/:id', ctrl.getClass);
r.put('/:id', requireRoles('teacher', 'admin'), ctrl.updateClass);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteClass);

export default r;
