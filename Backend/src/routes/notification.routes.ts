import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';

const r = Router();
r.use(authMiddleware);

r.get('/unread-count', ctrl.unreadCount);
r.get('/', ctrl.listNotifications);
r.post('/', requireRoles('admin', 'teacher'), ctrl.createNotification);
r.put('/:id/read', ctrl.markNotificationRead);
r.delete('/:id', ctrl.deleteNotification);

export default r;
