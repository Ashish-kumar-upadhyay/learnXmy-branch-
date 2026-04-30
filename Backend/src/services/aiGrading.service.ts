import { AssignmentSubmission } from '../models/AssignmentSubmission.model';
import { Assignment } from '../models/Assignment.model';
import { User } from '../models/User.model';

export interface AIGradingResult {
  suggested_grade: number;
  confidence_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  word_count: number;
  grammar_issues: string[];
  plagiarism_score?: number;
}

export interface GradingCriteria {
  max_score: number;
  rubric?: {
    content: number;
    structure: number;
    grammar: number;
    creativity: number;
  };
  requirements?: string[];
}

class AIGradingService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    // You can use OpenAI, Claude, or any other AI service
    this.apiKey = process.env.OPENAI_API_KEY || process.env.AI_GRADING_API_KEY || '';
    this.apiEndpoint = process.env.AI_GRADING_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Analyze submission content using AI
   */
  async analyzeSubmission(
    submissionId: string,
    assignmentId: string,
    submissionContent: string
  ): Promise<AIGradingResult> {
    try {
      // Get assignment details for context
      const assignment = await Assignment.findById(assignmentId).lean();
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Get submission details
      const submission = await AssignmentSubmission.findById(submissionId).lean();
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Prepare grading criteria
      const criteria: GradingCriteria = {
        max_score: assignment.max_score || 100,
        requirements: assignment.description ? [assignment.description] : [],
      };

      // AI analysis prompt
      const prompt = this.buildGradingPrompt(submissionContent, criteria, assignment);

      // Call AI API (simulated for now - replace with actual API call)
      const aiResult = await this.callAIAPI(prompt);

      // Extract and format results
      return this.formatAIResult(aiResult, submissionContent);

    } catch (error) {
      console.error('AI grading error:', error);
      // Fallback to basic analysis
      return this.performBasicAnalysis(submissionContent);
    }
  }

  /**
   * Build the grading prompt for AI
   */
  private buildGradingPrompt(
    content: string,
    criteria: GradingCriteria,
    assignment: any
  ): string {
    return `
You are an expert educational grader. Analyze the following assignment submission and provide detailed feedback.

Assignment Details:
- Title: ${assignment.title || 'Unknown'}
- Description: ${assignment.description || 'No description provided'}
- Max Score: ${criteria.max_score}

Student Submission:
${content}

Please analyze and provide:
1. A suggested grade (0-${criteria.max_score})
2. Confidence score (0-100) for your grading
3. Detailed feedback (150-200 words)
4. Key strengths (3-5 points)
5. Areas for improvement (3-5 points)
6. Grammar and spelling issues found
7. Word count analysis

Respond in JSON format:
{
  "suggested_grade": number,
  "confidence_score": number,
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "grammar_issues": ["string"],
  "word_count": number
}

Be fair, constructive, and educational in your assessment.
    `;
  }

  /**
   * Call AI API for grading analysis
   */
  private async callAIAPI(prompt: string): Promise<any> {
    if (!this.apiKey) {
      // Simulate AI response for demo purposes
      return this.simulateAIResponse(prompt);
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational grader. Always respond in valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('AI API call failed:', error);
      return this.simulateAIResponse(prompt);
    }
  }

  /**
   * Simulate AI response for demo/testing
   */
  private simulateAIResponse(prompt: string): any {
    const wordCount = prompt.split(' ').length - 50; // Approximate word count
    const suggestedGrade = Math.min(85, Math.max(60, Math.floor(wordCount / 10)));
    
    return {
      suggested_grade: suggestedGrade,
      confidence_score: 75,
      feedback: `The submission demonstrates good understanding of the topic. The content is well-structured and addresses most requirements of the assignment. Consider adding more specific examples to strengthen your arguments. Overall, this is a solid effort that meets the basic criteria.`,
      strengths: [
        "Clear structure and organization",
        "Good understanding of core concepts",
        "Appropriate length and detail",
        "Logical flow of ideas"
      ],
      improvements: [
        "Add more specific examples",
        "Include citations if applicable",
        "Consider counterarguments",
        "Expand on conclusion"
      ],
      grammar_issues: [
        "Minor punctuation issues",
        "Some sentence structure variations needed"
      ],
      word_count: wordCount
    };
  }

  /**
   * Format AI result into standardized format
   */
  private formatAIResult(aiResult: any, content: string): AIGradingResult {
    return {
      suggested_grade: aiResult.suggested_grade || 75,
      confidence_score: aiResult.confidence_score || 70,
      feedback: aiResult.feedback || 'Good effort overall.',
      strengths: aiResult.strengths || [],
      improvements: aiResult.improvements || [],
      word_count: aiResult.word_count || content.split(' ').length,
      grammar_issues: aiResult.grammar_issues || [],
    };
  }

  /**
   * Perform basic analysis when AI is unavailable
   */
  private performBasicAnalysis(content: string): AIGradingResult {
    const wordCount = content.split(' ').length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;

    // Basic grading heuristics
    let suggestedGrade = 70; // Base grade
    
    if (wordCount > 200) suggestedGrade += 10;
    if (wordCount > 500) suggestedGrade += 10;
    if (avgWordsPerSentence > 10 && avgWordsPerSentence < 25) suggestedGrade += 5;
    if (content.includes('because') || content.includes('therefore')) suggestedGrade += 5;

    return {
      suggested_grade: Math.min(100, suggestedGrade),
      confidence_score: 50,
      feedback: `Basic analysis completed. Submission contains ${wordCount} words with an average of ${avgWordsPerSentence.toFixed(1)} words per sentence. Consider expanding your analysis and adding more supporting details.`,
      strengths: [`Submitted content of ${wordCount} words`],
      improvements: ['Add more detail and examples', 'Include supporting evidence'],
      word_count: wordCount,
      grammar_issues: [],
    };
  }

  /**
   * Batch grade multiple submissions
   */
  async batchAnalyze(submissions: Array<{
    id: string;
    assignmentId: string;
    content: string;
  }>): Promise<Map<string, AIGradingResult>> {
    const results = new Map<string, AIGradingResult>();
    
    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const batches = [];
    
    for (let i = 0; i < submissions.length; i += concurrencyLimit) {
      batches.push(submissions.slice(i, i + concurrencyLimit));
    }

    for (const batch of batches) {
      const promises = batch.map(async (sub) => {
        try {
          const result = await this.analyzeSubmission(sub.id, sub.assignmentId, sub.content);
          results.set(sub.id, result);
        } catch (error) {
          console.error(`Failed to analyze submission ${sub.id}:`, error);
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Get grading statistics for an assignment
   */
  async getGradingStats(assignmentId: string): Promise<{
    totalSubmissions: number;
    averageGrade: number;
    gradeDistribution: Record<string, number>;
    commonIssues: string[];
  }> {
    const submissions = await AssignmentSubmission.find({
      assignment_id: assignmentId,
      grade: { $exists: true }
    }).lean();

    const totalSubmissions = submissions.length;
    const grades = submissions.map(s => s.grade).filter(g => g !== null && g !== undefined) as number[];
    
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length 
      : 0;

    // Grade distribution
    const gradeDistribution = {
      'A (90-100)': grades.filter(g => g >= 90).length,
      'B (80-89)': grades.filter(g => g >= 80 && g < 90).length,
      'C (70-79)': grades.filter(g => g >= 70 && g < 80).length,
      'D (60-69)': grades.filter(g => g >= 60 && g < 70).length,
      'F (0-59)': grades.filter(g => g < 60).length,
    };

    // Common issues (from feedback analysis)
    const feedbackTexts = submissions.map(s => s.feedback).filter(Boolean) as string[];
    const commonIssues = this.extractCommonIssues(feedbackTexts);

    return {
      totalSubmissions,
      averageGrade,
      gradeDistribution,
      commonIssues,
    };
  }

  /**
   * Extract common issues from feedback texts
   */
  private extractCommonIssues(feedbacks: string[]): string[] {
    const issueKeywords = [
      'grammar', 'spelling', 'citation', 'structure', 'evidence',
      'analysis', 'conclusion', 'introduction', 'examples', 'clarity'
    ];

    const issueCounts = new Map<string, number>();
    
    feedbacks.forEach(feedback => {
      const lowerFeedback = feedback.toLowerCase();
      issueKeywords.forEach(keyword => {
        if (lowerFeedback.includes(keyword)) {
          issueCounts.set(keyword, (issueCounts.get(keyword) || 0) + 1);
        }
      });
    });

    return Array.from(issueCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
  }
}

export const aiGradingService = new AIGradingService();
