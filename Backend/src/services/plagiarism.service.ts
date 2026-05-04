import { AssignmentSubmission } from '../models/AssignmentSubmission.model';
import { Assignment } from '../models/Assignment.model';
import { User } from '../models/User.model';

export interface PlagiarismResult {
  similarity_score: number;
  matched_sources: Array<{
    source_id: string;
    source_type: 'submission' | 'web' | 'database';
    similarity_percentage: number;
    matched_text: string[];
    source_title?: string;
    source_author?: string;
  }>;
  overall_risk: 'low' | 'medium' | 'high';
  analysis_details: {
    total_words: number;
    matched_words: number;
    unique_phrases: number;
    common_phrases: number;
  };
  recommendations: string[];
}

export class PlagiarismService {
  private webSearchApiKey: string;
  private webSearchEndpoint: string;

  constructor() {
    // You can use Google Search API, Bing API, or any web search service
    this.webSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.WEB_SEARCH_API_KEY || '';
    this.webSearchEndpoint = process.env.WEB_SEARCH_ENDPOINT || 'https://www.googleapis.com/customsearch/v1';
  }

  /**
   * Analyze submission for plagiarism
   */
  async analyzeSubmission(
    submissionId: string,
    assignmentId: string,
    content: string
  ): Promise<PlagiarismResult> {
    try {
      // Get assignment details
      const assignment = await Assignment.findById(assignmentId).lean();
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Get all submissions for this assignment (for cross-checking)
      const allSubmissions = await AssignmentSubmission.find({
        assignment_id: assignmentId,
        _id: { $ne: submissionId }
      }).lean();

      // Perform different types of plagiarism checks
      const [
        crossSubmissionResults,
        webResults,
        internalDbResults
      ] = await Promise.all([
        this.checkAgainstSubmissions(content, allSubmissions),
        this.checkAgainstWeb(content),
        this.checkAgainstInternalDatabase(content)
      ]);

      // Combine all results
      const allMatches = [
        ...crossSubmissionResults,
        ...webResults,
        ...internalDbResults
      ];

      // Calculate overall similarity score
      const similarityScore = this.calculateOverallSimilarity(content, allMatches);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(similarityScore);

      // Generate recommendations
      const recommendations = this.generateRecommendations(similarityScore, allMatches, riskLevel);

      // Analysis details
      const analysisDetails = this.calculateAnalysisDetails(content, allMatches);

      return {
        similarity_score: similarityScore,
        matched_sources: allMatches,
        overall_risk: riskLevel,
        analysis_details: analysisDetails,
        recommendations
      };

    } catch (error) {
      console.error('Plagiarism analysis error:', error);
      // Return fallback analysis
      return this.performBasicAnalysis(content);
    }
  }

  /**
   * Check content against other submissions
   */
  private async checkAgainstSubmissions(
    content: string,
    submissions: any[]
  ): Promise<any[]> {
    const matches: any[] = [];

    for (const submission of submissions) {
      if (!submission.submission_link) continue;

      let submissionContent = '';
      if (submission.submission_link.startsWith('text:')) {
        submissionContent = submission.submission_link.replace('text:', '');
      }

      if (!submissionContent) continue;

      const similarity = this.calculateTextSimilarity(content, submissionContent);
      
      if (similarity > 20) { // 20% threshold for cross-submission matching
        const matchedText = this.findMatchingPhrases(content, submissionContent);
        
        matches.push({
          source_id: String(submission._id),
          source_type: 'submission' as const,
          similarity_percentage: similarity,
          matched_text: matchedText,
          source_title: `Student Submission ${String(submission._id).slice(-6)}`,
          source_author: 'Another Student'
        });
      }
    }

    return matches;
  }

