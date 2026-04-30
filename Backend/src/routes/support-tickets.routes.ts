import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';
import * as ctrl from '../controllers/supportTicket.controller.js';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listSupportTickets);
r.post('/', ctrl.createSupportTicket);
r.put('/:id/respond', requireRoles('teacher', 'admin'), ctrl.respondSupportTicket);

export default r;

