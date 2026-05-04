import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';
import * as ctrl from '../controllers/supportTicket.controller';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listSupportTickets);
r.post('/', ctrl.createSupportTicket);
r.put('/:id/respond', requireRoles('teacher', 'admin'), ctrl.respondSupportTicket);

export default r;

