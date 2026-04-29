import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Calendar, MessageSquare, Link2, CheckCircle2, ExternalLink, Loader2, Clock, Timer, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, getAccessToken, getApiErrorMessage } from "@/lib/backendApi";
import { useAuth } from "@/contexts/AuthContext";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const statusConfig: Record<string, { class: string; label: string }> = {
  pending: { class: "badge-pending", label: "Pending" },
  submitted: { class: "badge-submitted", label: "Submitted" },
  reviewed: { class: "badge-reviewed", label: "Reviewed" },
  overdue: { class: "badge-overdue", label: "Overdue - Practice Mode" },
  late: { class: "badge-late", label: "Late" },
};

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

export default function Assignments() {
  const { user, profile, roles } = useAuth();
  const isStudent = !roles.includes("teacher") && !roles.includes("admin");
  const [dbAssignments, setDbAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) {
      setDbAssignments([]);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const batch = profile?.class_name || profile?.batch || "";
    const [assignRes, subRes] = await Promise.all([
      api<Assignment[]>(
        `/api/assignments?status=published${batch ? `&batch=${encodeURIComponent(batch)}` : ""}`,
        { method: "GET", accessToken }
      ),
      api<Submission[]>("/api/assignments/my-submissions", { method: "GET", accessToken }),
    ]);

    if (assignRes.status === 200 && assignRes.data) setDbAssignments(assignRes.data);
    else setDbAssignments([]);

    if (subRes.status === 200 && subRes.data) setSubmissions(subRes.data);
    else setSubmissions([]);
    setLoading(false);
  }

  const getSubmission = (assignmentId: string) =>
    submissions.find(s => s.assignment_id === assignmentId);

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

  const getEffectiveStatus = (a: Assignment) => {
    const sub = getSubmission(a.id);
    if (sub) {
      if (sub.grade) return "reviewed";
      if (sub.status === "late" || sub.is_late) return "late";
      return "submitted";
    }
    const now = new Date();
    const due = normalizedDueDate(a.due_date);
    if (now > due) return "overdue";
    return "pending";
  };

  const canEditSubmission = (a: Assignment) => {
    if (!a.due_date) return true;
    return Date.now() <= normalizedDueDate(a.due_date).getTime();
  };

  const canPracticeSubmission = (a: Assignment) => {
    const effectiveStatus = getEffectiveStatus(a);
    return effectiveStatus === "overdue";
  };

  const handleOpenSubmit = (assignment: Assignment) => {
    if (!isStudent) return;
    const existing = getSubmission(assignment.id);
    setSelectedAssignment(assignment);
    setSubmissionLink(existing?.submission_link || "");
    setSubmitDialogOpen(true);
  };

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDetailsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!submissionLink.trim()) {
      toast.error("Please paste your submission link");
      return;
    }
    try { new URL(submissionLink); } catch {
      toast.error("Please enter a valid URL");
      return;
    }
    if (!selectedAssignment || !user) return;

    setSubmitting(true);
    const accessToken = getAccessToken();
    if (!accessToken) {
      setSubmitting(false);
      toast.error("Login required");
      return;
    }

    const res = await api(`/api/assignments/${selectedAssignment.id}/submit`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        submission_link: submissionLink.trim(),
      }),
    });
    setSubmitting(false);

    if (res.status !== 200) {
      toast.error(getApiErrorMessage(res.error, "Submission failed"));
      return;
    }

    setSubmitDialogOpen(false);
    toast.success("Assignment submitted successfully! 🎉");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = dbAssignments.filter(a => {
    const s = getEffectiveStatus(a);
    return s === "pending" || s === "overdue";
  }).length;

  const doneCount = dbAssignments.filter(a => {
    const s = getEffectiveStatus(a);
    return s === "submitted" || s === "reviewed";
  }).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">Track and submit your coursework</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="glass-card px-4 py-2">
            <span className="text-muted-foreground">Pending: </span>
            <span className="font-bold text-warning">{pendingCount}</span>
          </div>
          <div className="glass-card px-4 py-2">
            <span className="text-muted-foreground">Done: </span>
            <span className="font-bold text-success">{doneCount}</span>
          </div>
        </div>
      </motion.div>

      
      {dbAssignments.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No assignments published yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dbAssignments.map((a) => {
            const effectiveStatus = getEffectiveStatus(a);
            const status = statusConfig[effectiveStatus];
            const sub = getSubmission(a.id);
            return (
              <motion.div 
                key={a.id} 
                variants={item} 
                className={`glass-card-hover p-5 cursor-pointer ${effectiveStatus === "overdue" ? "border-violet-500/30 bg-violet-500/5" : ""}`}
                onClick={() => handleViewDetails(a)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 
                        className="font-semibold text-foreground truncate hover:text-primary transition-colors"
                      >
                        {a.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${status.class}`}>
                        {status.label}
                      </span>
                      {sub?.feedback && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-warning/15 text-warning inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Teacher feedback
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {a.batch && <span className="font-mono">{a.batch}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Deadline: {normalizedDueDate(a.due_date).toLocaleString()}
                      </span>
                      {a.duration_hours && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" /> {a.duration_hours}h to complete
                        </span>
                      )}
                      {a.max_score && <span>Max: {a.max_score} pts</span>}
                      {sub?.grade && <span className="text-success font-semibold">Grade: {sub.grade}</span>}
                    </div>
                    {/* Time remaining indicator */}
                    {(() => {
                      const now = new Date();
                      const due = normalizedDueDate(a.due_date);
                      const diff = due.getTime() - now.getTime();
                      if (diff <= 0) return (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive font-medium">
                          <Clock className="w-3 h-3" /> Overdue
                        </div>
                      );
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const timeText = days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`;
                      const isUrgent = days === 0;
                      return (
                        <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isUrgent ? "text-warning" : "text-primary"}`}>
                          <Clock className="w-3 h-3" /> {timeText}
                        </div>
                      );
                    })()}
                    {a.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{a.description}</p>
                    )}
                    {a.reference_link && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
                        <ExternalLink className="w-3 h-3" />
                        <a href={a.reference_link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs">
                          Assignment reference
                        </a>
                      </div>
                    )}
                    {sub?.feedback && (
                      <div className="mt-2 p-2.5 rounded-lg border border-warning/30 bg-warning/10">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-warning mb-1">
                          <MessageSquare className="w-3 h-3" /> Teacher Feedback
                        </div>
                        <p className="text-xs text-foreground">{sub.feedback}</p>
                      </div>
                    )}
                    {sub && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
                        <Link2 className="w-3 h-3" />
                        <a href={sub.submission_link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs">
                          {sub.submission_link}
                        </a>
                      </div>
                    )}
                  </div>
                  {isStudent && canEditSubmission(a) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSubmit(a);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex-shrink-0"
                    >
                      <Upload className="w-4 h-4" /> {sub ? "Edit Submission" : "Submit"}
                    </button>
                  )}
                  {isStudent && canPracticeSubmission(a) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSubmit(a);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-600 text-sm font-medium hover:bg-violet-500/20 transition-colors flex-shrink-0 border border-violet-500/20"
                    >
                      <Upload className="w-4 h-4" /> Practice Submit
                    </button>
                  )}
                  {isStudent && effectiveStatus === "submitted" && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm font-medium flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" /> Submitted
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen && isStudent} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-lg transition-all duration-300 ease-out">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              {getSubmission(selectedAssignment?.id || "") ? "Edit Submission" : "Submit Assignment"}
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Submission Link</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://..."
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="pl-10 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Paste your GitHub, Google Drive, or any submission link
              </p>
              {submissionLink.trim() && (
                <p className="text-xs">
                  {(() => {
                    try {
                      new URL(submissionLink.trim());
                      return <span className="text-emerald-600">Valid URL — ready to save</span>;
                    } catch {
                      return <span className="text-destructive">Enter a full URL (must start with https://)</span>;
                    }
                  })()}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save Submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto transition-all duration-300 ease-out" style={{ marginTop: '-30vh', marginLeft: '-15vw' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              {selectedAssignment?.title}
            </DialogTitle>
            <DialogDescription>
              Assignment details and requirements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Assignment Description */}
            {selectedAssignment?.description && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Description</h4>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/20">
                  <p className="text-sm leading-relaxed text-foreground">
                    {selectedAssignment.description}
                  </p>
                </div>
              </div>
            )}

            {/* Assignment Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deadline */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h4 className="font-semibold text-foreground">Deadline</h4>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
                  <p className="text-sm font-medium text-foreground">
                    {selectedAssignment?.due_date ? normalizedDueDate(selectedAssignment.due_date).toLocaleString() : 'No deadline'}
                  </p>
                  {(() => {
                    if (!selectedAssignment?.due_date) return null;
                    const now = new Date();
                    const due = normalizedDueDate(selectedAssignment.due_date);
                    const diff = due.getTime() - now.getTime();
                    if (diff <= 0) {
                      return <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Overdue</p>;
                    }
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    return (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⏰ {days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Duration */}
              {selectedAssignment?.duration_hours && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-blue-500" />
                    <h4 className="font-semibold text-foreground">Duration</h4>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30">
                    <p className="text-sm font-medium text-foreground">
                      {selectedAssignment.duration_hours} hours to complete
                    </p>
                  </div>
                </div>
              )}

              {/* Max Score */}
              {selectedAssignment?.max_score && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">★</span>
                    </div>
                    <h4 className="font-semibold text-foreground">Maximum Score</h4>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedAssignment.max_score} points
                    </p>
                  </div>
                </div>
              )}

              {/* Batch */}
              {selectedAssignment?.batch && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">#</span>
                    </div>
                    <h4 className="font-semibold text-foreground">Batch</h4>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30">
                    <p className="text-sm font-medium text-foreground font-mono">
                      {selectedAssignment.batch}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reference Link */}
            {selectedAssignment?.reference_link && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Reference Material</h4>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <a 
                    href={selectedAssignment.reference_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    📎 Open Assignment Reference
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Submission Status (for students) */}
            {isStudent && (() => {
              const submission = getSubmission(selectedAssignment?.id || "");
              if (submission) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-semibold text-foreground">Your Submission</h4>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-3 h-3 text-emerald-600" />
                          <a 
                            href={submission.submission_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-600 hover:underline"
                          >
                            View Submitted Work
                          </a>
                        </div>
                        {submission.grade && (
                          <p className="text-sm font-medium text-emerald-600">
                            🏆 Grade: {submission.grade}
                          </p>
                        )}
                        {submission.feedback && (
                          <div className="mt-2 p-2 rounded bg-warning/10 border border-warning/20">
                            <p className="text-xs text-warning">
                              💬 {submission.feedback}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {isStudent && selectedAssignment && canEditSubmission(selectedAssignment) && (
              <Button 
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleOpenSubmit(selectedAssignment);
                }}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Submit Assignment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
