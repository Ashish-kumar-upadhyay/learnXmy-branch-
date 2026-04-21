import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, Loader2, Trash2, X, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";
import { useNavigate } from "react-router-dom";

interface SprintPlan {
  id: string;
  title: string;
  description: string | null;
  week_start: string;
  week_end: string;
  batch: string | null;
  created_by: string;
  created_at: string;
}

interface SprintTask {
  id: string;
  sprint_plan_id: string;
  title: string;
  module: string;
  is_done: boolean;
  sort_order: number;
  link?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  reference_link?: string | null;
  start_date?: string;
  due_date: string;
  max_score: number | null;
  status: string;
  batch: string | null;
  duration_hours: number | null;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${h}:00`);
  if (h < 17) TIME_SLOTS.push(`${h}:30`);
}

const DAY_COLORS = [
  "bg-primary/80 text-primary-foreground",
  "bg-accent/80 text-accent-foreground",
  "bg-info/80 text-info-foreground",
  "bg-warning/80 text-warning-foreground",
  "bg-success/80 text-success-foreground",
];

const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30",
  Assignment: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Quiz: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
  General: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
};

const CATEGORIES = ["All", "Lecture", "Assignment", "Quiz", "General"];

export default function SprintPlan() {
  const { roles, user, profile } = useAuth();
  const isAdmin = roles.includes("admin");
  const navigate = useNavigate();

  const [plans, setPlans] = useState<SprintPlan[]>([]);
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", week_start: "", week_end: "", batch: "" });
  const [saving, setSaving] = useState(false);
  const [addingTask, setAddingTask] = useState<{ day: number; time: string } | null>(null);
  const [newTask, setNewTask] = useState({ title: "", module: "General", link: "" });
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [addingTaskLoading, setAddingTaskLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ taskId: string; taskTitle: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    if (!user) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;

    const batch = profile?.class_name || profile?.batch || "";
    const [plansRes, tasksRes, assignRes] = await Promise.all([
      api<SprintPlan[]>("/api/sprint-plans", { method: "GET", accessToken }),
      api<SprintTask[]>("/api/sprint-plan-tasks", { method: "GET", accessToken }),
      api<Assignment[]>(
        `/api/assignments?status=published${batch ? `&batch=${encodeURIComponent(batch)}` : ""}`,
        { method: "GET", accessToken }
      ),
    ]);

    if (plansRes.status === 200 && plansRes.data) setPlans(plansRes.data);
    if (tasksRes.status === 200 && tasksRes.data) setTasks(tasksRes.data);
    if (assignRes.status === 200 && assignRes.data) {
      console.log("Assignments fetched from API:", assignRes.data);
      setAssignments(assignRes.data);
    } else {
      console.log("Assignments fetch failed:", assignRes);
    }
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, [user, roles]);

  const currentPlan = plans[currentIndex] || null;
  const planTasks = useMemo(() => {
    const all = currentPlan ? tasks.filter(t => t.sprint_plan_id === currentPlan.id) : [];
    if (categoryFilter === "All") return all;
    return all.filter(t => t.module === categoryFilter);
  }, [currentPlan, tasks, categoryFilter]);

  // Merge assignments into the grid if they fall within the current plan's week
  const mergedTasks = useMemo(() => {
    console.log("Current sprint plan:", currentPlan);
    console.log("All assignments:", assignments);
    
    if (!currentPlan || !currentPlan.week_start || !currentPlan.week_end) {
      console.log("No current plan or dates, returning planTasks only");
      return planTasks;
    }

    const planStart = new Date(currentPlan.week_start);
    const planEnd = new Date(currentPlan.week_end);
    console.log("Sprint plan date range:", planStart.toLocaleDateString(), "to", planEnd.toLocaleDateString());
    
    // Temporarily show all assignments for debugging
    const relevantAssignments = assignments.filter(assign => {
      const dueDate = new Date(assign.due_date);
      const startDate = assign.start_date ? new Date(assign.start_date) : dueDate;

      console.log(`Assignment "${assign.title}":`);
      console.log("  - Due date:", assign.due_date, "=>", dueDate.toLocaleDateString());
      console.log("  - Start date:", assign.start_date || "Not set", "=>", startDate.toLocaleDateString());
      console.log("  - Status:", assign.status);
      console.log("  - Batch:", assign.batch);
      
      // Temporarily return true for all assignments to see if they appear
      return true;
    });
    console.log("Relevant assignments (showing all for debugging):", relevantAssignments);

    // Convert assignments to task-like objects and place them in appropriate time slots for each day
    const assignmentTasks: SprintTask[] = [];
    relevantAssignments.forEach(assign => {
      const dueDate = new Date(assign.due_date);
      const startDate = assign.start_date ? new Date(assign.start_date) : dueDate; // If no start_date, use due_date
      
      // Create tasks for each day from start_date to due_date
      const currentDate = new Date(startDate);
      while (currentDate <= dueDate) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-4 (Mon-Fri)
        
        // Only show on weekdays (Mon-Fri)
        if (adjustedDay >= 0 && adjustedDay <= 4) {
          // Use 9:00 AM as default time for multi-day assignments
          const timeIndex = TIME_SLOTS.indexOf("9:00");
          
          // Generate a unique ID for each day's task
          const assignmentId = `assign-${assign.id}-${adjustedDay}`;
          
          assignmentTasks.push({
            id: assignmentId,
            sprint_plan_id: currentPlan.id,
            title: assign.title,
            module: "Assignment",
            is_done: false,
            sort_order: adjustedDay * 100 + (timeIndex >= 0 ? timeIndex : 0),
            link: `/assignments#${assign.id}`, // Link to assignments page with hash
            isAssignment: true, // Flag to identify assignments
            originalId: assign.id, // Store original assignment ID
            assignmentDay: adjustedDay, // Store which day this represents
          } as SprintTask & { isAssignment: boolean; originalId: string; assignmentDay: number });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Combine manual tasks and assignments
    const combined = [...planTasks, ...assignmentTasks];
    
    // Filter by category if needed
    if (categoryFilter === "All") {
      return combined;
    }
    const filtered = combined.filter(t => t.module === categoryFilter);
    return filtered;
  }, [currentPlan, planTasks, assignments, categoryFilter]);

  // Map tasks to grid: sort_order encodes day*100 + timeIndex
  const taskGrid = useMemo(() => {
    const grid: Record<string, SprintTask[]> = {};
    mergedTasks.forEach(t => {
      const day = Math.floor(t.sort_order / 100);
      const timeIdx = t.sort_order % 100;
      const key = `${day}-${timeIdx}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(t);
    });
    return grid;
  }, [mergedTasks]);

  const savePlan = async () => {
    if (!form.title || !form.week_start || !form.week_end) {
      toast.error("Title, start date and end date required");
      return;
    }
    setSaving(true);
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); setSaving(false); return; }

    const res = await api("/api/sprint-plans", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        week_start: form.week_start,
        week_end: form.week_end,
        batch: form.batch || null,
      }),
    });
    if (res.status !== 201 && res.status !== 200) {
      toast.error("Failed to create sprint plan");
      setSaving(false);
      return;
    }
    toast.success("Sprint plan created! 🎯");
    setForm({ title: "", description: "", week_start: "", week_end: "", batch: "" });
    setShowForm(false);
    setSaving(false);
    await fetchData();
    setCurrentIndex(0);
  };

  const deletePlan = async () => {
    if (!currentPlan || !confirm("Delete this sprint plan?")) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const res = await api(`/api/sprint-plans/${currentPlan.id}`, { method: "DELETE", accessToken });
    if (res.status !== 200) toast.error("Delete failed");
    toast.success("Deleted!");
    await fetchData();
    setCurrentIndex(0);
  };

  const addTask = async () => {
    if (!addingTask || !newTask.title || !currentPlan) return;
    setAddingTaskLoading(true);
    try {
      const sortOrder = addingTask.day * 100 + TIME_SLOTS.indexOf(addingTask.time);
      const accessToken = getAccessToken();
      if (!accessToken) { toast.error("Login required"); return; }
      const res = await api("/api/sprint-plan-tasks", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          sprint_plan_id: currentPlan.id,
          title: newTask.title,
          module: newTask.module || "General",
          sort_order: sortOrder,
          link: newTask.link || null,
        }),
      });
      if (res.status !== 201 && res.status !== 200) {
        toast.error("Failed to add task");
        return;
      }
      toast.success("Task added!");
      setNewTask({ title: "", module: "General", link: "" });
      setAddingTask(null);
      fetchData();
    } finally {
      setAddingTaskLoading(false);
    }
  };

  const toggleTask = async (taskId: string, done: boolean) => {
    if (!isAdmin) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const res = await api(`/api/sprint-plan-tasks/${taskId}`, {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ is_done: !done }),
    });
    if (res.status !== 200) toast.error("Update failed");
    fetchData();
  };

  const deleteTask = async (taskId: string, taskTitle: string) => {
    console.log("Delete button clicked - Task ID:", taskId, "Task Title:", taskTitle);
    setDeleteConfirm({ taskId, taskTitle });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { taskId } = deleteConfirm;
    console.log("Attempting to delete task:", taskId);
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); setDeleteConfirm(null); return; }
    const res = await api(`/api/sprint-plan-tasks/${taskId}`, { method: "DELETE", accessToken });
    console.log("Delete API response:", res);
    if (res.status !== 200) {
      console.log("Delete failed with status:", res.status);
      toast.error("Failed to delete task");
      setDeleteConfirm(null);
      return;
    }
    toast.success("Activity deleted!");
    setDeleteConfirm(null);
    fetchData();
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            <span className="gradient-text">My Weekly Schedule</span>
            {currentPlan && <span className="text-muted-foreground font-normal text-lg"> – {currentPlan.title}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}
            >
              <Plus className="w-4 h-4" />
              {showForm ? "Cancel" : "Create Sprint"}
            </button>
          )}
          {plans.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentIndex(i => Math.min(i + 1, plans.length - 1))}
                disabled={currentIndex >= plans.length - 1}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Sprint
              </button>
              <span className="px-3 py-2 text-sm font-bold text-foreground">
                Sprint {plans.length - currentIndex}
              </span>
              <button
                onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
                disabled={currentIndex <= 0}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1"
              >
                Next Sprint <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {isAdmin && currentPlan && (
            <button onClick={deletePlan} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              categoryFilter === cat
                ? cat === "All" ? "bg-primary text-primary-foreground border-primary" : `${CATEGORY_COLORS[cat]} border`
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      {/* Debug: Show current filter */}
      <div className="text-xs text-muted-foreground">
        Current filter: <span className="font-mono bg-muted px-2 py-1 rounded">{categoryFilter}</span>
        ({planTasks.length} tasks shown)
      </div>
      <AnimatePresence>
        {isAdmin && showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">New Sprint Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Title *</label>
                <input className={inputClass} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Week 6 Sprint" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Week Start *</label>
                <input className={inputClass} type="date" value={form.week_start} onChange={e => setForm(p => ({ ...p, week_start: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Week End *</label>
                <input className={inputClass} type="date" value={form.week_end} onChange={e => setForm(p => ({ ...p, week_end: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Batch</label>
                <select className={inputClass} value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}>
                  <option value="">All</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={savePlan} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Please wait...</> : "Create"}
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm bg-muted/50 text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No plans */}
      {plans.length === 0 && (
        <div className="glass-card p-12 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">No Sprint Plans Yet</h3>
          <p className="text-muted-foreground text-sm">{isAdmin ? "Create your first sprint plan!" : "Sprint plans will appear here."}</p>
        </div>
      )}

      {/* Timetable Grid */}
      {currentPlan && (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/60">
                  <th className="border border-border/40 px-3 py-3 text-xs font-bold text-foreground uppercase tracking-wider w-[100px]">Time</th>
                  {DAYS.map(d => (
                    <th key={d} className="border border-border/40 px-3 py-3 text-xs font-bold text-foreground uppercase tracking-wider">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, timeIdx) => (
                  <tr key={time} className="hover:bg-muted/20 transition-colors">
                    <td className="border border-border/40 px-3 py-3 text-xs font-mono text-primary font-semibold whitespace-nowrap">{time}</td>
                    {DAYS.map((_, dayIdx) => {
                      const key = `${dayIdx}-${timeIdx}`;
                      const cellTasks = taskGrid[key] || [];
                      return (
                        <td
                          key={dayIdx}
                          className="border border-border/40 px-1 py-1 align-top min-h-[48px] relative group"
                          onClick={() => {
                            if (isAdmin) {
                              setAddingTask({ day: dayIdx, time });
                              setNewTask({ title: "", module: "General", link: "" });
                            }
                          }}
                          style={{ cursor: isAdmin && cellTasks.length === 0 ? "pointer" : "default" }}
                        >
                          {cellTasks.map(task => (
                            <div
                              key={task.id}
                              className={`rounded-lg px-2.5 py-2 text-xs font-medium mb-1 relative border transition-all hover:shadow-sm ${
                                task.is_done
                                  ? "bg-success/20 text-success line-through border-success/30"
                                  : CATEGORY_COLORS[task.module] || CATEGORY_COLORS["General"]
                              }`}
                              onClick={e => { 
                                e.stopPropagation(); 
                                const taskWithFlags = task as SprintTask & { isAssignment?: boolean; originalId?: string };
                                if (taskWithFlags.isAssignment) {
                                  // Navigate to assignments page
                                  navigate('/assignments');
                                } else if (task.link) {
                                  // Open external link
                                  window.open(task.link, '_blank');
                                } else if (isAdmin) {
                                  // Toggle completion for manual tasks
                                  toggleTask(task.id, task.is_done);
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="flex items-start gap-1">
                                <div className="font-semibold truncate flex-1">{task.title}</div>
                                {(task as SprintTask & { isAssignment?: boolean }).isAssignment && (
                                  <Calendar className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                              <div className="opacity-75 text-[10px]">{task.module}</div>
                              {isAdmin && !(task as SprintTask & { isAssignment?: boolean }).isAssignment && (
                                <button
                                  onClick={e => { e.stopPropagation(); deleteTask(task.id, task.title); }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-destructive transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          {isAdmin && (
                            <div className="opacity-0 group-hover:opacity-40 text-center text-xs text-muted-foreground py-2 transition-opacity">+</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AnimatePresence>
        {addingTask && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
            onClick={() => setAddingTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 w-full max-w-sm space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Add Task — {DAYS[addingTask.day]} {addingTask.time}
              </h3>
              <div>
                <label className="text-xs text-muted-foreground uppercase mb-1 block">Title *</label>
                <input className={inputClass} value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Math Class" autoFocus onKeyDown={e => e.key === "Enter" && addTask()} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase mb-1 block">Type</label>
                <select className={inputClass} value={newTask.module} onChange={e => setNewTask(p => ({ ...p, module: e.target.value }))}>
                  <option value="General">General</option>
                  <option value="Lecture">Lecture</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Quiz">Quiz</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase mb-1 block">Link (optional)</label>
                <input 
                  className={inputClass} 
                  value={newTask.link} 
                  onChange={e => setNewTask(p => ({ ...p, link: e.target.value }))} 
                  placeholder="Video/Assignment/Quiz link" 
                />
              </div>
              <div className="flex gap-2">
                <button onClick={addTask} disabled={addingTaskLoading} className="px-5 py-2 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}>
                  {addingTaskLoading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Please wait...</> : "Add"}
                </button>
                <button onClick={() => setAddingTask(null)} className="px-4 py-2 rounded-lg text-sm bg-muted/50 text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md space-y-4 border border-destructive/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Delete Activity</h3>
                  <p className="text-sm text-muted-foreground">Are you sure you want to delete this activity?</p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="font-semibold text-foreground">{deleteConfirm.taskTitle}</div>
                <div className="text-xs text-muted-foreground mt-1">This action cannot be undone.</div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 transition-colors"
                >
                  Delete Activity
                </button>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
