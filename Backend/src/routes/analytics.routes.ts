import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/me', ctrl.myAnalytics);
r.get('/leaderboard', ctrl.leaderboard);

export default r;
