import { Router } from 'express';
import {
  analyzeSubmission,
  batchAnalyzeSubmissions,
  getGradingStats,
  applyAIGrading,
  getClassGradingInsights,
} from '../controllers/aiGrading.controller.js';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/ai-grading/submissions/:submissionId/analyze
 * @desc Analyze a single submission with AI
 * @access Teacher/Admin
 */
router.post('/submissions/:submissionId/analyze', analyzeSubmission);

/**
 * @route POST /api/ai-grading/assignments/:assignmentId/batch-analyze
 * @desc Batch analyze multiple submissions for an assignment
 * @access Teacher/Admin
 */
router.post('/assignments/:assignmentId/batch-analyze', batchAnalyzeSubmissions);

/**
 * @route GET /api/ai-grading/assignments/:assignmentId/stats
 * @desc Get grading statistics for an assignment
 * @access Teacher/Admin
 */
router.get('/assignments/:assignmentId/stats', getGradingStats);

/**
 * @route PUT /api/ai-grading/submissions/:submissionId/apply
 * @desc Apply AI suggested grade and feedback
 * @access Teacher/Admin
 */
router.put('/submissions/:submissionId/apply', applyAIGrading);

/**
 * @route GET /api/ai-grading/classes/:classId/insights
 * @desc Get AI grading insights for a class
 * @access Teacher/Admin
 */
router.get('/classes/:classId/insights', getClassGradingInsights);

export default router;
