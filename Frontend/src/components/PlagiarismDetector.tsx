import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Flag, 
  Shield, 
  FileText,
  Loader2,
  TrendingUp,
  Globe,
  Users,
  Database,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Download
} from "lucide-react";
import { api, getAccessToken } from "@/lib/backendApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlagiarismResult {
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

interface PlagiarismDetectorProps {
  submissions: Submission[];
  assignmentTitle: string;
  onFlagged?: (submissionId: string) => void;
}

export default function PlagiarismDetector({ 
  submissions, 
  assignmentTitle,
  onFlagged 
}: PlagiarismDetectorProps) {
  const [analyzingSubmissions, setAnalyzingSubmissions] = useState<Set<string>>(new Set());
  const [analysisResults, setAnalysisResults] = useState<Map<string, PlagiarismResult>>(new Map());
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [flagging, setFlagging] = useState<string | null>(null);

  // Analyze single submission for plagiarism
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

      const response = await api(`/api/plagiarism/submissions/${submissionId}/analyze`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ includeContent: true })
      });

      if (response.status === 200 && response.data) {
        const result = (response.data as any).plagiarism_analysis;
        setAnalysisResults(prev => new Map(prev).set(submissionId, result));
        toast.success("Plagiarism analysis completed! 🔍");
      } else {
        toast.error("Failed to analyze submission");
      }
    } catch (error) {
      console.error("Plagiarism analysis error:", error);
      toast.error("Plagiarism analysis failed. Please try again.");
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

      const response = await api(`/api/plagiarism/assignments/${assignmentId}/batch-analyze`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ submissionIds })
      });

      if (response.status === 200 && response.data) {
        const newResults = new Map<string, PlagiarismResult>();
        (response.data as any).results.forEach((result: any) => {
          newResults.set(result.submission_id, result.plagiarism_analysis);
        });
        
        setAnalysisResults(prev => new Map([...prev, ...newResults]));
        toast.success(`Analyzed ${(response.data as any).total_analyzed} submissions! 🚀`);
      } else {
        toast.error("Batch analysis failed");
      }
    } catch (error) {
      console.error("Batch plagiarism analysis error:", error);
      toast.error("Batch analysis failed. Please try again.");
    } finally {
      setBatchAnalyzing(false);
    }
  };

  // Get plagiarism statistics
  const fetchStats = async () => {
    if (submissions.length === 0) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const assignmentId = submissions[0]?.assignment_id;
      const response = await api(`/api/plagiarism/assignments/${assignmentId}/stats`, {
        method: "GET",
        accessToken: token
      });

      if (response.status === 200 && response.data) {
        setStats(response.data);
        setShowStats(true);
      }
    } catch (error) {
      console.error("Failed to fetch plagiarism stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  // Flag submission for review
  const flagSubmission = async (submissionId: string, reason: string) => {
    setFlagging(submissionId);

    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await api(`/api/plagiarism/submissions/${submissionId}/flag`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          reason,
          severity: 'medium',
          notes: 'Flagged by teacher after plagiarism analysis'
        })
      });

      if (response.status === 200) {
        toast.success("Submission flagged for academic review! 🚩");
        if (onFlagged) {
          onFlagged(submissionId);
        }
      } else {
        toast.error("Failed to flag submission");
      }
    } catch (error) {
      console.error("Flag submission error:", error);
      toast.error("Failed to flag submission");
    } finally {
      setFlagging(null);
    }
  };

  // Helper functions
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return AlertTriangle;
      case 'medium': return AlertCircle;
      case 'low': return CheckCircle2;
      default: return Shield;
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'web': return Globe;
      case 'submission': return Users;
      case 'database': return Database;
      default: return FileText;
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Plagiarism Detector</h3>
            <p className="text-sm text-muted-foreground">
              {submissions.length} submissions • {analysisResults.size} analyzed
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Statistics
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
                <Target className="w-4 h-4" />
                Analyze All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Modal */}
      <AnimatePresence>
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowStats(false)}
          >
            <motion.div
              className="bg-card border border-border/20 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Plagiarism Statistics
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(false)}
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Analyzed</p>
                        <p className="text-2xl font-bold text-foreground">{stats.analyzed_submissions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Similarity</p>
                        <p className="text-2xl font-bold text-foreground">{stats.average_similarity_score}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">High Risk</p>
                        <p className="text-2xl font-bold text-foreground">{stats.risk_distribution.high}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Risk Distribution</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(stats.risk_distribution).map(([risk, count]) => {
                    const RiskIcon = getRiskIcon(risk);
                    return (
                      <div key={risk} className="flex items-center justify-between p-3 rounded-lg border border-border/20">
                        <div className="flex items-center gap-2">
                          <RiskIcon className="w-4 h-4" />
                          <span className="capitalize text-sm font-medium">{risk}</span>
                        </div>
                        <span className="text-lg font-bold">{count as number}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {stats.high_risk_submissions.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-foreground mb-3">High Risk Submissions</h4>
                  <div className="space-y-2">
                    {stats.high_risk_submissions.map((submission: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                        <div>
                          <p className="text-sm font-medium text-foreground">Submission {submission.submission_id.slice(-6)}</p>
                          <p className="text-xs text-muted-foreground">Similarity: {submission.similarity_score}%</p>
                        </div>
                        <Badge variant="destructive">High Risk</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

                    {result && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getRiskColor(result.overall_risk)}>
                          <div className="flex items-center gap-1">
                            {(() => {
                              const RiskIcon = getRiskIcon(result.overall_risk);
                              return <RiskIcon className="w-3 h-3" />;
                            })()}
                            {result.overall_risk.toUpperCase()} RISK
                          </div>
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.similarity_score}% similarity
                        </span>
                      </div>
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
                        <Search className="w-4 h-4" />
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

                        {result.overall_risk === 'high' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => flagSubmission(submission.id, 'High plagiarism similarity detected')}
                            disabled={flagging === submission.id}
                            className="gap-2"
                          >
                            {flagging === submission.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Flag className="w-4 h-4" />
                            )}
                            Flag
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Plagiarism Analysis Result */}
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
                          <TabsTrigger value="sources">Matched Sources</TabsTrigger>
                          <TabsTrigger value="details">Analysis Details</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <div className={`w-2 h-2 rounded-full ${getSimilarityColor(result.similarity_score)}`} />
                                <span className="text-2xl font-bold text-foreground">{result.similarity_score}%</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Similarity Score</p>
                            </div>
                            <div className="text-center">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(result.overall_risk)}`}>
                                {(() => {
                                  const RiskIcon = getRiskIcon(result.overall_risk);
                                  return <RiskIcon className="w-4 h-4" />;
                                })()}
                                {result.overall_risk.toUpperCase()}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">Risk Level</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Progress value={result.similarity_score} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                              Plagiarism Similarity Score
                            </p>
                          </div>

                          <div>
                            <h5 className="font-medium text-foreground mb-2">Recommendations</h5>
                            <ul className="space-y-1">
                              {result.recommendations.map((recommendation, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span>
                                  {recommendation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TabsContent>

                        <TabsContent value="sources" className="space-y-4">
                          <div>
                            <h5 className="font-medium text-foreground mb-3">Matched Sources ({result.matched_sources.length})</h5>
                            {result.matched_sources.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No significant matches found</p>
                            ) : (
                              <div className="space-y-3">
                                {result.matched_sources.map((source, index) => {
                                  const SourceIcon = getSourceIcon(source.source_type);
                                  return (
                                    <Card key={index} className="p-3">
                                      <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                          <SourceIcon className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <h6 className="font-medium text-foreground text-sm">
                                              {source.source_title || 'Unknown Source'}
                                            </h6>
                                            <Badge variant="outline" className="text-xs">
                                              {source.similarity_percentage}%
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground mb-2">
                                            Type: <span className="capitalize">{source.source_type}</span>
                                            {source.source_author && ` • ${source.source_author}`}
                                          </p>
                                          {source.matched_text.length > 0 && (
                                            <div className="mt-2">
                                              <p className="text-xs font-medium text-foreground mb-1">Matched Text:</p>
                                              <div className="space-y-1">
                                                {source.matched_text.slice(0, 3).map((text, textIndex) => (
                                                  <p key={textIndex} className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                                                    "{text}"
                                                  </p>
                                                ))}
                                                {source.matched_text.length > 3 && (
                                                  <p className="text-xs text-muted-foreground">
                                                    +{source.matched_text.length - 3} more matches...
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <h5 className="font-medium text-foreground mb-2">Text Analysis</h5>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Words</span>
                                    <span className="text-sm font-medium">{result.analysis_details.total_words}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Matched Words</span>
                                    <span className="text-sm font-medium">{result.analysis_details.matched_words}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Unique Phrases</span>
                                    <span className="text-sm font-medium">{result.analysis_details.unique_phrases}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Common Phrases</span>
                                    <span className="text-sm font-medium">{result.analysis_details.common_phrases}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardContent className="p-4">
                                <h5 className="font-medium text-foreground mb-2">Source Breakdown</h5>
                                <div className="space-y-2">
                                  {['web', 'submission', 'database'].map(sourceType => {
                                    const count = result.matched_sources.filter(s => s.source_type === sourceType).length;
                                    const SourceIcon = getSourceIcon(sourceType);
                                    return (
                                      <div key={sourceType} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <SourceIcon className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground capitalize">{sourceType}</span>
                                        </div>
                                        <span className="text-sm font-medium">{count}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
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
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Submissions Found</h3>
          <p className="text-sm text-muted-foreground">
            There are no submissions to analyze for plagiarism yet.
          </p>
        </div>
      )}
    </div>
  );
}
