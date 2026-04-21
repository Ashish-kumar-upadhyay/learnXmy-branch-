import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Calendar, MessageSquare, Link2, CheckCircle2, ExternalLink, Loader2, Clock, Timer, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";
import { useAuth } from "@/contexts/AuthContext";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const statusConfig: Record<string, { class: string; label: string }> = {
  pending: { class: "badge-pending", label: "Pending" },
  submitted: { class: "badge-submitted", label: "Submitted" },
  reviewed: { class: "badge-reviewed", label: "Reviewed" },
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
      return "submitted";
    }
    const now = new Date();
    const due = normalizedDueDate(a.due_date);
    if (now > due) return "late";
    return "pending";
  };

  const canEditSubmission = (a: Assignment) => {
    if (!a.due_date) return true;
    return Date.now() <= normalizedDueDate(a.due_date).getTime();
  };

  const handleOpenSubmit = (assignment: Assignment) => {
    if (!isStudent) return;
    const existing = getSubmission(assignment.id);
    setSelectedAssignment(assignment);
    setSubmissionLink(existing?.submission_link || "");
    setSubmitDialogOpen(true);
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
      toast.error("Submission failed");
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
    return s === "pending" || s === "late";
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
              <motion.div key={a.id} variants={item} className="glass-card-hover p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{a.title}</h3>
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
                        <Calendar className="w-3 h-3" /> Due: {normalizedDueDate(a.due_date).toLocaleString()}
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
                      onClick={() => handleOpenSubmit(a)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex-shrink-0"
                    >
                      <Upload className="w-4 h-4" /> {sub ? "Edit Submission" : "Submit"}
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
        <DialogContent className="sm:max-w-lg">
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
    </motion.div>
  );
}
