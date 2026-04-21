import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, XCircle, Clock, AlertCircle, CalendarDays, Navigation } from "lucide-react";
import { format } from "date-fns";
import ProgressRing from "@/components/ProgressRing";
import AttendanceCheckIn from "@/components/AttendanceCheckIn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, getAccessToken } from "@/lib/backendApi";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

type AttendanceWithClass = {
  id: string;
  status: string;
  marked_at: string;
  notes?: string | null;
  class_id?: string;
  classes: { title: string; subject: string; scheduled_at: string } | null;
};

const statusIcon: Record<string, React.ElementType> = {
  present: CheckCircle2,
  absent: XCircle,
  late: Clock,
  half_day: AlertCircle,
  excused: AlertCircle,
};

const statusColor: Record<string, string> = {
  present: "text-success",
  absent: "text-destructive",
  late: "text-warning",
  half_day: "text-violet-500",
  excused: "text-muted-foreground",
};

const statusBg: Record<string, string> = {
  present: "bg-success/15",
  absent: "bg-destructive/15",
  late: "bg-warning/15",
  half_day: "bg-violet-500/10",
  excused: "bg-muted/50",
};

export default function StudentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [markKind, setMarkKind] = useState<"full" | "half_day">("full");
  const [marking, setMarking] = useState(false);
  const [todayWindow, setTodayWindow] = useState<{ start_time: string; end_time: string } | null>(null);

  useEffect(() => {
    if (user) loadAttendance();
  }, [user]);

  async function loadAttendance() {
    setLoading(true);
    if (!user) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      setRecords([]);
      setLoading(false);
      return;
    }
    const res = await api<any[]>(`/api/attendance/history/${user.id}`, { method: "GET", accessToken });
    const items = res.status === 200 && res.data ? res.data : [];

    // Backend fields are: `_id`, `status`, `checked_in_at`, `class_id`, `selfie_url`, etc.
    const mapped: AttendanceWithClass[] = (items as any[]).map((r) => ({
      id: String(r._id ?? r.id ?? ""),
      status: r.status,
      marked_at: r.checked_in_at ? new Date(r.checked_in_at).toISOString() : new Date().toISOString(),
      notes: null,
      class_id: r.class_id ? String(r.class_id) : undefined,
      classes: null,
    }));

    setRecords(mapped);
    void loadTodayWindow();
    setLoading(false);
  }

  async function loadTodayWindow() {
    if (!user) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const res = await api<any>(`/api/attendance/window`, { method: "GET", accessToken });
    if (res.status === 200 && res.data?.start_time && res.data?.end_time) {
      setTodayWindow({ start_time: String(res.data.start_time), end_time: String(res.data.end_time) });
    } else {
      setTodayWindow(null);
    }
  }

  const isToday = (d?: Date) => {
    if (!d) return false;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const b = new Date().setHours(0, 0, 0, 0);
    return a === b;
  };

  async function markAttendanceForDay() {
    if (!user || !selectedDate) return;
    if (!isToday(selectedDate)) {
      toast.error("Sirf aaj ki attendance mark ho sakti hai");
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("Login required");
      return;
    }
    setMarking(true);
    const res = await api(`/api/attendance/mark-day`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({ date: selectedDate.toISOString(), kind: markKind }),
    });
    if (res.status !== 200) {
      const msg =
        typeof res.error === "string"
          ? res.error
          : (res.error as any)?.message ||
            (Array.isArray((res.error as any)?.errors) ? (res.error as any).errors[0] : null) ||
            "Mark failed";
      toast.error(msg);
    } else {
      toast.success(markKind === "half_day" ? "Half-day marked" : "Attendance marked");
      await loadAttendance();
    }
    setMarking(false);
  }

  const total = records.length;
  const presentCount = records.filter(r => r.status === "present" || r.status === "late" || r.status === "half_day").length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const counts = records.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; },
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Attendance</h2>
        <p className="text-sm text-muted-foreground mt-1">Your attendance records across all classes</p>
      </div>

      <Tabs defaultValue="checkin" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="checkin" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Navigation className="w-4 h-4 mr-2" />Check In
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <CalendarDays className="w-4 h-4 mr-2" />Calendar
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <CalendarDays className="w-4 h-4 mr-2" />History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          <AttendanceCheckIn onCheckInSuccess={loadAttendance} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(d) => {
                  // Only allow selecting today for marking (history is still visible below)
                  const today = new Date();
                  const td = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                  return dd > td; // future disabled
                }}
              />
            </div>

            <div className="glass-card p-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Selected date</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDate ? format(selectedDate, "PPPP") : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {todayWindow ? `Today window: ${todayWindow.start_time} – ${todayWindow.end_time}` : "Today window: not set"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Mark type</p>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="radio"
                    name="markKind"
                    checked={markKind === "full"}
                    onChange={() => setMarkKind("full")}
                  />
                  Full day
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="radio"
                    name="markKind"
                    checked={markKind === "half_day"}
                    onChange={() => setMarkKind("half_day")}
                  />
                  Half day
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Note: Half-day time ke baad bhi allow hai. (Late ke bajay Half-day save hoga.)
                </p>
              </div>

              <button
                onClick={markAttendanceForDay}
                disabled={!selectedDate || !isToday(selectedDate) || marking}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {marking ? "Marking..." : isToday(selectedDate) ? "Mark Attendance" : "Sirf aaj mark kar sakte ho"}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 flex items-center gap-6">
          <ProgressRing
            value={attendanceRate}
            size={90}
            strokeWidth={8}
            label="Rate"
            color={attendanceRate >= 75 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
          />
          <div>
            <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
            <p className="text-sm text-muted-foreground">Attendance Rate</p>
            <p className="text-xs text-muted-foreground mt-1">{total} classes total</p>
          </div>
        </div>

        <div className="glass-card p-6 grid grid-cols-2 gap-3">
          {(["present", "absent", "late", "half_day"] as const).map(s => {
            const Icon = statusIcon[s];
            return (
              <div key={s} className={`flex items-center gap-2 p-2.5 rounded-lg ${statusBg[s]}`}>
                <Icon className={`w-4 h-4 ${statusColor[s]}`} />
                <div>
                  <p className={`text-lg font-bold ${statusColor[s]}`}>{counts[s] || 0}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{s}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No attendance records yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const Icon = statusIcon[r.status] || CheckCircle2;
            return (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-hover p-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${statusBg[r.status]}`}>
                  <Icon className={`w-5 h-5 ${statusColor[r.status]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.classes?.title || "Unknown Class"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.classes?.subject} · {r.classes?.scheduled_at ? format(new Date(r.classes.scheduled_at), "PPp") : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${statusBg[r.status]} ${statusColor[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
