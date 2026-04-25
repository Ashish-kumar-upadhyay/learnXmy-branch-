import { Router } from 'express';
import * as ctrl from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.post('/tutor/chat', ctrl.tutorChat);
r.post('/exam/mcqs', requireRoles('teacher', 'admin'), ctrl.generateExamMcqs);
r.get('/tutor/history', ctrl.tutorHistory);
r.delete('/tutor/history', ctrl.clearTutorHistory);
r.post('/tutor/feedback', ctrl.tutorFeedback);
r.get('/tutor/stats', ctrl.tutorStats);

export default r;
