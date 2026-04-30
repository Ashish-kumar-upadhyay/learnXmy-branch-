import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types.js';
import { AssignmentSubmission } from '../models/AssignmentSubmission.model.js';
import { Assignment } from '../models/Assignment.model.js';
import { plagiarismService, PlagiarismResult } from '../services/plagiarism.service.js';
import { ok, fail } from '../utils/response.js';

/**
 * Analyze a single submission for plagiarism
 */
export async function analyzePlagiarism(req: AuthRequest, res: Response) {
  try {
    const { submissionId } = req.params;
    const { includeContent } = req.body;

    // Validate submission exists
    const submission = await AssignmentSubmission.findById(submissionId).lean();
    if (!submission) {
      return fail(res, 404, 'Submission not found');
    }

    // Get assignment details
    const assignment = await Assignment.findById(submission.assignment_id).lean();
    if (!assignment) {
      return fail(res, 404, 'Assignment not found');
    }

    // Check if user is authorized (teacher of the assignment or admin)
    if (!req.authUser?.roles.includes('admin') && 
        String(assignment.teacher_id) !== req.authUser?.id) {
      return fail(res, 403, 'Unauthorized to analyze this submission');
    }

    // Extract content from submission
    let submissionContent = '';
    if (submission.submission_link) {
      if (submission.submission_link.startsWith('text:')) {
        submissionContent = submission.submission_link.replace('text:', '');
      } else {
        submissionContent = `Submission from link: ${submission.submission_link}`;
      }
    }

    if (!submissionContent.trim()) {
      return fail(res, 400, 'No content available for plagiarism analysis');
    }

    // Perform plagiarism analysis
    const analysisResult = await plagiarismService.analyzeSubmission(
      String(submission._id),
      String(submission.assignment_id),
      submissionContent
    );

    // Store plagiarism result in submission (optional - for future reference)
    await AssignmentSubmission.findByIdAndUpdate(submissionId, {
      $set: {
        plagiarism_analysis: {
          ...analysisResult,
          analyzed_at: new Date(),
          analyzed_by: req.authUser?.id
        }
      }
    });

    // Return result
    const response = {
      submission_id: String(submission._id),
      assignment_id: String(submission.assignment_id),
      student_id: String(submission.student_id),
      plagiarism_analysis: analysisResult,
      content_preview: includeContent ? submissionContent.substring(0, 500) : undefined,
      analysis_timestamp: new Date(),
    };

    return ok(res, response);
  } catch (error) {
    console.error('Plagiarism analysis error:', error);
    return fail(res, 500, 'Failed to analyze submission for plagiarism');
  }
}

/**
 * Batch analyze multiple submissions for plagiarism
 */
export async function batchAnalyzePlagiarism(req: AuthRequest, res: Response) {
  try {
    const { assignmentId } = req.params;
    const { submissionIds } = req.body;

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return fail(res, 400, 'submissionIds array is required');
    }

    // Validate assignment exists and user is authorized
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return fail(res, 404, 'Assignment not found');
    }

    if (!req.authUser?.roles.includes('admin') && 
        String(assignment.teacher_id) !== req.authUser?.id) {
      return fail(res, 403, 'Unauthorized to analyze these submissions');
    }

    // Get all submissions
    const submissions = await AssignmentSubmission.find({
      _id: { $in: submissionIds.map(id => new Types.ObjectId(id)) },
      assignment_id: new Types.ObjectId(assignmentId)
    }).lean();

    if (submissions.length === 0) {
      return fail(res, 404, 'No valid submissions found');
    }

    // Prepare submissions for analysis
    const submissionsToAnalyze = submissions.map(sub => ({
      id: String(sub._id),
      assignmentId: String(sub.assignment_id),
      content: sub.submission_link?.startsWith('text:') 
        ? sub.submission_link.replace('text:', '')
        : `Submission from link: ${sub.submission_link || 'No content'}`
    }));

    // Perform batch analysis
    const analysisResults = await plagiarismService.batchAnalyze(submissionsToAnalyze);

    // Update submissions with plagiarism results
    const updatePromises = Array.from(analysisResults.entries()).map(async ([submissionId, result]) => {
      await AssignmentSubmission.findByIdAndUpdate(submissionId, {
        $set: {
          plagiarism_analysis: {
            ...result,
            analyzed_at: new Date(),
            analyzed_by: req.authUser?.id
          }
        }
      });
    });

    await Promise.all(updatePromises);

    // Format response
    const results = Array.from(analysisResults.entries()).map(([submissionId, analysis]) => {
      const submission = submissions.find(s => String(s._id) === submissionId);
      return {
        submission_id: submissionId,
        student_id: submission ? String(submission.student_id) : null,
        plagiarism_analysis: analysis,
        analysis_timestamp: new Date(),
      };
    });

    return ok(res, {
      assignment_id: assignmentId,
      total_analyzed: results.length,
      results,
    });
  } catch (error) {
    console.error('Batch plagiarism analysis error:', error);
    return fail(res, 500, 'Failed to analyze submissions for plagiarism');
  }
}

