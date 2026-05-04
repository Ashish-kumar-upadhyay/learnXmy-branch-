import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Calendar, Clock, Timer, MessageSquare, Link2, CheckCircle2, 
  ExternalLink, Upload, ArrowLeft, Star, Hash, AlertCircle,
  Edit3, Save, X, Loader2, Trophy, MessageCircle, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api, getAccessToken, getApiErrorMessage } from "@/lib/backendApi";
import { useAuth } from "@/contexts/AuthContext";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  reference_link?: string | null;
  due_date: string;
  max_score: number | null;
  status: string;
  batch: string | null;
  duration_hours: number | null;
};

type Submission = {
  id: string;
  assignment_id: string;
  submission_link: string;
  status: string;
  is_late?: boolean;
  grade: string | null;
  feedback: string | null;
  submitted_at: string;
};

export default function AssignmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, roles } = useAuth();
  const isStudent = !roles.includes("teacher") && !roles.includes("admin");
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");

  useEffect(() => {
    if (id) fetchAssignmentDetails();
  }, [id]);

  async function fetchAssignmentDetails() {
    setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken || !id) {
      setLoading(false);
      return;
    }

    try {
      const [assignRes, subRes] = await Promise.all([
        api<Assignment>(`/api/assignments/${id}`, { method: "GET", accessToken }),
        isStudent ? api<Submission[]>(`/api/assignments/my-submissions`, { method: "GET", accessToken }) : Promise.resolve({ data: null })
      ]);

      if ('status' in assignRes && assignRes.status === 200 && assignRes.data) {
        setAssignment(assignRes.data);
      }

      if ('status' in subRes && subRes.status === 200 && subRes.data) {
        const found = subRes.data.find(s => s.assignment_id === id);
        setSubmission(found || null);
        if (found) {
          setSubmissionLink(found.submission_link);
        }
      }
    } catch (error) {
      console.error("Error fetching assignment details:", error);
      toast.error("Failed to load assignment details");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!submissionLink.trim()) {
      toast.error("Please enter a submission link");
      return;
    }

    try {
      new URL(submissionLink.trim());
    } catch {
      toast.error("Please enter a valid URL (must start with https://)");
      return;
    }

    setSubmitting(true);
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      const endpoint = submission ? `/api/assignments/submissions/${submission.id}` : "/api/assignments/submissions";
      const method = submission ? "PUT" : "POST";
      const payload = {
        assignment_id: assignment!.id,
        submission_link: submissionLink.trim(),
      };

      const response = await api(endpoint, { method, accessToken, body: JSON.stringify(payload) });

      if ('status' in response && (response.status === 200 || response.status === 201)) {
        toast.success(submission ? "Submission updated successfully!" : "Assignment submitted successfully!");
        setShowSubmitForm(false);
        fetchAssignmentDetails();
      } else {
        toast.error(getApiErrorMessage(response) || "Failed to submit assignment");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const normalizedDueDate = (value: string) => {
    const d = new Date(value);
    if (
      d.getHours() === 0 &&
      d.getMinutes() === 0 &&
      d.getSeconds() === 0 &&
      d.getMilliseconds() === 0
    ) {
      const eod = new Date(d);
      eod.setHours(23, 59, 59, 999);
      return eod;
    }
    return d;
  };

  const canEditSubmission = (assignment: Assignment) => {
    if (!isStudent) return false;
    if (!assignment.due_date) return true;
    return new Date() <= normalizedDueDate(assignment.due_date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Assignment Not Found</h2>
          <p className="text-muted-foreground mb-6">The assignment you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/assignments")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Button>
        </div>
      </div>
    );
  }

  const isOverdue = assignment.due_date && new Date() > normalizedDueDate(assignment.due_date);
  const timeRemaining = assignment.due_date ? (() => {
    const now = new Date();
    const due = normalizedDueDate(assignment.due_date);
    const diff = due.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  })() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-border/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/assignments")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-8 w-px bg-border/20" />
              <h1 className="text-lg font-semibold text-foreground">Assignment Details</h1>
            </div>
            {isStudent && canEditSubmission(assignment) && (
              <Button 
                onClick={() => setShowSubmitForm(!showSubmitForm)}
                className="flex items-center gap-2"
              >
                {submission ? <Edit3 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                {submission ? "Edit Submission" : "Submit Assignment"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border/20 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600" />
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground mb-3">{assignment.title}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      {assignment.batch && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/30">
                          <Hash className="w-3 h-3 mr-1" />
                          {assignment.batch}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        isOverdue 
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/30"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/30"
                      }`}>
                        {isOverdue ? "Overdue" : "Active"}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                </div>

                {assignment.description && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Description</h3>
                    </div>
                    <div className="p-6 rounded-xl bg-muted/30 border border-border/20">
                      <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                        {assignment.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Submit Form */}
            <AnimatePresence>
              {showSubmitForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border/20 overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        {submission ? "Edit Submission" : "Submit Assignment"}
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowSubmitForm(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Submission Link</label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="url"
                            inputMode="url"
                            autoComplete="url"
                            placeholder="https://github.com/username/assignment"
                            value={submissionLink}
                            onChange={(e) => setSubmissionLink(e.target.value)}
                            className="pl-10 font-mono"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Paste your GitHub, Google Drive, or any submission link
                        </p>
                        {submissionLink.trim() && (
                          <p className="text-xs mt-2">
                            {(() => {
                              try {
                                new URL(submissionLink.trim());
                                return <span className="text-emerald-600">✓ Valid URL — ready to save</span>;
                              } catch {
                                return <span className="text-destructive">✗ Enter a full URL (must start with https://)</span>;
                              }
                            })()}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setShowSubmitForm(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {submission ? "Update Submission" : "Submit Assignment"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reference Material */}
            {assignment.reference_link && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border/20 p-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Reference Material</h3>
                </div>
                <a 
                  href={assignment.reference_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary/90 rounded-xl border border-primary/20 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Open Assignment Reference
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border/20 p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Status</h3>
              <div className="space-y-4">
                {submission ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Submitted</span>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
                      <div className="space-y-2">
                        <a 
                          href={submission.submission_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 hover:underline flex items-center gap-2"
                        >
                          <Link2 className="w-3 h-3" />
                          View Submitted Work
                        </a>
                        {submission.grade && (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <Trophy className="w-4 h-4" />
                            <span className="font-medium">Grade: {submission.grade}</span>
                          </div>
                        )}
                        {submission.feedback && (
                          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <div className="flex items-start gap-2">
                              <MessageCircle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-warning">{submission.feedback}</p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Not Submitted</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-border/20 p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Details</h3>
              <div className="space-y-4">
                {/* Deadline */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">Deadline</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
                    <p className="text-sm font-medium text-foreground">
                      {assignment.due_date ? normalizedDueDate(assignment.due_date).toLocaleString() : 'No deadline'}
                    </p>
                    {timeRemaining && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⏰ {timeRemaining.days > 0 ? `${timeRemaining.days}d ${timeRemaining.hours}h` : `${timeRemaining.hours}h`} remaining
                      </p>
                    )}
                    {isOverdue && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Overdue</p>
                    )}
                  </div>
                </div>

                {/* Duration */}
                {assignment.duration_hours && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Timer className="w-4 h-4" />
                      <span className="font-medium text-sm">Duration</span>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30">
                      <p className="text-sm font-medium text-foreground">
                        {assignment.duration_hours} hours to complete
                      </p>
                    </div>
                  </div>
                )}

                {/* Max Score */}
                {assignment.max_score && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Star className="w-4 h-4" />
                      <span className="font-medium text-sm">Maximum Score</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {assignment.max_score} points
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
