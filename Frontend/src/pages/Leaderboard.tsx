import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Award, Loader2, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, getAccessToken } from "@/lib/backendApi";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface LeaderEntry {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  examAvg: number;
  assignmentsDone: number;
  userId: string;
  isYou: boolean;
  badge: string;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  async function fetchLeaderboard() {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    const res = await api<LeaderEntry[]>("/api/analytics/leaderboard", {
      method: "GET",
      accessToken: token,
    });
    if (res.status === 200 && res.data) {
      setEntries(res.data);
    } else {
      setEntries([]);
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
        <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">Real rankings based on exams, assignments & attendance</p>
      </motion.div>

      {entries.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No students yet</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <motion.div variants={item} className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
              {[1, 0, 2].map((idx) => {
                const entry = entries[idx];
                if (!entry) return null;
                return (
                  <div key={entry.rank} className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                      entry.isYou ? "glow-ring" : ""
                    }`} style={{ background: "var(--gradient-primary)" }}>
                      <span className="text-primary-foreground">{entry.avatar}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground text-center">{entry.name}</span>
                    <span className="text-2xl mt-1">{entry.badge}</span>
                    <span className="text-xs text-muted-foreground font-mono">{entry.xp} XP</span>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Full list */}
          <div className="space-y-2">
            {entries.map((entry) => (
              <motion.div
                key={entry.rank}
                variants={item}
                className={`glass-card-hover p-4 flex items-center gap-4 ${
                  entry.isYou ? "border-primary/30 glow-ring" : ""
                }`}
              >
                <span className="w-8 text-center font-bold text-lg text-muted-foreground font-mono">
                  {entry.rank}
                </span>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--gradient-primary)" }}>
                  <span className="text-primary-foreground">{entry.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{entry.name}</span>
                    {entry.isYou && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">You</span>}
                    {entry.badge && <span className="text-lg">{entry.badge}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span>📊 Exam Avg: {entry.examAvg}%</span>
                    <span>📝 {entry.assignmentsDone} assignments</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-mono font-semibold text-foreground">{entry.xp} XP</span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
