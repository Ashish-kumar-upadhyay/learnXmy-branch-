import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCircle2, ClipboardCheck, FileText, Megaphone, Info, Loader2, PenTool, Clock, IndianRupee, CalendarOff, BookOpen, LifeBuoy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { api, getAccessToken } from "@/lib/backendApi";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const typeIcons: Record<string, any> = {
  attendance_reminder: ClipboardCheck,
  assignment: FileText,
  assignment_submission: FileText,
  assignment_review: FileText,
  announcement: Megaphone,
  info: Info,
  exam: PenTool,
  timetable: Clock,
  fee: IndianRupee,
  leave: CalendarOff,
  lecture: BookOpen,
  leave_response: CalendarOff,
  support_ticket: LifeBuoy,
};

const typeColors: Record<string, string> = {
  attendance_reminder: "text-warning",
  assignment: "text-primary",
  announcement: "text-info",
  info: "text-muted-foreground",
  exam: "text-violet-500",
  timetable: "text-sky-500",
  fee: "text-emerald-500",
  leave: "text-orange-500",
  lecture: "text-pink-500",
  leave_response: "text-orange-500",
  support_ticket: "text-sky-500",
};

// Map notification type to route
const typeRoutes: Record<string, string> = {
  assignment: "/assignments",
  assignment_submission: "/teacher?tab=assignments",
  assignment_review: "/assignments",
  exam: "/exams",
  attendance_reminder: "/attendance",
  announcement: "/notifications",
  timetable: "/timetable",
  fee: "/fees",
  leave: "/leave-requests",
  lecture: "/lectures",
  leave_response: "/leave-requests",
  support_ticket: "/support",
  info: "/notifications",
};

type DbNotification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  target_path?: string | null;
  is_read: boolean;
  created_at?: string;
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dbNotifications, setDbNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => localStorage.getItem("learnx_notification_sound") !== "off");

  const PAGE_SIZE = 20;
  const safeTs = (d?: string) => {
    const t = d ? new Date(d).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };
  const playNotificationBeep = () => {
    if (!soundEnabled) return;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      o.start(now);
      o.stop(now + 0.22);
    } catch {
      // ignore audio failures
    }
  };

  useEffect(() => {
    if (!user) return;
    void fetchNotifications(true);
    const t = window.setInterval(() => {
      void refreshLatestAndNotify();
    }, 15000);
    return () => window.clearInterval(t);
  }, [user]);

  useEffect(() => {
    localStorage.setItem("learnx_notification_sound", soundEnabled ? "on" : "off");
    window.dispatchEvent(new Event("learnx-notification-sound"));
  }, [soundEnabled]);

  async function fetchNotifications(reset = false) {
    if (reset) setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) {
      setDbNotifications([]);
      setLoading(false);
      return;
    }
    const currentOffset = reset ? 0 : offset;
    const res = await api<DbNotification[]>(
      `/api/notifications?limit=${PAGE_SIZE}&offset=${currentOffset}`,
      { method: "GET", accessToken }
    );
    if (res.status === 200 && res.data) {
      const rows = res.data;
      setHasMore(rows.length === PAGE_SIZE);
      if (reset) {
        setDbNotifications(rows);
        setOffset(rows.length);
      } else {
        setDbNotifications(prev => [...prev, ...rows]);
        setOffset(prev => prev + rows.length);
      }
    }
    setLoading(false);
  }

  async function refreshLatestAndNotify() {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const res = await api<DbNotification[]>(`/api/notifications?limit=${PAGE_SIZE}&offset=0`, {
      method: "GET",
      accessToken,
    });
    if (res.status !== 200 || !res.data) return;
    const latest = res.data;
    setDbNotifications((prev) => {
      const known = new Set(prev.map((n) => n._id));
      const hasNew = latest.some((n) => !known.has(n._id));
      if (hasNew) playNotificationBeep();
      const prevMap = new Map(prev.map((p) => [p._id, p]));
      latest.forEach((n) => prevMap.set(n._id, n));
      const merged = Array.from(prevMap.values()).sort(
        (a, b) => safeTs(b.created_at) - safeTs(a.created_at)
      );
      return merged;
    });
  }

  async function markAllRead() {
    const unread = dbNotifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;
    for (const n of unread) {
      await api(`/api/notifications/${n._id}/read`, { method: "PUT", accessToken });
    }
    await fetchNotifications(true);
  }

  async function handleClick(n: DbNotification) {
    // Mark as read
    if (!n.is_read) {
      const accessToken = getAccessToken();
      if (accessToken) {
        await api(`/api/notifications/${n._id}/read`, { method: "PUT", accessToken });
      }
      setDbNotifications(prev => prev.map(x => x._id === n._id ? { ...x, is_read: true } : x));
    }
    // Navigate to relevant page
    const route = n.target_path || typeRoutes[n.type] || "/notifications";
    if (route !== "/notifications") {
      navigate(route);
    }
  }

  const unreadCount = dbNotifications.filter(n => !n.is_read).length;

  function timeAgo(dateStr: string) {
    const ts = safeTs(dateStr);
    const diff = Date.now() - ts;
    if (diff < 0) return "Just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    if (!ts) return "Just now";
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">{unreadCount} unread</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sound: {soundEnabled ? "On" : "Off"}
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-primary hover:underline">Mark all as read</button>
          )}
        </div>
      </motion.div>

      {dbNotifications.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No notifications yet</p>
          <p className="text-xs mt-1">You'll receive notifications for assignments, exams, announcements, and more.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dbNotifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            const color = typeColors[n.type] || "text-muted-foreground";
            const hasRoute = typeRoutes[n.type] && typeRoutes[n.type] !== "/notifications";
            return (
              <motion.div
                key={n._id}
                variants={item}
                onClick={() => handleClick(n)}
                className={`glass-card-hover p-4 flex items-start gap-4 cursor-pointer transition-all ${!n.is_read ? "border-l-2 border-l-primary" : "opacity-70"}`}
              >
                <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "text-foreground font-medium" : "text-muted-foreground"}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-muted-foreground">{timeAgo(n.created_at || "")}</p>
                    {hasRoute && (
                      <span className="text-[10px] text-primary/70 font-medium">
                        Tap to view →
                      </span>
                    )}
                  </div>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </motion.div>
            );
          })}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={() => fetchNotifications(false)}
                className="text-sm text-primary hover:underline"
              >
                Load older notifications
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
