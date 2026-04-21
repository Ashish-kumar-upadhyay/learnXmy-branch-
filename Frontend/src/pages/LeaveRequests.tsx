import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarOff, Plus, Clock, CheckCircle2, XCircle, Send, X, CalendarDays, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-600 dark:text-amber-400", icon: Clock, bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30" },
  approved: { label: "Approved", color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30" },
  rejected: { label: "Rejected", color: "text-rose-600 dark:text-rose-400", icon: XCircle, bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30" },
};

export default function LeaveRequests() {
  const { user, roles } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<"full_day" | "half_day">("full_day");
  const [leaveDate, setLeaveDate] = useState("");
  const [reason, setReason] = useState("");
  const [reviewerNote, setReviewerNote] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");

  const fetchLeaves = async () => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const qs = isAdmin
        ? "?user_type=teacher"
        : `?user_id=${encodeURIComponent(user.id)}`;
      const res = await api<any[]>(`/api/leave-requests${qs}`, {
        method: "GET",
        accessToken: token,
      });
      if (res.status !== 200 || !res.data) throw new Error("Failed to fetch leave requests");
      setLeaveRequests(res.data);

      if (isAdmin) {
        const usersRes = await api<any[]>("/api/users", { method: "GET", accessToken: token });
        if (usersRes.status === 200 && usersRes.data) {
          const map = new Map<string, string>();
          usersRes.data.forEach((u: any) => {
            map.set(String(u._id ?? u.id), u.name ?? u.full_name ?? u.email ?? "Unknown");
          });
          setProfileMap(map);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load leaves");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeaves();
  }, [user, isAdmin]);

  const submitLeave = async () => {
    if (!user) return;
    const token = getAccessToken();
    if (!token) {
      toast.error("Login required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api("/api/leave-requests", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          user_type: isTeacher ? "teacher" : "student",
          leave_date: leaveDate,
          type: leaveType,
          reason: reason.trim(),
        }),
      });
      if (res.status !== 201 && res.status !== 200) throw new Error("Leave request submit failed");
      toast.success("Leave request submitted!");
      setShowForm(false);
      setLeaveType("full_day");
      setLeaveDate("");
      setReason("");
      await fetchLeaves();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Leave request submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const reviewLeave = async (id: string, status: "approved" | "rejected", note?: string) => {
    const token = getAccessToken();
    if (!token) {
      toast.error("Login required");
      return;
    }
    setReviewingId(id);
    try {
      const res = await api(`/api/leave-requests/${id}/approve`, {
        method: "PUT",
        accessToken: token,
        body: JSON.stringify({ status, reviewer_note: note || null }),
      });
      if (res.status !== 200) throw new Error("Failed to update leave request");
      toast.success(`Leave ${status}!`);
      setReviewerNote("");
      await fetchLeaves();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update leave");
    } finally {
      setReviewingId(null);
    }
  };

  const pendingCount = leaveRequests.filter((r: any) => r.status === "pending").length;
  const canReview = isAdmin;
  const canApply = isTeacher || roles.includes("student");
  const title = canReview ? "Teacher Leave Requests" : "My Leaves";
  const subtitle = canReview
    ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""} to review`
    : "Request and track your leave applications";
  const visibleLeaveRequests = useMemo(() => leaveRequests, [leaveRequests]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-extrabold text-foreground tracking-tight">
            {title} 📋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {subtitle}
          </p>
        </div>
        {canApply && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-violet-500 hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
        )}
      </div>

      {/* Leave Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-card rounded-3xl border border-border/20 shadow-2xl w-full max-w-md p-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground">Apply for Leave</h2>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Leave Type */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block">Leave Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "full_day" as const, label: "Full Day", emoji: "📅" },
                        { value: "half_day" as const, label: "Half Day", emoji: "🕐" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setLeaveType(opt.value)}
                          className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                            leaveType === opt.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border/30 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {opt.emoji} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block">Date</label>
                    <input
                      type="date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-border/30 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block">Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why do you need leave?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-border/30 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    onClick={submitLeave}
                    disabled={!leaveDate || !reason.trim() || submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-violet-500 hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stats */}
      {!canReview && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", count: leaveRequests.filter((r: any) => r.status === "pending").length, ...statusConfig.pending },
            { label: "Approved", count: leaveRequests.filter((r: any) => r.status === "approved").length, ...statusConfig.approved },
            { label: "Rejected", count: leaveRequests.filter((r: any) => r.status === "rejected").length, ...statusConfig.rejected },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leave Requests List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leaveRequests.length === 0 ? (
        <div className="text-center py-16">
          <CalendarOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No leave requests yet</p>
          {canApply && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary font-semibold hover:underline">
              Apply for your first leave
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLeaveRequests.map((req: any, i: number) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={req.id ?? req._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-card/80 rounded-2xl border border-border/20 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {canReview && (
                        <span className="text-sm font-bold text-foreground">
                          {profileMap.get(String(req.user_id)) || "Unknown Teacher"}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.bg} ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted/40 text-muted-foreground">
                        {(req.type ?? req.leave_type) === "half_day" ? "Half Day" : "Full Day"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {format(new Date(req.leave_date ?? req.start_date), "dd MMM yyyy")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Applied {format(new Date(req.created_at), "dd MMM")}
                      </span>
                    </div>

                    <p className="text-[13px] text-foreground/80">{req.reason}</p>

                    {req.reviewer_note && (
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-muted/20 border border-border/10">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <p className="text-xs text-muted-foreground"><span className="font-semibold">Admin note:</span> {req.reviewer_note}</p>
                      </div>
                    )}
                  </div>

                  {/* Admin actions */}
                  {canReview && req.status === "pending" && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={reviewerNote}
                        onChange={(e) => setReviewerNote(e.target.value)}
                        className="w-36 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-xs focus:outline-none focus:border-primary/50"
                      />
                      <button
                        onClick={() => reviewLeave(req.id ?? req._id, "approved", reviewerNote)}
                        disabled={reviewingId === (req.id ?? req._id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => reviewLeave(req.id ?? req._id, "rejected", reviewerNote)}
                        disabled={reviewingId === (req.id ?? req._id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
