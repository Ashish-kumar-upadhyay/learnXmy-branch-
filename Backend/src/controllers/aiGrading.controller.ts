import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types.js';
import { AssignmentSubmission } from '../models/AssignmentSubmission.model.js';
import { Assignment } from '../models/Assignment.model.js';
import { User } from '../models/User.model.js';
import { aiGradingService, AIGradingResult } from '../services/aiGrading.service.js';
import { ok, fail } from '../utils/response.js';

/**
 * Analyze a single submission with AI
 */
export async function analyzeSubmission(req: AuthRequest, res: Response) {
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
      // If it's a text submission or has extractable content
      if (submission.submission_link.startsWith('text:')) {
        submissionContent = submission.submission_link.replace('text:', '');
      } else {
        // For file submissions, you might need to implement file extraction
        // For now, we'll use a placeholder
        submissionContent = `Submission from link: ${submission.submission_link}`;
      }
    }

    if (!submissionContent.trim()) {
      return fail(res, 400, 'No content available for analysis');
    }

    // Perform AI analysis
    const analysisResult = await aiGradingService.analyzeSubmission(
      String(submission._id),
      String(submission.assignment_id),
      submissionContent
    );

    // Return result
    const response = {
      submission_id: String(submission._id),
      assignment_id: String(submission.assignment_id),
      student_id: String(submission.student_id),
      analysis: analysisResult,
      current_grade: submission.grade,
      current_feedback: submission.feedback,
      content_preview: includeContent ? submissionContent.substring(0, 500) : undefined,
    };

    return ok(res, response);
  } catch (error) {
    console.error('AI analysis error:', error);
    return fail(res, 500, 'Failed to analyze submission');
  }
}

/**
 * Batch analyze multiple submissions
 */
export async function batchAnalyzeSubmissions(req: AuthRequest, res: Response) {
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
    const analysisResults = await aiGradingService.batchAnalyze(submissionsToAnalyze);

    // Format response
    const results = Array.from(analysisResults.entries()).map(([submissionId, analysis]) => {
      const submission = submissions.find(s => String(s._id) === submissionId);
      return {
        submission_id: submissionId,
        student_id: submission ? String(submission.student_id) : null,
        analysis,
        current_grade: submission?.grade,
        current_feedback: submission?.feedback,
      };
    });

    return ok(res, {
      assignment_id: assignmentId,
      total_analyzed: results.length,
      results,
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    return fail(res, 500, 'Failed to analyze submissions');
  }
}

/**
 * Get grading statistics for an assignment
 */
export async function getGradingStats(req: AuthRequest, res: Response) {
  try {
    const { assignmentId } = req.params;

    // Validate assignment exists and user is authorized
    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return fail(res, 404, 'Assignment not found');
    }

    if (!req.authUser?.roles.includes('admin') && 
        String(assignment.teacher_id) !== req.authUser?.id) {
      return fail(res, 403, 'Unauthorized to view grading stats');
    }

    // Get statistics
    const stats = await aiGradingService.getGradingStats(assignmentId);

    // Add assignment details
    const response = {
      assignment_id: assignmentId,
      assignment_title: assignment.title,
      max_score: assignment.max_score || 100,
      total_submissions: await AssignmentSubmission.countDocuments({ 
        assignment_id: new Types.ObjectId(assignmentId) 
      }),
      graded_submissions: stats.totalSubmissions,
      ...stats,
    };

    return ok(res, response);
  } catch (error) {
    console.error('Grading stats error:', error);
    return fail(res, 500, 'Failed to get grading statistics');
  }
}

/**
 * Apply AI suggested grade and feedback
 */
