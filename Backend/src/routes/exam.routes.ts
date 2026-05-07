import { Router } from 'express';
import * as ctrl from '../controllers/exam.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/', ctrl.listExams);
r.get('/my-submissions', requireRoles('student', 'admin'), ctrl.mySubmissions);
r.post('/', requireRoles('teacher', 'admin'), ctrl.createExam);
r.get('/:id/questions', ctrl.listQuestions);
r.get('/:id/my-attempt', requireRoles('student', 'admin'), ctrl.myAttempt);
r.post('/:id/start', requireRoles('student', 'admin'), ctrl.startExam);
r.post('/:id/questions', requireRoles('teacher', 'admin'), ctrl.addQuestion);
r.put('/:id/questions/:qid', requireRoles('teacher', 'admin'), ctrl.updateQuestion);
r.delete('/:id/questions/:qid', requireRoles('teacher', 'admin'), ctrl.deleteQuestion);
r.post('/:id/submit', requireRoles('student', 'admin'), ctrl.submitExam);
r.get('/:id/results', requireRoles('teacher', 'admin'), ctrl.examResults);
r.get('/:id/statistics', requireRoles('teacher', 'admin'), ctrl.examStatistics);
r.get('/:id/student-performance', requireRoles('teacher', 'admin'), ctrl.examStudentPerformance);
r.get('/:id', ctrl.getExam);
r.put('/:id', requireRoles('teacher', 'admin'), ctrl.updateExam);
r.delete('/:id', requireRoles('teacher', 'admin'), ctrl.deleteExam);

export default r;
