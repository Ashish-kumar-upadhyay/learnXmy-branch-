import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  FileText,
  Loader2,
  Zap,
  Target,
  Award,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from "lucide-react";
import { api, getAccessToken } from "@/lib/backendApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIGradingResult {
  suggested_grade: number;
  confidence_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  word_count: number;
  grammar_issues: string[];
  plagiarism_score?: number;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  submission_link?: string;
  grade?: number;
  feedback?: string;
  submitted_at?: string;
  status?: string;
}

interface AIGradingPanelProps {
  submissions: Submission[];
  assignmentTitle: string;
  maxScore: number;
  onGradingApplied?: (submissionId: string, grade: number, feedback: string) => void;
}

export default function AIGradingPanel({ 
  submissions, 
  assignmentTitle, 
  maxScore,
  onGradingApplied 
}: AIGradingPanelProps) {
  const [analyzingSubmissions, setAnalyzingSubmissions] = useState<Set<string>>(new Set());
  const [analysisResults, setAnalysisResults] = useState<Map<string, AIGradingResult>>(new Map());
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  // Analyze single submission
  const analyzeSubmission = async (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    setAnalyzingSubmissions(prev => new Set(prev).add(submissionId));

    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await api(`/api/ai-grading/submissions/${submissionId}/analyze`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ includeContent: true })
      });

      if (response.status === 200 && response.data) {
        const result = (response.data as any).analysis;
        setAnalysisResults(prev => new Map(prev).set(submissionId, result));
        toast.success("AI analysis completed! 🤖");
      } else {
        toast.error("Failed to analyze submission");
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error("AI analysis failed. Please try again.");
    } finally {
      setAnalyzingSubmissions(prev => {
        const next = new Set(prev);
        next.delete(submissionId);
        return next;
      });
    }
  };

  // Batch analyze all submissions
  const batchAnalyzeAll = async () => {
    const unanalyzedSubmissions = submissions.filter(s => !analysisResults.has(s.id));
    if (unanalyzedSubmissions.length === 0) {
      toast.info("All submissions already analyzed");
      return;
    }

    setBatchAnalyzing(true);

    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const submissionIds = unanalyzedSubmissions.map(s => s.id);
      const assignmentId = unanalyzedSubmissions[0]?.assignment_id;

      const response = await api(`/api/ai-grading/assignments/${assignmentId}/batch-analyze`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ submissionIds })
      });

      if (response.status === 200 && response.data) {
        const newResults = new Map<string, AIGradingResult>();
        (response.data as any).results.forEach((result: any) => {
          newResults.set(result.submission_id, result.analysis);
        });
        
        setAnalysisResults(prev => new Map([...prev, ...newResults]));
        toast.success(`Analyzed ${(response.data as any).total_analyzed} submissions! 🚀`);
      } else {
        toast.error("Batch analysis failed");
      }
    } catch (error) {
      console.error("Batch analysis error:", error);
      toast.error("Batch analysis failed. Please try again.");
    } finally {
      setBatchAnalyzing(false);
    }
  };

  // Apply AI grading to submission
  const applyAIGrading = async (submissionId: string, result: AIGradingResult) => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await api(`/api/ai-grading/submissions/${submissionId}/apply`, {
        method: "PUT",
        accessToken: token,
        body: JSON.stringify({
          suggestedGrade: result.suggested_grade,
          feedback: result.feedback,
          strengths: result.strengths,
          improvements: result.improvements,
          applyGrade: true,
          applyFeedback: true
        })
      });

      if (response.status === 200) {
        toast.success("AI grading applied successfully! ✅");
        if (onGradingApplied) {
          onGradingApplied(submissionId, result.suggested_grade, result.feedback);
        }
      } else {
        toast.error("Failed to apply AI grading");
      }
    } catch (error) {
      console.error("Apply AI grading error:", error);
      toast.error("Failed to apply AI grading");
    }
  };

  // Get grading insights
  const fetchInsights = async () => {
    if (submissions.length === 0) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const assignmentId = submissions[0]?.assignment_id;
      const response = await api(`/api/ai-grading/assignments/${assignmentId}/stats`, {
        method: "GET",
        accessToken: token
      });

      if (response.status === 200 && response.data) {
        setInsights(response.data);
        setShowInsights(true);
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      toast.error("Failed to load insights");
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-green-600";
    if (grade >= 80) return "text-blue-600";
    if (grade >= 70) return "text-yellow-600";
    if (grade >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Grading Assistant</h3>
            <p className="text-sm text-muted-foreground">
              {submissions.length} submissions • {analysisResults.size} analyzed
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Insights
          </Button>
          
          <Button
            onClick={batchAnalyzeAll}
            disabled={batchAnalyzing || submissions.filter(s => !analysisResults.has(s.id)).length === 0}
            className="gap-2"
          >
            {batchAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Insights Modal */}
      <AnimatePresence>
        {showInsights && insights && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInsights(false)}
          >
            <motion.div
              className="bg-card border border-border/20 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Grading Insights
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInsights(false)}
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Submissions</p>
                        <p className="text-2xl font-bold text-foreground">{insights.total_submissions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average Grade</p>
                        <p className="text-2xl font-bold text-foreground">{insights.average_grade.toFixed(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-foreground mb-3">Grade Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(insights.grade_distribution || {}).map(([grade, count]) => (
                    <div key={grade} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{grade}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count as number / insights.total_submissions) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">{String(count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.map((submission) => {
          const result = analysisResults.get(submission.id);
          const isAnalyzing = analyzingSubmissions.has(submission.id);

          return (
            <Card key={submission.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{submission.student_name || 'Unknown Student'}</h4>
                        <p className="text-sm text-muted-foreground">{submission.student_email}</p>
                      </div>
                    </div>

                    {submission.grade && (
                      <Badge variant="secondary" className="mb-2">
                        Current Grade: {submission.grade}/{maxScore}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!result && !isAnalyzing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => analyzeSubmission(submission.id)}
                        className="gap-2"
                      >
                        <Brain className="w-4 h-4" />
                        Analyze
                      </Button>
                    )}

                    {isAnalyzing && (
                      <Button size="sm" disabled className="gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </Button>
                    )}

                    {result && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSubmission(
                            selectedSubmission === submission.id ? null : submission.id
                          )}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {selectedSubmission === submission.id ? 'Hide' : 'View'}
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => applyAIGrading(submission.id, result)}
                          className="gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis Result */}
                <AnimatePresence>
                  {result && selectedSubmission === submission.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border/20"
                    >
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="feedback">Feedback</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${getGradeColor(result.suggested_grade)}`}>
                                {result.suggested_grade}/{maxScore}
                              </div>
                              <p className="text-sm text-muted-foreground">Suggested Grade</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getConfidenceColor(result.confidence_score)}`} />
                                <span className="text-2xl font-bold text-foreground">{result.confidence_score}%</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Confidence</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">{result.word_count}</div>
                              <p className="text-sm text-muted-foreground">Word Count</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Progress value={result.confidence_score} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                              AI Confidence Level
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-4">
                          <div>
                            <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                              <ThumbsUp className="w-4 h-4 text-green-500" />
                              Strengths
                            </h5>
                            <ul className="space-y-1">
                              {result.strengths.map((strength, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                              <ThumbsDown className="w-4 h-4 text-orange-500" />
                              Areas for Improvement
                            </h5>
                            <ul className="space-y-1">
                              {result.improvements.map((improvement, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-orange-500 mt-0.5">•</span>
                                  {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {result.grammar_issues.length > 0 && (
                            <div>
                              <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                Grammar Issues
                              </h5>
                              <ul className="space-y-1">
                                {result.grammar_issues.map((issue, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-yellow-500 mt-0.5">•</span>
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="feedback" className="space-y-4">
                          <div>
                            <h5 className="font-medium text-foreground mb-2">AI Feedback</h5>
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {result.feedback}
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-8">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Submissions Found</h3>
          <p className="text-sm text-muted-foreground">
            There are no submissions to analyze for this assignment yet.
          </p>
        </div>
      )}
    </div>
  );
}