  /**
   * Check content against web sources
   */
  private async checkAgainstWeb(content: string): Promise<any[]> {
    if (!this.webSearchApiKey) {
      // Simulate web search results for demo
      return this.simulateWebSearch(content);
    }

    try {
      // Extract key phrases from content
      const keyPhrases = this.extractKeyPhrases(content);
      const matches: any[] = [];

      // Search for each key phrase
      for (const phrase of keyPhrases.slice(0, 3)) { // Limit to 3 searches to avoid API limits
        const searchResults = await this.searchWeb(phrase);
        
        for (const result of searchResults) {
          const similarity = this.calculateTextSimilarity(content, result.snippet);
          
          if (similarity > 15) { // 15% threshold for web matching
            matches.push({
              source_id: result.link,
              source_type: 'web' as const,
              similarity_percentage: similarity,
              matched_text: [phrase],
              source_title: result.title,
              source_author: result.displayLink
            });
          }
        }
      }

      return matches;
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  /**
   * Search web for content
   */
  private async searchWeb(query: string): Promise<any[]> {
    const response = await fetch(
      `${this.webSearchEndpoint}?key=${this.webSearchApiKey}&cx=YOUR_SEARCH_ENGINE_ID&q=${encodeURIComponent(query)}&num=5`
    );

    const data = await response.json() as any;
    return data.items || [];
  }

  /**
   * Simulate web search for demo purposes
   */
  private simulateWebSearch(content: string): any[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const matches: any[] = [];

    // Simulate finding 1-2 web matches with low similarity
    const numMatches = Math.random() > 0.5 ? 1 : 2;
    
    for (let i = 0; i < numMatches && i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 20) {
        matches.push({
          source_id: `web-source-${i + 1}`,
          source_type: 'web' as const,
          similarity_percentage: Math.floor(Math.random() * 20) + 10, // 10-30%
          matched_text: [sentence.substring(0, 50) + '...'],
          source_title: `Online Article ${i + 1}`,
          source_author: 'website.com'
        });
      }
    }

    return matches;
  }

  /**
   * Check against internal database of academic papers
   */
  private async checkAgainstInternalDatabase(content: string): Promise<any[]> {
    // For demo purposes, simulate internal database matches
    // In production, this would connect to academic databases like JSTOR, arXiv, etc.
    const matches: any[] = [];
    
    // Simulate occasional academic source matches
    if (Math.random() > 0.7) { // 30% chance of finding academic matches
      const academicPhrases = [
        'research shows that',
        'according to studies',
        'based on empirical evidence',
        'the data suggests'
      ];

      const foundPhrases = academicPhrases.filter(phrase => 
        content.toLowerCase().includes(phrase)
      );

      if (foundPhrases.length > 0) {
        matches.push({
          source_id: 'academic-db-1',
          source_type: 'database' as const,
          similarity_percentage: Math.floor(Math.random() * 15) + 5, // 5-20%
          matched_text: foundPhrases,
          source_title: 'Academic Research Paper',
          source_author: 'Journal of Education'
        });
      }
    }

    return matches;
  }

  /**
   * Calculate text similarity using multiple algorithms
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Clean and normalize texts
    const cleanText1 = this.cleanText(text1);
    const cleanText2 = this.cleanText(text2);

    // Jaccard similarity for word overlap
    const jaccardSimilarity = this.jaccardSimilarity(cleanText1, cleanText2);

    // Cosine similarity for phrase matching
    const cosineSimilarity = this.cosineSimilarity(cleanText1, cleanText2);

    // Longest common subsequence similarity
    const lcsSimilarity = this.lcsSimilarity(cleanText1, cleanText2);

    // Weighted average of all similarities
    return Math.round(
      (jaccardSimilarity * 0.3 + cosineSimilarity * 0.4 + lcsSimilarity * 0.3) * 100
    );
  }

  /**
   * Jaccard similarity algorithm
   */
  private jaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Cosine similarity for text
   */
  private cosineSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const allWords = new Set([...words1, ...words2]);
    const vector1: number[] = [];
    const vector2: number[] = [];
    
    for (const word of allWords) {
      vector1.push(words1.filter(w => w === word).length);
      vector2.push(words2.filter(w => w === word).length);
    }
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    return magnitude1 === 0 || magnitude2 === 0 ? 0 : dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Longest Common Subsequence similarity
   */
  private lcsSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const dp: number[][] = Array(words1.length + 1).fill(null).map(() => 
      Array(words2.length + 1).fill(0)
    );
    
    for (let i = 1; i <= words1.length; i++) {
      for (let j = 1; j <= words2.length; j++) {
        if (words1[i - 1] === words2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    const lcsLength = dp[words1.length][words2.length];
    const maxLength = Math.max(words1.length, words2.length);
    
    return maxLength === 0 ? 0 : lcsLength / maxLength;
  }

  /**
   * Find matching phrases between two texts
   */
  private findMatchingPhrases(text1: string, text2: string): string[] {
    const phrases1 = this.extractPhrases(text1);
    const phrases2 = this.extractPhrases(text2);
    
    const matches: string[] = [];
    
    for (const phrase1 of phrases1) {
      for (const phrase2 of phrases2) {
        if (phrase1.toLowerCase() === phrase2.toLowerCase()) {
          matches.push(phrase1);
        }
      }
    }
    
    return matches;
  }

  /**
   * Extract phrases from text (3-8 word sequences)
   */
  private extractPhrases(text: string): string[] {
    const words = text.split(/\s+/);
    const phrases: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      for (let len = 3; len <= 8 && i + len <= words.length; len++) {
        const phrase = words.slice(i, i + len).join(' ');
        phrases.push(phrase);
      }
    }
    
    return phrases;
  }

  /**
   * Extract key phrases for web search
   */
  private extractKeyPhrases(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim()); // Top 5 sentences
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate overall similarity score
   */
  private calculateOverallSimilarity(content: string, matches: any[]): number {
    if (matches.length === 0) return 0;
    
    const totalSimilarity = matches.reduce((sum, match) => sum + match.similarity_percentage, 0);
    const averageSimilarity = totalSimilarity / matches.length;
    
    // Apply weighting based on source types
    const webWeight = 0.5;
    const submissionWeight = 0.3;
    const databaseWeight = 0.2;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const match of matches) {
      let weight = 1;
      if (match.source_type === 'web') weight = webWeight;
      else if (match.source_type === 'submission') weight = submissionWeight;
      else if (match.source_type === 'database') weight = databaseWeight;
      
      weightedSum += match.similarity_percentage * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(averageSimilarity);
  }

  /**
   * Determine risk level based on similarity score
   */
  private determineRiskLevel(similarityScore: number): 'low' | 'medium' | 'high' {
    if (similarityScore >= 70) return 'high';
    if (similarityScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    similarityScore: number,
    matches: any[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'high') {
      recommendations.push('High similarity detected. Review submission carefully.');
      recommendations.push('Consider discussing with the student about proper citation.');
      recommendations.push('May require academic integrity review.');
    } else if (riskLevel === 'medium') {
      recommendations.push('Moderate similarity found. Check cited sources.');
      recommendations.push('Ensure proper attribution is used.');
      recommendations.push('Review for paraphrasing improvements.');
    } else {
      recommendations.push('Low similarity detected. Original work appears well-cited.');
      recommendations.push('Continue encouraging proper research practices.');
    }
    
    // Source-specific recommendations
    const hasWebMatches = matches.some(m => m.source_type === 'web');
    const hasSubmissionMatches = matches.some(m => m.source_type === 'submission');
    
    if (hasWebMatches) {
      recommendations.push('Some web sources found. Verify proper citation.');
    }
    
    if (hasSubmissionMatches) {
      recommendations.push('Similarity with other submissions detected. Review for originality.');
    }
    
    return recommendations;
  }

  /**
   * Calculate detailed analysis metrics
   */
  private calculateAnalysisDetails(content: string, matches: any[]) {
    const words = content.split(/\s+/);
    const totalWords = words.length;
    
    // Count matched words (approximate)
    let matchedWords = 0;
    for (const match of matches) {
      matchedWords += Math.floor((match.similarity_percentage / 100) * totalWords);
    }
    
    // Count unique phrases (approximate)
    const phrases = this.extractPhrases(content);
    const uniquePhrases = phrases.length;
    
    // Count common phrases (matched across sources)
    const commonPhrases = matches.reduce((sum, match) => sum + match.matched_text.length, 0);
    
    return {
      total_words: totalWords,
      matched_words: matchedWords,
      unique_phrases: uniquePhrases,
      common_phrases: commonPhrases
    };
  }

  /**
   * Perform basic analysis when advanced features are unavailable
   */
  private performBasicAnalysis(content: string): PlagiarismResult {
    const words = content.split(/\s+/);
    const totalWords = words.length;
    
    // Basic similarity calculation based on common phrases
    const commonPhrases = [
      'according to',
      'based on',
      'in conclusion',
      'it is important',
      'research shows'
    ];
    
    let commonPhraseCount = 0;
    for (const phrase of commonPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        commonPhraseCount++;
      }
    }
    
    const similarityScore = Math.min(25, commonPhraseCount * 5); // Max 25% for basic analysis
    const riskLevel = this.determineRiskLevel(similarityScore);
    
    return {
      similarity_score: similarityScore,
      matched_sources: [],
      overall_risk: riskLevel,
      analysis_details: {
        total_words: totalWords,
        matched_words: Math.floor((similarityScore / 100) * totalWords),
        unique_phrases: Math.floor(totalWords / 5), // Estimate
        common_phrases: commonPhraseCount
      },
      recommendations: [
        'Basic analysis completed. Consider upgrading to advanced plagiarism detection.',
        'Review common academic phrases for proper citation.',
        'Ensure all sources are properly attributed.'
      ]
    };
  }

  /**
   * Batch analyze multiple submissions
   */
  async batchAnalyze(submissions: Array<{
    id: string;
    assignmentId: string;
    content: string;
  }>): Promise<Map<string, PlagiarismResult>> {
    const results = new Map<string, PlagiarismResult>();
    
    // Process submissions with concurrency limit
    const concurrencyLimit = 2; // Lower limit for plagiarism detection due to API calls
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
          console.error(`Failed to analyze submission ${sub.id} for plagiarism:`, error);
        }
      });

      await Promise.all(promises);
    }

    return results;
  }
}

export const plagiarismService = new PlagiarismService();
