import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { api, getAccessToken, API_BASE } from "@/lib/backendApi";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

type Row = {
  student_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  batch: string | null;
  status: "present" | "late" | "half_day" | "absent";
  checked_in_at: string | null;
};

export default function TeacherStudentAttendance() {
  const { profile, roles } = useAuth();
  const isTeacher = roles.includes("teacher") || roles.includes("admin");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const batch = (profile?.class_name || profile?.batch || "").trim();

  const [windowLoading, setWindowLoading] = useState(false);
  const [currentWindow, setCurrentWindow] = useState<{ start_time: string; end_time: string } | null>(null);
  const [nextStart, setNextStart] = useState("10:00");
  const [nextEnd, setNextEnd] = useState("10:30");

  const dayStr = useMemo(() => {
    const d = date ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  }, [date]);

  useEffect(() => {
    if (!isTeacher) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch, dayStr, isTeacher]);

  async function loadAll() {
    if (!batch) {
      setRows([]);
      setLoading(false);
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    await Promise.all([loadWindow(batch, accessToken), loadSummary(batch, dayStr, accessToken)]);
    setLoading(false);
  }

  async function loadWindow(b: string, accessToken: string) {
    setWindowLoading(true);
    const res = await api<any>(`/api/attendance/window?batch=${encodeURIComponent(b)}`, { method: "GET", accessToken });
    if (res.status === 200 && res.data?.start_time && res.data?.end_time) {
      setCurrentWindow({ start_time: String(res.data.start_time), end_time: String(res.data.end_time) });
      setNextStart(String(res.data.start_time));
      setNextEnd(String(res.data.end_time));
    } else {
      setCurrentWindow(null);
    }
    setWindowLoading(false);
  }

  async function loadSummary(b: string, isoDay: string, accessToken: string) {
    const res = await api<Row[]>(
      `/api/attendance/summary?batch=${encodeURIComponent(b)}&date=${encodeURIComponent(isoDay)}`,
      { method: "GET", accessToken }
    );
    if (res.status === 200 && res.data) {
      const fixed = res.data.map((r) => ({
        ...r,
        avatar_url: r.avatar_url && r.avatar_url.startsWith("/") ? `${API_BASE}${r.avatar_url}` : r.avatar_url,
      }));
      setRows(fixed);
    } else {
      setRows([]);
    }
  }

  async function saveWindow() {
    if (!batch) return;
    const accessToken = getAccessToken();
    if (!accessToken) return toast.error("Login required");
    setWindowLoading(true);
    const res = await api(`/api/attendance/window`, {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ batch, start_time: nextStart, end_time: nextEnd }),
    });
    if (res.status !== 200) toast.error(typeof res.error === "string" ? res.error : "Failed to update timing");
    else toast.success("Timing updated (effective tomorrow)");
    await loadAll();
    setWindowLoading(false);
  }

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, half_day: 0, absent: 0 };
    rows.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);

  if (!isTeacher) return <div className="text-muted-foreground">Not allowed</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Batch: <span className="font-medium text-foreground">{batch || "—"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => {
              const today = new Date();
              const td = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
              const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
              return dd > td; // future disabled
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">Daily attendance timing</p>
            <p className="text-xs text-muted-foreground">
              {currentWindow ? `Current: ${currentWindow.start_time} – ${currentWindow.end_time}` : "No timing set"}
              <span className="block mt-1">Changes apply from next day.</span>
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Start</label>
                <input type="time" value={nextStart} onChange={(e) => setNextStart(e.target.value)} className="px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">End</label>
                <input type="time" value={nextEnd} onChange={(e) => setNextEnd(e.target.value)} className="px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
              </div>
              <button onClick={saveWindow} disabled={windowLoading} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {windowLoading ? "Saving..." : "Save timing"}
              </button>
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-foreground">Summary</p>
            <p className="text-xs text-muted-foreground mt-1">{date ? format(date, "PPPP") : "—"}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-success/10">
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-xl font-bold text-foreground">{counts.present}</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-xl font-bold text-foreground">{counts.late}</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10">
                <p className="text-xs text-muted-foreground">Half day</p>
                <p className="text-xl font-bold text-foreground">{counts.half_day}</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10">
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-xl font-bold text-foreground">{counts.absent}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Students</p>
          {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
        </div>
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No students / no data</div>
        ) : (
          <div className="divide-y divide-border/20">
            {rows.map((r) => {
              const badge =
                r.status === "present"
                  ? { icon: CheckCircle2, cls: "bg-success/10 text-success", label: "Present" }
                  : r.status === "late"
                    ? { icon: Clock, cls: "bg-warning/10 text-warning", label: "Late" }
                    : r.status === "half_day"
                      ? { icon: AlertCircle, cls: "bg-violet-500/10 text-violet-500", label: "Half day" }
                      : { icon: XCircle, cls: "bg-destructive/10 text-destructive", label: "Absent" };
              const Icon = badge.icon;
              return (
                <div key={r.student_id} className="px-4 py-3 flex items-center gap-3">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(r.full_name || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.email || ""}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${badge.cls}`}>
                    <Icon className="w-3.5 h-3.5" /> {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

