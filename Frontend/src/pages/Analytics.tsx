import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import ProgressRing from "@/components/ProgressRing";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { api, getAccessToken } from "@/lib/backendApi";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [assignmentPercent, setAssignmentPercent] = useState(0);
  const [examAvg, setExamAvg] = useState(0);
  const [sprintPercent, setSprintPercent] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ week: string; attendance: number; assignments: number; exams: number }[]>([]);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  async function fetchAnalytics() {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const res = await api<{
      attendancePercent: number;
      assignmentPercent: number;
      examAvg: number;
      sprintPercent: number;
      weeklyData: { week: string; attendance: number; assignments: number; exams: number }[];
    }>("/api/analytics/me", {
      method: "GET",
      accessToken: token,
    });

    if (res.status === 200 && res.data) {
      setAttendancePercent(res.data.attendancePercent ?? 0);
      setAssignmentPercent(res.data.assignmentPercent ?? 0);
      setExamAvg(res.data.examAvg ?? 0);
      setSprintPercent(res.data.sprintPercent ?? 0);
      setWeeklyData(res.data.weeklyData ?? []);
    } else {
      setAttendancePercent(0);
      setAssignmentPercent(0);
      setExamAvg(0);
      setSprintPercent(0);
      setWeeklyData([]);
    }
    setLoading(false);
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
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your real learning journey</p>
      </motion.div>

      {/* Summary rings */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex flex-col items-center">
          <ProgressRing value={attendancePercent} size={90} strokeWidth={7} label="Attendance" color="hsl(var(--success))" />
        </div>
        <div className="glass-card p-6 flex flex-col items-center">
          <ProgressRing value={assignmentPercent} size={90} strokeWidth={7} label="Assignments" color="hsl(var(--primary))" />
        </div>
        <div className="glass-card p-6 flex flex-col items-center">
          <ProgressRing value={examAvg} size={90} strokeWidth={7} label="Exam Avg" color="hsl(var(--secondary))" />
        </div>
        <div className="glass-card p-6 flex flex-col items-center">
          <ProgressRing value={sprintPercent} size={90} strokeWidth={7} label="Sprint Tasks" color="hsl(var(--warning))" />
        </div>
      </motion.div>

      {/* Line chart */}
      <motion.div variants={item} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
            <Legend />
            <Line type="monotone" dataKey="attendance" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} name="Attendance %" />
            <Line type="monotone" dataKey="assignments" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Assignments %" />
            <Line type="monotone" dataKey="exams" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 4 }} name="Exam Avg %" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Area chart */}
      <motion.div variants={item} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Exam Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
            <Area type="monotone" dataKey="exams" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} name="Exam %" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
