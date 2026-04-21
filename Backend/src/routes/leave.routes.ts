import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listLeaveRequests);
r.post('/', ctrl.submitLeaveRequest);
r.put('/:id/approve', requireRoles('admin'), ctrl.approveLeaveRequest);

export default r;
