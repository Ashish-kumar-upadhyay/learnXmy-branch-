import { motion } from "framer-motion";
import { Target, FileText, Zap, Trophy, ArrowUpRight, Flame, BookOpen, Calendar, Clock, CheckCircle2, Circle, Sparkles, TrendingUp, Award, Activity } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import ProgressRing from "@/components/ProgressRing";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Link } from "react-router-dom";
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
  const { data: dashboardData, isLoading, error } = useDashboardData();
  
  const displayName = profile?.full_name || "Student";
  const firstName = displayName.split(" ")[0];

  // Extract data from React Query
  const dbClasses = dashboardData?.classes || [];
  const classAttendance = dashboardData?.attendanceMap || {};
  const sprintTasks = dashboardData?.tasks || [];
  const stats = dashboardData?.stats || { attendance: "0%", attChange: "0/0 classes", assignmentsDone: "0/0", assChange: "0%", streak: "0 days", rank: "#-" };
  const weeklyData = dashboardData?.weeklyData || [];
  const missedDays = dashboardData?.missedDays || [];
  const unmarkedDays = dashboardData?.unmarkedDays || [];
  const attendanceSummary = dashboardData?.attendanceSummary || { totalClasses: 0, missedClasses: 0, unmarkedClasses: 0 };

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
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
              />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Loading Student Dashboard</h3>
                <p className="text-sm text-muted-foreground">Fetching your learning progress and activities...</p>
                <div className="flex justify-center gap-2 mt-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-muted-foreground">Please refresh the page and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-normal bg-gradient-to-r from-foreground to-foreground/80 dark:from-foreground dark:to-foreground/60 bg-clip-text text-transparent tracking-tight">
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
            <span className="text-sm font-normal text-amber-700 dark:text-amber-400">{stats.streak}</span>
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
                  <p className="text-[10px] text-muted-foreground/60 dark:text-muted-foreground/50 uppercase tracking-[0.15em] font-normal mb-2">{stat.label}</p>
                  <p className="text-[32px] font-normal text-foreground dark:text-foreground/95 leading-none tracking-tight">{stat.value}</p>
                  <p className={`text-xs mt-2 flex items-center gap-1 font-normal ${style.changeColor}`}>
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
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
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
      </motion.div>

      {/* Attendance Insights Section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Missed Days */}
        <motion.div className="bg-gradient-to-br from-red-50/80 to-orange-50/80 dark:from-red-950/40 dark:to-orange-950/40 rounded-2xl border border-red-100/50 dark:border-red-900/30 p-6 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Circle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-foreground/95 mb-1">Missed Attendance</h3>
                <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground/60">Classes you missed or were late</p>
              </div>
            </div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30 px-3 py-1.5 rounded-full">
              {attendanceSummary.missedClasses} days
            </span>
          </div>
          {missedDays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p>Great! No missed classes in last 30 days</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {missedDays.slice(0, 5).map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-100/50 dark:bg-red-950/20 border border-red-200/30 dark:border-red-800/30"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{day.title}</p>
                    <p className="text-xs text-muted-foreground">{day.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 capitalize">
                      {day.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(day.date), "MMM d")}
                    </p>
                  </div>
                </motion.div>
              ))}
              {missedDays.length > 5 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{missedDays.length - 5} more missed classes
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Unmarked Days */}
        <motion.div className="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-amber-950/40 dark:to-yellow-950/40 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 p-6 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-foreground/95 mb-1">Unmarked Attendance</h3>
                <p className="text-sm text-muted-foreground/70 dark:text-muted-foreground/60">Classes without attendance record</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 px-3 py-1.5 rounded-full">
              {attendanceSummary.unmarkedClasses} days
            </span>
          </div>
          {unmarkedDays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p>All classes have attendance records!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {unmarkedDays.slice(0, 5).map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{day.title}</p>
                    <p className="text-xs text-muted-foreground">{day.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Not Marked
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(day.date), "MMM d")}
                    </p>
                  </div>
                </motion.div>
              ))}
              {unmarkedDays.length > 5 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{unmarkedDays.length - 5} more unmarked classes
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
