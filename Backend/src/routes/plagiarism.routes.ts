import { Router } from 'express';
import {
  analyzePlagiarism,
  batchAnalyzePlagiarism,
  getPlagiarismStats,
  getPlagiarismReport,
  flagForReview,
  getFlaggedSubmissions,
} from '../controllers/plagiarism.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route POST /api/plagiarism/submissions/:submissionId/analyze
 * @desc Analyze a single submission for plagiarism
 * @access Teacher/Admin
 */
router.post('/submissions/:submissionId/analyze', analyzePlagiarism);

/**
 * @route POST /api/plagiarism/assignments/:assignmentId/batch-analyze
 * @desc Batch analyze multiple submissions for plagiarism
 * @access Teacher/Admin
 */
router.post('/assignments/:assignmentId/batch-analyze', batchAnalyzePlagiarism);

/**
 * @route GET /api/plagiarism/assignments/:assignmentId/stats
 * @desc Get plagiarism statistics for an assignment
 * @access Teacher/Admin
 */
router.get('/assignments/:assignmentId/stats', getPlagiarismStats);

/**
 * @route GET /api/plagiarism/submissions/:submissionId/report
 * @desc Get detailed plagiarism report for a submission
 * @access Teacher/Admin
 */
router.get('/submissions/:submissionId/report', getPlagiarismReport);

/**
 * @route POST /api/plagiarism/submissions/:submissionId/flag
 * @desc Flag submission for academic review
 * @access Teacher/Admin
 */
router.post('/submissions/:submissionId/flag', flagForReview);

/**
 * @route GET /api/plagiarism/flagged
 * @desc Get all flagged submissions for admin review
 * @access Admin only
 */
router.get('/flagged', getFlaggedSubmissions);

export default router;
