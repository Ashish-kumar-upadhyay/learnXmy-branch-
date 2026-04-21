import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listAnnouncements);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createAnnouncement);
r.put('/:id', requireRoles('teacher', 'admin'), ctrl.updateAnnouncement);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteAnnouncement);

export default r;
