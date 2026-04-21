import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, AlertCircle, Save, Users, MapPin, Camera } from "lucide-react";
import { format } from "date-fns";
import { api, getAccessToken } from "@/lib/backendApi";

type StudentProfile = {
  id: string;
  full_name: string;
  batch: string | null;
  avatar_url: string | null;
};

type AttendanceStatus = "present" | "absent" | "late" | "half_day";

type AttendanceRecord = {
  student_id: string;
  status: AttendanceStatus;
  notes: string;
};

const statusConfig: Record<AttendanceStatus, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  present: { icon: CheckCircle2, label: "Present", color: "text-success", bg: "bg-success/15" },
  absent: { icon: XCircle, label: "Absent", color: "text-destructive", bg: "bg-destructive/15" },
  late: { icon: Clock, label: "Late", color: "text-warning", bg: "bg-warning/15" },
  half_day: { icon: AlertCircle, label: "Half day", color: "text-violet-500", bg: "bg-violet-500/10" },
};

interface AttendanceMarkerProps {
  classId: string;
  classTitle: string;
  classBatch: string | null;
  scheduledAt: string;
  onClose: () => void;
}

export default function AttendanceMarker({ classId, classTitle, classBatch, scheduledAt, onClose }: AttendanceMarkerProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingRecords, setExistingRecords] = useState(false);
  const [checkInDetails, setCheckInDetails] = useState<Record<string, { selfie_url?: string; latitude?: number; longitude?: number; check_in_method?: string; location_verified?: boolean }>>({});
  const [expandedSelfie, setExpandedSelfie] = useState<string | null>(null);
  const [windowLoading, setWindowLoading] = useState(false);
  const [currentWindow, setCurrentWindow] = useState<{ start_time: string; end_time: string; effective_from?: string } | null>(null);
  const [nextStart, setNextStart] = useState("10:00");
  const [nextEnd, setNextEnd] = useState("10:30");

  useEffect(() => {
    loadData();
  }, [classId]);

  async function loadData() {
    setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) {
      setStudents([]);
      setLoading(false);
      return;
    }

    if (!classBatch) {
      setStudents([]);
      setLoading(false);
      return;
    }

    // Load current attendance window for this batch (if any)
    void loadWindow(classBatch);

    const day = new Date(scheduledAt);
    const dayStr = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();

    const [studentsRes, existingRes] = await Promise.all([
      api<any[]>(`/api/users/batch/${encodeURIComponent(classBatch)}`, { method: "GET", accessToken }),
      api<any[]>(`/api/attendance/class/${classId}?date=${encodeURIComponent(dayStr)}`, { method: "GET", accessToken }),
    ]);

    const studentRows = (studentsRes.status === 200 && studentsRes.data ? studentsRes.data : [])
      .filter((u: any) => (u.role ?? "student") === "student")
      .map((u: any) => ({
        id: String(u._id ?? u.id),
        full_name: u.name ?? u.full_name ?? "Unknown",
        batch: u.assignedClass ?? u.class_name ?? null,
        avatar_url: u.avatar_url ?? null,
      }));

    setStudents(studentRows);

    const initial: Record<string, AttendanceRecord> = {};
    studentRows.forEach((p: StudentProfile) => {
      // Default: absent; if student has check-in record, we overwrite below.
      initial[p.id] = { student_id: p.id, status: "absent", notes: "" };
    });

    const existing = existingRes.status === 200 && existingRes.data ? existingRes.data : [];
    const checkInData: Record<string, { selfie_url?: string; latitude?: number; longitude?: number; check_in_method?: string; location_verified?: boolean }> = {};

    if (existing.length > 0) {
      setExistingRecords(true);
      existing.forEach((e: any) => {
        const sid = String(e.student_id);
        initial[sid] = {
          student_id: sid,
          status: (e.status || "present") as AttendanceStatus,
          notes: "",
        };
        if (e.location || e.selfie_url) {
          checkInData[sid] = {
            selfie_url: e.selfie_url || undefined,
            latitude: e.location?.latitude || undefined,
            longitude: e.location?.longitude || undefined,
            check_in_method: e.location ? "gps_selfie" : undefined,
            location_verified: Boolean(e.location?.verified),
          };
        }
      });
    }

    setCheckInDetails(checkInData);
    setRecords(initial);
    setLoading(false);
  }

  async function loadWindow(batch: string) {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    setWindowLoading(true);
    const res = await api<any>(`/api/attendance/window?batch=${encodeURIComponent(batch)}`, { method: "GET", accessToken });
    if (res.status === 200) {
      const w = (res.data as any) || null;
      if (w?.start_time && w?.end_time) {
        setCurrentWindow({ start_time: String(w.start_time), end_time: String(w.end_time), effective_from: w.effective_from ? String(w.effective_from) : undefined });
        setNextStart(String(w.start_time));
        setNextEnd(String(w.end_time));
      } else {
        setCurrentWindow(null);
      }
    }
    setWindowLoading(false);
  }

  async function saveWindow() {
    if (!classBatch) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("Login required");
      return;
    }
    setWindowLoading(true);
    const res = await api(`/api/attendance/window`, {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ batch: classBatch, start_time: nextStart, end_time: nextEnd }),
    });
    if (res.status !== 200) {
      toast.error(typeof res.error === "string" ? res.error : "Failed to update timing");
    } else {
      toast.success("Attendance timing updated (effective tomorrow)");
      await loadWindow(classBatch);
    }
    setWindowLoading(false);
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  }

  async function saveAttendance() {
    if (!user) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("Login required");
      return;
    }
    setSaving(true);

    const rows = Object.values(records).map(r => ({
      student_id: r.student_id,
      status: r.status,
      notes: r.notes || null,
    }));

    const res = await api(`/api/attendance/class/${classId}/mark`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({ rows, date: new Date(scheduledAt).toISOString() }),
    });
    if (res.status !== 200) {
      toast.error("Failed to save attendance");
    } else {
      toast.success(`Attendance saved for ${rows.length} students!`);
      onClose();
    }
    setSaving(false);
  }

  const counts = Object.values(records).reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{classTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(scheduledAt), "PPp")}
            {classBatch && <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]">{classBatch}</span>}
          </p>
        </div>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ✕ Close
        </button>
      </div>

      {/* Attendance timing window (effective tomorrow) */}
      {classBatch && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Daily attendance timing</p>
              <p className="text-xs text-muted-foreground">
                {currentWindow
                  ? `Current: ${currentWindow.start_time} – ${currentWindow.end_time}`
                  : "No timing set yet (students will be marked present by default)."}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Changes apply from next day.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Start</label>
              <input
                type="time"
                value={nextStart}
                onChange={(e) => setNextStart(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">End</label>
              <input
                type="time"
                value={nextEnd}
                onChange={(e) => setNextEnd(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground"
              />
            </div>
            <button
              onClick={saveWindow}
              disabled={windowLoading}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {windowLoading ? "Saving..." : "Save timing"}
            </button>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex gap-3 flex-wrap">
        {(Object.keys(statusConfig) as AttendanceStatus[]).map(s => {
          const cfg = statusConfig[s];
          return (
            <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cfg.bg} text-xs font-medium ${cfg.color}`}>
              <cfg.icon className="w-3.5 h-3.5" />
              {cfg.label}: {counts[s] || 0}
            </div>
          );
        })}
      </div>

      {/* Student list */}
      {students.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No students found{classBatch ? ` in batch ${classBatch}` : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map(student => {
            const record = records[student.id];
            const detail = checkInDetails[student.id];
            if (!record) return null;
            return (
              <div key={student.id} className="space-y-2">
                <div className="glass-card-hover p-3 flex items-center gap-4">
                  {/* Avatar or selfie thumbnail */}
                  {detail?.selfie_url ? (
                    <button onClick={() => setExpandedSelfie(expandedSelfie === student.id ? null : student.id)} className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-success/50">
                      <img src={detail.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                      {(student.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name + check-in badges */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{student.full_name || "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {student.batch && <span className="text-[11px] text-muted-foreground">{student.batch}</span>}
                      {detail?.check_in_method === "gps_selfie" && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                          <MapPin className="w-2.5 h-2.5" /><Camera className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-1.5">
                    {(Object.keys(statusConfig) as AttendanceStatus[]).map(s => {
                      const cfg = statusConfig[s];
                      const isActive = record.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(student.id, s)}
                          className={`p-2 rounded-lg transition-all text-xs font-medium ${
                            isActive
                              ? `${cfg.bg} ${cfg.color} ring-1 ring-current`
                              : "text-muted-foreground hover:bg-muted/50"
                          }`}
                          title={cfg.label}
                        >
                          <cfg.icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded selfie + location */}
                {expandedSelfie === student.id && detail && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-13 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2">
                    {detail.selfie_url && (
                      <img src={detail.selfie_url} alt="Check-in selfie" className="w-full max-w-[240px] rounded-lg" />
                    )}
                    {detail.latitude && detail.longitude && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {detail.latitude.toFixed(5)}, {detail.longitude.toFixed(5)}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {students.length > 0 && (
        <button
          onClick={saveAttendance}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50 transition-all"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : existingRecords ? "Update Attendance" : "Save Attendance"}
        </button>
      )}
    </motion.div>
  );
}
