import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, getAccessToken } from "@/lib/backendApi";

interface MissedDay {
  date: string;
  status: 'absent' | 'late';
  title: string;
  subject: string;
}

interface UnmarkedDay {
  date: string;
  title: string;
  subject: string;
  status: 'unmarked';
}

interface AttendanceSummary {
  totalClasses: number;
  missedClasses: number;
  unmarkedClasses: number;
}

export function useDashboardData() {
  const { profile } = useAuth();
  const batch = profile?.class_name || profile?.batch || "";

  return useQuery({
    queryKey: ["dashboard", batch],
    queryFn: async () => {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("No access token");

      const [
        classesRes,
        sprintPlansRes,
        sprintTasksRes,
        assignmentsRes,
        submittedAssignmentsRes,
        attendanceRes,
        analyticsRes
      ] = await Promise.all([
        api<any[]>("/api/classes", { method: "GET", accessToken, useCache: true, cacheTTL: 2 * 60 * 1000 }),
        api<any[]>("/api/sprint-plans", { method: "GET", accessToken, useCache: true, cacheTTL: 5 * 60 * 1000 }),
        api<any[]>("/api/sprint-plan-tasks", { method: "GET", accessToken, useCache: true, cacheTTL: 5 * 60 * 1000 }),
        api<any[]>(`/api/assignments?status=published${batch ? `&batch=${encodeURIComponent(batch)}` : ""}`, { method: "GET", accessToken, useCache: true, cacheTTL: 3 * 60 * 1000 }),
        api<any[]>("/api/assignments/my-submissions", { method: "GET", accessToken, useCache: true, cacheTTL: 2 * 60 * 1000 }),
        api<any[]>("/api/attendance/my-attendance", { method: "GET", accessToken, useCache: true, cacheTTL: 10 * 60 * 1000 }).catch(() => ({ data: [] })),
        api<any>("/api/analytics/me", { method: "GET", accessToken, useCache: true, cacheTTL: 5 * 60 * 1000 }).catch(() => ({ data: {} }))
      ]);

      // Process all data
      const classes = (classesRes.data || []).map((c: any) => ({
        ...c,
        scheduled_at: c.scheduled_at ?? c.schedule ?? null,
      }));

      const tasks = sprintTasksRes.data || [];
      const assignments = assignmentsRes.data || [];
      const submittedIds = new Set((submittedAssignmentsRes.data || []).map((s: any) => s.assignment_id));
      const doneCount = assignments.filter((a: any) => submittedIds.has(a.id)).length;

      const attendanceData = attendanceRes.data || [];
      const attendanceMap: Record<string, boolean> = {};
      attendanceData.forEach((record: any) => {
        attendanceMap[record.class_id] = record.present;
      });

      const attendedClasses = attendanceData.filter((r: any) => r.present).length;
      const totalClasses = attendanceData.length;
      const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      const analyticsData = analyticsRes.data || {};
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyActivity = days.map((day, index) => ({
        day,
        hours: (analyticsData.weeklyActivity as any)?.[day] || Math.floor(Math.random() * 3) + 1,
      }));

      return {
        classes,
        tasks,
        attendanceMap,
        stats: {
          attendance: `${attendancePercentage}%`,
          attChange: `${attendedClasses}/${totalClasses} classes`,
          assignmentsDone: `${doneCount}/${assignments.length}`,
          assChange: assignments.length > 0 ? `${Math.round((doneCount / assignments.length) * 100)}%` : "0%",
          streak: "0 days",
          rank: "#-",
        },
        weeklyData: weeklyActivity,
        missedDays: (analyticsData.missedDays || []) as MissedDay[],
        unmarkedDays: (analyticsData.unmarkedDays || []) as UnmarkedDay[],
        attendanceSummary: (analyticsData.attendanceSummary || {
          totalClasses: 0,
          missedClasses: 0,
          unmarkedClasses: 0
        }) as AttendanceSummary,
      };
    },
    enabled: !!profile,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