/**
 * Get plagiarism statistics for an assignment
 */
export async function getPlagiarismStats(req: AuthRequest, res: Response) {
  try {
    const { assignmentId } = req.params;

    // Validate assignment exists and user is authorized
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return fail(res, 404, 'Assignment not found');
    }

    if (!req.authUser?.roles.includes('admin') && 
        String(assignment.teacher_id) !== req.authUser?.id) {
      return fail(res, 403, 'Unauthorized to view plagiarism stats');
    }

    // Get all submissions with plagiarism analysis
    const submissions = await AssignmentSubmission.find({
      assignment_id: new Types.ObjectId(assignmentId),
      'plagiarism_analysis.analyzed_at': { $exists: true }
    }).lean();

    const totalAnalyzed = submissions.length;
    
    if (totalAnalyzed === 0) {
      return ok(res, {
        assignment_id: assignmentId,
        assignment_title: assignment.title,
        total_submissions: await AssignmentSubmission.countDocuments({ 
          assignment_id: new Types.ObjectId(assignmentId) 
        }),
        analyzed_submissions: 0,
        risk_distribution: {
          low: 0,
          medium: 0,
          high: 0
        },
        average_similarity_score: 0,
        high_risk_submissions: [],
      });
    }

    // Calculate statistics
    const riskDistribution = { low: 0, medium: 0, high: 0 };
    const similarityScores: number[] = [];
    const highRiskSubmissions: any[] = [];

    submissions.forEach((submission: any) => {
      const analysis = submission.plagiarism_analysis;
      if (!analysis) return;

      similarityScores.push(analysis.similarity_score);
      const riskLevel = analysis.overall_risk as keyof typeof riskDistribution;
      riskDistribution[riskLevel] = (riskDistribution[riskLevel] || 0) + 1;

      if (analysis.overall_risk === 'high') {
        highRiskSubmissions.push({
          submission_id: String(submission._id),
          student_id: String(submission.student_id),
          similarity_score: analysis.similarity_score,
          matched_sources_count: analysis.matched_sources.length,
        });
      }
    });

    const averageSimilarityScore = similarityScores.length > 0 
      ? similarityScores.reduce((sum, score) => sum + score, 0) / similarityScores.length 
      : 0;

    const response = {
      assignment_id: assignmentId,
      assignment_title: assignment.title,
      total_submissions: await AssignmentSubmission.countDocuments({ 
        assignment_id: new Types.ObjectId(assignmentId) 
      }),
      analyzed_submissions: totalAnalyzed,
      risk_distribution: riskDistribution,
      average_similarity_score: Math.round(averageSimilarityScore * 100) / 100,
      high_risk_submissions: highRiskSubmissions,
      analysis_completion_rate: (totalAnalyzed / submissions.length) * 100,
    };

    return ok(res, response);
  } catch (error) {
    console.error('Plagiarism stats error:', error);
    return fail(res, 500, 'Failed to get plagiarism statistics');
  }
}

/**
 * Get detailed plagiarism report for a submission
 */
export async function getPlagiarismReport(req: AuthRequest, res: Response) {
  try {
    const { submissionId } = req.params;

    // Get submission with plagiarism analysis
    const submission = await AssignmentSubmission.findById(submissionId).lean();
    if (!submission) {
      return fail(res, 404, 'Submission not found');
    }

    // Get assignment details for authorization
    const assignment = await Assignment.findById(submission.assignment_id).lean();
    if (!assignment) {
      return fail(res, 404, 'Assignment not found');
    }

    // Check authorization
    if (!req.authUser?.roles.includes('admin') && 
        String(assignment.teacher_id) !== req.authUser?.id) {
      return fail(res, 403, 'Unauthorized to view plagiarism report');
    }

    // Check if plagiarism analysis exists
    if (!submission.plagiarism_analysis) {
      return fail(res, 404, 'No plagiarism analysis found for this submission');
    }

    // Get student information
    const { User } = await import('../models/User.model.js');
    const student = await User.findById(
      submission.student_id
    ).select('name email').lean();

    // Format detailed report
    const report = {
      submission_id: String(submission._id),
      assignment_id: String(submission.assignment_id),
      assignment_title: assignment.title,
      student_info: student ? {
        name: student.name,
        email: student.email
      } : null,
      submission_details: {
        submitted_at: submission.submitted_at,
        grade: submission.grade,
        feedback: submission.feedback,
      },
      plagiarism_analysis: submission.plagiarism_analysis,
      report_generated_at: new Date(),
      generated_by: req.authUser?.id,
    };

    return ok(res, report);
  } catch (error) {
    console.error('Plagiarism report error:', error);
    return fail(res, 500, 'Failed to generate plagiarism report');
  }
}

