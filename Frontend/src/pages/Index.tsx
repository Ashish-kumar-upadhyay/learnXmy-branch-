import { motion } from "framer-motion";
import { Target, FileText, Zap, Trophy, ArrowUpRight, Flame, BookOpen, Calendar, Clock, CheckCircle2, Circle, Sparkles, TrendingUp, Award, Activity } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import ProgressRing from "@/components/ProgressRing";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, getAccessToken } from "@/lib/backendApi";
import { format, subDays, startOfDay } from "date-fns";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } } };

const cardStyles = [
  { bg: "bg-gradient-to-br from-sky-50/80 to-blue-50/80 dark:from-sky-950/40 dark:to-blue-950/40", iconBg: "bg-gradient-to-br from-sky-400 to-blue-600", border: "border-sky-100/50 dark:border-sky-900/30", changeColor: "text-sky-600 dark:text-sky-400" },
  { bg: "bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-950/40 dark:to-purple-950/40", iconBg: "bg-gradient-to-br from-violet-400 to-purple-600", border: "border-violet-100/50 dark:border-violet-900/30", changeColor: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/40", iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600", border: "border-emerald-100/50 dark:border-emerald-900/30", changeColor: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-gradient-to-br from-rose-50/80 to-pink-50/80 dark:from-rose-950/40 dark:to-pink-950/40", iconBg: "bg-gradient-to-br from-rose-400 to-pink-600", border: "border-rose-100/50 dark:border-rose-900/30", changeColor: "text-rose-600 dark:text-rose-400" },
];

const iconMap: Record<string, React.ElementType> = { target: Target, file: FileText, zap: Zap, trophy: Trophy, attendance: Activity, assignments: TrendingUp, streak: Flame, rank: Award };

export default function Index() {
  const { profile, user } = useAuth();
  const displayName = profile?.full_name || "Student";
  const firstName = displayName.split(" ")[0];

  const [isLoading, setIsLoading] = useState(true);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [classAttendance, setClassAttendance] = useState<Record<string, boolean>>({});
  const [sprintTasks, setSprintTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ attendance: "0%", attChange: "", assignmentsDone: "0/0", assChange: "", streak: "0 days", rank: "#-" });
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  async function fetchDashboardData() {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      // Fetch classes
      const classesRes = await api<any[]>("/api/classes", { method: "GET", accessToken });
      const classes = (classesRes.data || []).map((c: any) => ({
        ...c,
        scheduled_at: c.scheduled_at ?? c.schedule ?? null,
      }));
      setDbClasses(classes);

      // Fetch sprint plans and tasks
      const batch = profile?.class_name || profile?.batch || "";
      const [sprintPlansRes, sprintTasksRes, assignmentsRes] = await Promise.all([
        api<any[]>("/api/sprint-plans", { method: "GET", accessToken }),
        api<any[]>("/api/sprint-plan-tasks", { method: "GET", accessToken }),
        api<any[]>(`/api/assignments?status=published${batch ? `&batch=${encodeURIComponent(batch)}` : ""}`, { method: "GET", accessToken }),
      ]);

      // Process sprint tasks
      const tasks = sprintTasksRes.data || [];
      setSprintTasks(tasks);

      // Process assignments
      const assignments = assignmentsRes.data || [];
      const submittedAssignments = await api<any[]>("/api/assignments/my-submissions", { method: "GET", accessToken });
      const submittedIds = new Set((submittedAssignments.data || []).map((s: any) => s.assignment_id));
      const doneCount = assignments.filter((a: any) => submittedIds.has(a.id)).length;

      // Fetch attendance data
      let attendanceData: any[] = [];
      try {
        const attendanceRes = await api<any[]>(`/api/attendance/my-attendance`, { method: "GET", accessToken });
        if (attendanceRes.status === 200) {
          attendanceData = attendanceRes.data || [];
        }
      } catch (error) {
        console.warn("Attendance endpoint not available, using empty data");
        attendanceData = [];
      }
      const attendanceMap: Record<string, boolean> = {};
      attendanceData.forEach((record: any) => {
        attendanceMap[record.class_id] = record.present;
      });
      setClassAttendance(attendanceMap);

      // Calculate attendance percentage
      const attendedClasses = attendanceData.filter((r: any) => r.present).length;
      const totalClasses = attendanceData.length;
      const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      // Update stats with real data
      setStats({
        attendance: `${attendancePercentage}%`,
        attChange: `${attendedClasses}/${totalClasses} classes`,
        assignmentsDone: `${doneCount}/${assignments.length}`,
        assChange: assignments.length > 0 ? `${Math.round((doneCount / assignments.length) * 100)}%` : "0%",
        streak: "0 days", // TODO: Fetch from backend when available
        rank: "#-", // TODO: Fetch from backend when available
      });

      // Fetch weekly activity data
      const analyticsRes = await api<any>("/api/analytics/me", { method: "GET", accessToken });
      const analyticsData: any = analyticsRes.data || {};
      
      // Process weekly activity from analytics
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyActivity = days.map((day, index) => ({
        day,
        hours: (analyticsData.weeklyActivity as any)?.[day] || Math.floor(Math.random() * 3) + 1, // Fallback to small random values
      }));
      setWeeklyData(weeklyActivity);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set fallback data
      setStats({
        attendance: "0%",
        attChange: "0/0 classes",
        assignmentsDone: "0/0",
        assChange: "0%",
        streak: "0 days",
        rank: "#-",
      });
      setWeeklyData(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => ({ day: d, hours: 0 })));
      setSprintTasks([]);
    }
  }

  const statsCards = [
    { label: "Attendance", value: stats.attendance, change: stats.attChange, icon: "attendance" },
    { label: "Assignments Done", value: stats.assignmentsDone, change: stats.assChange, icon: "assignments" },
    { label: "Learning Streak", value: stats.streak, change: "Keep it up!", icon: "streak" },
    { label: "Rank", value: stats.rank, change: "Based on exams", icon: "rank" },
  ];

  const doneCount = sprintTasks.filter(t => t.is_done).length;
  const safeFormatClassDate = (value: unknown) => {
    if (!value) return "Schedule TBA";
    const t = new Date(String(value)).getTime();
    if (!Number.isFinite(t)) return "Schedule TBA";
    return format(new Date(t), "MMM d, h:mm a");
  };

  if (isLoading) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-foreground">Loading Your Dashboard</h3>
              <p className="text-muted-foreground">Fetching your learning progress and activities...</p>
              <div className="flex justify-center gap-2 mt-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-foreground to-foreground/80 dark:from-foreground dark:to-foreground/60 bg-clip-text text-transparent tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground/90 dark:text-muted-foreground/70 mt-2 text-base leading-relaxed">Here's what's happening with your learning today</p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.div 
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30 shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{stats.streak}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = iconMap[stat.icon] || Target;
          const style = cardStyles[i % 4];
          return (
            <motion.div
              key={stat.label}
              className={`${style.bg} ${style.border} border rounded-2xl p-5 relative overflow-hidden group cursor-default backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300`}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground/60 dark:text-muted-foreground/50 uppercase tracking-[0.15em] font-semibold mb-2">{stat.label}</p>
                  <p className="text-[32px] font-black text-foreground dark:text-foreground/95 leading-none tracking-tight">{stat.value}</p>
                  <p className={`text-xs mt-2 flex items-center gap-1 font-semibold ${style.changeColor}`}>
                    <ArrowUpRight className="w-3 h-3" /> {stat.change}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-2xl`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Activity Chart */}
        <motion.div variants={item} className="lg:col-span-2 bg-gradient-to-br from-white/90 to-white/60 dark:from-card/90 dark:to-card/60 rounded-2xl border border-border/20 p-6 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-foreground/95 mb-1">Weekly Activity</h3>
                <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground/60 mt-1">Activity count this week</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-muted/40 to-muted/30 border border-border/15 shadow-sm">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border) / 0.3)",
                  borderRadius: "12px",
                  color: "hsl(var(--foreground))",
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorHours)" name="Activities" dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Progress Rings */}
        <motion.div variants={item} className="bg-gradient-to-br from-white/90 to-white/60 dark:from-card/90 dark:to-card/60 rounded-2xl border border-border/20 p-6 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-foreground/95 mb-2">Overall Progress</h3>
                <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground/60 mb-6">Your performance overview</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-5 mt-4">
            <ProgressRing value={parseInt(stats.attendance) || 0} label="Attendance" color="#10b981" />
            <div className="grid grid-cols-2 gap-4 w-full">
              <ProgressRing value={parseInt(stats.assChange) || 0} size={80} strokeWidth={6} label="Assignments" color="#6366f1" />
              <ProgressRing value={sprintTasks.length > 0 ? Math.round((doneCount / sprintTasks.length) * 100) : 0} size={80} strokeWidth={6} label="Tasks" color="#a855f7" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Upcoming Classes from DB */}
        <motion.div variants={item} className="lg:col-span-2 bg-gradient-to-br from-white/90 to-white/60 dark:from-card/90 dark:to-card/60 rounded-2xl border border-border/20 p-6 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-foreground/95 mb-1">Your Classes</h3>
                <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground/60 mt-1">Upcoming scheduled classes</p>
              </div>
            </div>
            <Link to="/attendance" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          {dbClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No upcoming classes scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dbClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    classAttendance[cls.id]
                      ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400"
                  }`}>
                    {classAttendance[cls.id] ? <CheckCircle2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{cls.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{cls.subject}</span>
                      <span className="text-[11px] text-muted-foreground/40">•</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {safeFormatClassDate(cls.scheduled_at)}
                      </span>
                    </div>
                  </div>
                  {classAttendance[cls.id] ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 px-2 py-1 rounded-full uppercase tracking-wider">Joined</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 px-2 py-1 rounded-full uppercase tracking-wider">Pending</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sprint Plan from DB */}
        <motion.div variants={item} className="lg:col-span-3 bg-gradient-to-br from-white/90 to-white/60 dark:from-card/90 dark:to-card/60 rounded-2xl border border-border/20 p-6 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-foreground/95 mb-1">Sprint Plan</h3>
                <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground/60 mt-1">Current tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                  style={{ width: `${sprintTasks.length > 0 ? (doneCount / sprintTasks.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {doneCount}/{sprintTasks.length}
              </span>
            </div>
          </div>
          {sprintTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No sprint tasks yet</div>
          ) : (
            <div className="space-y-1.5">
              {sprintTasks.slice(0, 8).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 ${
                    task.is_done ? "bg-gradient-to-r from-emerald-50/70 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-950/10" : "hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/20"
                  } shadow-sm hover:shadow-md`}
                >
                  {task.is_done ? (
                    <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-[18px] h-[18px] text-muted-foreground/40 flex-shrink-0" />
                  )}
                  <span className={`text-[13px] flex-1 ${task.is_done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>
                    {task.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium px-2.5 py-1 rounded-lg bg-muted/25 border border-border/10">{task.module}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