export async function applyAIGrading(req: AuthRequest, res: Response) {
  try {
    const { submissionId } = req.params;
    const { 
      suggestedGrade, 
      feedback, 
      strengths, 
      improvements,
      applyGrade = true,
      applyFeedback = true 
    } = req.body;

    // Validate submission exists
    const submission = await AssignmentSubmission.findById(submissionId).populate('assignment_id');
    if (!submission) {
      return fail(res, 404, 'Submission not found');
    }

    // Check authorization
    const assignment = submission.assignment_id as any;
    if (!req.authUser?.roles.includes('admin') && 
        String(assignment.teacher_id) !== req.authUser?.id) {
      return fail(res, 403, 'Unauthorized to grade this submission');
    }

    // Prepare update data
    const updateData: any = { graded_at: new Date() };
    
    if (applyGrade && suggestedGrade !== undefined) {
      updateData.grade = suggestedGrade;
    }
    
    if (applyFeedback) {
      let fullFeedback = feedback || '';
      
      // Add strengths and improvements to feedback if provided
      if (strengths?.length > 0) {
        fullFeedback += '\n\n**Strengths:**\n' + strengths.map((s: string) => `• ${s}`).join('\n');
      }
      
      if (improvements?.length > 0) {
        fullFeedback += '\n\n**Areas for Improvement:**\n' + improvements.map((i: string) => `• ${i}`).join('\n');
      }
      
      updateData.feedback = fullFeedback.trim();
    }

    // Update submission
    const updatedSubmission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      { $set: updateData },
      { new: true }
    ).lean();

    // Create notification for student
    const studentId = String(submission.student_id);
    if (applyGrade || applyFeedback) {
      const { Notification } = await import('../models/Notification.model.js');
      const { notifyUser } = await import('../realtime.js');
      
      const doc = await Notification.create({
        user_id: studentId,
        title: 'Assignment graded with AI assistance',
        message: `Your assignment "${assignment.title}" has been reviewed using AI assistance.`,
        type: 'assignment_review',
        target_path: '/assignments',
      });
      
      notifyUser(studentId, 'notification', {
        id: String(doc._id),
        title: doc.title,
        message: doc.message,
        type: doc.type,
        target_path: (doc as any).target_path ?? null,
      });
    }

    return ok(res, updatedSubmission, 'AI grading applied successfully');
  } catch (error) {
    console.error('Apply AI grading error:', error);
    return fail(res, 500, 'Failed to apply AI grading');
  }
}

/**
 * Get AI grading insights for a class
 */
export async function getClassGradingInsights(req: AuthRequest, res: Response) {
  try {
    const { classId } = req.params;
    const { timeframe = '30d' } = req.query;

    // Check authorization (teacher or admin)
    if (!req.authUser?.roles.includes('admin') && !req.authUser?.roles.includes('teacher')) {
      return fail(res, 403, 'Unauthorized');
    }

    // Calculate date range
    const days = parseInt(timeframe as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get assignments for the class
    const assignments = await Assignment.find({
      batch: classId,
      created_at: { $gte: startDate }
    }).select('_id title max_score created_at').lean();

    const assignmentIds = assignments.map(a => new Types.ObjectId(String(a._id)));

    // Get all submissions for these assignments
    const submissions = await AssignmentSubmission.find({
      assignment_id: { $in: assignmentIds },
      grade: { $exists: true }
    }).lean();

    // Calculate insights
    const totalSubmissions = submissions.length;
    const grades = submissions.map(s => s.grade).filter(g => g !== null && g !== undefined) as number[];
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length 
      : 0;

    // Performance trends
    const performanceByAssignment = await Promise.all(
      assignments.map(async (assignment) => {
        const assignmentSubmissions = submissions.filter(
          s => String(s.assignment_id) === String(assignment._id)
        );
        const assignmentGrades = assignmentSubmissions
          .map(s => s.grade)
          .filter(g => g !== null && g !== undefined) as number[];
        
        return {
          assignment_id: String(assignment._id),
          assignment_title: assignment.title,
          max_score: assignment.max_score || 100,
          submissions: assignmentSubmissions.length,
          average_grade: assignmentGrades.length > 0 
            ? assignmentGrades.reduce((sum, grade) => sum + grade, 0) / assignmentGrades.length 
            : 0,
          graded_count: assignmentGrades.length,
        };
      })
    );

    const insights = {
      class_id: classId,
      timeframe: `${days} days`,
      total_assignments: assignments.length,
      total_submissions: totalSubmissions,
      average_grade: averageGrade,
      performance_by_assignment: performanceByAssignment,
      grading_completion_rate: totalSubmissions > 0 ? (grades.length / totalSubmissions) * 100 : 0,
    };

    return ok(res, insights);
  } catch (error) {
    console.error('Class insights error:', error);
    return fail(res, 500, 'Failed to get class insights');
  }
}
