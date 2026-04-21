import { Router } from 'express';
import * as ctrl from '../controllers/salary.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/config', ctrl.listSalaryConfig);
r.post('/config', requireRoles('admin'), ctrl.createSalaryConfig);
r.put('/config/:id', requireRoles('admin'), ctrl.updateSalaryConfig);
r.delete('/config/:id', requireRoles('admin'), ctrl.deleteSalaryConfig);
r.get('/calculate/:id', requireRoles('admin', 'teacher'), ctrl.calculateSalary);
r.post('/process', requireRoles('admin'), ctrl.processSalary);

export default r;
