import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TimetableEntry {
  id: string;
  batch: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  teacher_id: string;
  room: string | null;
  teacher_name?: string;
}

/** Normalize batch labels so "10", "Batch 10", and "Class 10" match. */
function timetableBatchKey(b?: string | null) {
  let s = String(b ?? "").trim();
  s = s.replace(/^batch\s+/i, "").replace(/^class\s+/i, "").trim();
  return s.toLowerCase();
}

export default function Timetable() {
  const { user, roles, profile } = useAuth();
  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  /** `null` = Week (Sun–Sat). `0–6` = that weekday only. */
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    batch: profile?.class_name || "A",
    day_of_week: typeof selectedDay === "number" ? selectedDay : new Date().getDay(),
    start_time: "09:00",
    end_time: "10:00",
    subject: "",
    room: "",
  });
  const [batches, setBatches] = useState<string[]>([]);

  useEffect(() => {
    if (user) void fetchEntries();
  }, [user]);

  const refreshBatches = (rows: TimetableEntry[]) => {
    const byKey = new Map<string, string>();
    for (const r of rows) {
      const k = timetableBatchKey(r.batch);
      if (!k) continue;
      if (!byKey.has(k)) byKey.set(k, String(r.batch).trim());
    }
    const unique = Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const fallback = profile?.class_name ? [profile.class_name] : ["A", "B", "C"];
    setBatches(unique.length > 0 ? unique : fallback);
  };

  const fetchEntries = async () => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    const res = await api<TimetableEntry[]>("/api/timetable", {
      method: "GET",
      accessToken: token,
    });
    if (res.status !== 200 || !res.data) { setLoading(false); return; }
    setEntries(res.data);
    refreshBatches(res.data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.subject || !form.start_time || !form.end_time) { toast.error("Fill all required fields"); return; }
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api("/api/timetable", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
      batch: form.batch,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      subject: form.subject,
      teacher_id: user!.id,
      room: form.room || null,
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to add"); return; }
    toast.success("Added to timetable!");
    setShowForm(false);
    setForm({ ...form, subject: "", room: "" });
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api(`/api/timetable/${id}`, { method: "DELETE", accessToken: token });
    if (res.status !== 200) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    fetchEntries();
  };

  const showAllDays = selectedDay === null;
  const filtered = entries.filter((e) => {
    const d = Number(e.day_of_week);
    const dayOk = showAllDays || (Number.isFinite(d) && d === Number(selectedDay));
    return dayOk;
  });

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  const colors = [
    "from-sky-500/10 to-sky-500/5 border-sky-500/20",
    "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    "from-rose-500/10 to-rose-500/5 border-rose-500/20",
    "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📅 Timetable</h1>
          <p className="text-sm text-muted-foreground">Weekly class schedule</p>
        </div>
        {(isAdmin || isTeacher) && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Add Class
          </button>
        )}
      </div>

      {/* Day selector: "Week" shows Sun–Sat together; a weekday zooms to that day */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setSelectedDay(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0
            ${showAllDays ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
        >
          <span className="hidden sm:inline">Week</span>
          <span className="sm:hidden">All</span>
        </button>
        {DAYS.map((day, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedDay(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0
              ${!showAllDays && selectedDay === i ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DAY_SHORT[i]}</span>
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Add New Class Slot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Subject *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="Mathematics" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Day *</label>
              <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Batch *</label>
              <select value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Time *</label>
              <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Time *</label>
              <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Room</label>
              <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="Room 101" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Save</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm hover:text-foreground">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Timetable entries */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {showAllDays
              ? "No classes in the timetable yet."
              : `No classes on ${DAYS[selectedDay as number]}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...filtered]
            .sort((a, b) =>
              showAllDays
                ? Number(a.day_of_week) - Number(b.day_of_week) || a.start_time.localeCompare(b.start_time)
                : a.start_time.localeCompare(b.start_time)
            )
            .map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r ${colors[idx % colors.length]} backdrop-blur-sm`}
            >
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-sm font-bold text-foreground">{formatTime(entry.start_time)}</span>
                <span className="text-[10px] text-muted-foreground">to</span>
                <span className="text-xs text-muted-foreground">{formatTime(entry.end_time)}</span>
              </div>
              <div className="w-px h-10 bg-border/20" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{entry.subject}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {showAllDays && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground font-medium">
                      {DAYS[Number(entry.day_of_week)] ?? "Day"}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">👨‍🏫 {entry.teacher_name}</span>
                  {entry.room && <span className="text-xs text-muted-foreground">📍 {entry.room}</span>}
                </div>
              </div>
              {(isAdmin || (isTeacher && entry.teacher_id === user?.id)) && (
                <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
