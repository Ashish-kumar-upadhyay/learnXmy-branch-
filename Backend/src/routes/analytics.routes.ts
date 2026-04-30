import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const r = Router();
r.use(authMiddleware);

r.get('/me', ctrl.myAnalytics);
r.get('/leaderboard', ctrl.leaderboard);

export default r;
