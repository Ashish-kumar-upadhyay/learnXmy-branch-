import { Router } from 'express';
import * as ctrl from '../controllers/assignment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listAssignments);
r.get('/my-submissions', requireRoles('student', 'admin'), ctrl.mySubmissions);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createAssignment);
r.get('/:id', ctrl.getAssignment);
r.put('/:id', requireRoles('teacher', 'admin'), ctrl.updateAssignment);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteAssignment);
r.post('/:id/submit', requireRoles('student', 'admin'), ctrl.submitAssignment);
r.get('/:id/submissions', requireRoles('teacher', 'admin'), ctrl.listSubmissions);
r.put('/:id/grade', requireRoles('teacher', 'admin'), ctrl.gradeSubmission);

export default r;