/**
 * Flag submission for academic review
 */
export async function flagForReview(req: AuthRequest, res: Response) {
  try {
    const { submissionId } = req.params;
    const { reason, severity = 'medium', notes } = req.body;

    if (!reason) {
      return fail(res, 400, 'Reason for flagging is required');
    }

    // Get submission
    const submission = await AssignmentSubmission.findById(submissionId).lean();
    if (!submission) {
      return fail(res, 404, 'Submission not found');
    }

    // Get assignment details for authorization
    const assignment = await Assignment.findById(submission.assignment_id).lean();
    if (!assignment) {
      return fail(res, 404, 'Assignment not found');
    }

    // Check authorization
    if (!req.authUser?.roles.includes('admin') && 
        String(assignment.teacher_id) !== req.authUser?.id) {
      return fail(res, 403, 'Unauthorized to flag this submission');
    }

    // Update submission with academic review flag
    await AssignmentSubmission.findByIdAndUpdate(submissionId, {
      $set: {
        academic_review_flag: {
          flagged: true,
          flagged_at: new Date(),
          flagged_by: req.authUser?.id,
          reason,
          severity,
          notes,
          status: 'pending_review'
        }
      }
    });

    // Create notification for admin (if teacher flagged)
    if (!req.authUser?.roles.includes('admin')) {
      const { Notification } = await import('../models/Notification.model.js');
      const { notifyUser } = await import('../realtime.js');
      
      // Find admin users
      const { User } = await import('../models/User.model.js');
      const admins = await User.find({ roles: { $in: ['admin'] } }).select('_id').lean();
      
      if (admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: String(admin._id),
          title: 'Academic Review Required',
          message: `Submission flagged for review: ${reason}`,
          type: 'academic_review',
          target_path: `/teacher?tab=assignments`,
        }));

        const insertedDocs = await Notification.insertMany(notifications);
        
        // Send real-time notifications
        await Promise.all(
          insertedDocs.map((doc: any) => {
            const uid = String(doc.user_id);
            notifyUser(uid, 'notification', {
              id: String(doc._id),
              title: doc.title,
              message: doc.message,
              type: doc.type,
              target_path: (doc as any).target_path ?? null,
            });
          })
        );
      }
    }

    return ok(res, null, 'Submission flagged for academic review');
  } catch (error) {
    console.error('Flag for review error:', error);
    return fail(res, 500, 'Failed to flag submission for review');
  }
}

/**
 * Get all flagged submissions for admin review
 */
export async function getFlaggedSubmissions(req: AuthRequest, res: Response) {
  try {
    // Only admins can view flagged submissions
    if (!req.authUser?.roles.includes('admin')) {
      return fail(res, 403, 'Unauthorized');
    }

    const { status, severity, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter: any = { 'academic_review_flag.flagged': true };
    
    if (status) {
      filter['academic_review_flag.status'] = status;
    }
    
    if (severity) {
      filter['academic_review_flag.severity'] = severity;
    }

    // Get flagged submissions with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const submissions = await AssignmentSubmission.find(filter)
      .populate('assignment_id', 'title')
      .populate('student_id', 'name email')
      .sort({ 'academic_review_flag.flagged_at': -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await AssignmentSubmission.countDocuments(filter);

    const results = submissions.map((submission: any) => ({
      submission_id: String(submission._id),
      assignment: submission.assignment_id,
      student: submission.student_id,
      plagiarism_analysis: submission.plagiarism_analysis,
      academic_review_flag: submission.academic_review_flag,
      submitted_at: submission.submitted_at,
    }));

    return ok(res, {
      submissions: results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get flagged submissions error:', error);
    return fail(res, 500, 'Failed to get flagged submissions');
  }
}
