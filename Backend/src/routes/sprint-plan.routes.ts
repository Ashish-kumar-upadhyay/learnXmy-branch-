import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';
import * as ctrl from '../controllers/sprintPlan.controller.js';

const r = Router();
r.use(authMiddleware);

// Plans
r.get('/sprint-plans', ctrl.listSprintPlans);
r.post('/sprint-plans', requireRoles('admin', 'teacher'), ctrl.createSprintPlan);
r.delete('/sprint-plans/:id', requireRoles('admin', 'teacher'), ctrl.deleteSprintPlan);

// Tasks
r.get('/sprint-plan-tasks', ctrl.listSprintPlanTasks);
r.post('/sprint-plan-tasks', requireRoles('admin', 'teacher'), ctrl.createSprintPlanTask);
r.put('/sprint-plan-tasks/:id', requireRoles('admin', 'teacher'), ctrl.toggleSprintPlanTask);
r.delete('/sprint-plan-tasks/:id', requireRoles('admin', 'teacher'), ctrl.deleteSprintPlanTask);

export default r;

