import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/unread-count', ctrl.unreadCount);
r.get('/', ctrl.listNotifications);
r.post('/', requireRoles('admin', 'teacher'), ctrl.createNotification);
r.put('/:id/read', ctrl.markNotificationRead);
r.delete('/:id', ctrl.deleteNotification);

export default r;
