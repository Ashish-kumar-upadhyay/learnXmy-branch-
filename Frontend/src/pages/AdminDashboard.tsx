import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ShieldCheck, BarChart3, Search, ChevronDown,
  UserCheck, UserX, GraduationCap, School, Crown, RefreshCw,
  TrendingUp, BookOpen, FileText, Bell, Plus, Fingerprint, CalendarOff,
  DollarSign, CheckCircle2, XCircle, Clock, Edit, Trash2, Save, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { api, getAccessToken, getApiErrorMessage } from "@/lib/backendApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppRole = "student" | "teacher" | "admin";

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  class_name: string | null;
  student_id?: string | null;
  teacher_code?: string | null;
  created_at: string;
  roles: AppRole[];
}

const sidebarItems = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "all_teachers", label: "All Teachers", icon: School },
  { key: "all_students", label: "All Students", icon: GraduationCap },
  { key: "user_management", label: "User Management", icon: Users },
  { key: "salary", label: "Salary Management", icon: DollarSign },
];

const roleIcons: Record<AppRole, typeof GraduationCap> = {
  student: GraduationCap,
  teacher: School,
  admin: Crown,
};

const roleColors: Record<AppRole, string> = {
  student: "bg-primary/15 text-primary border-primary/20",
  teacher: "bg-secondary/15 text-secondary border-secondary/20",
  admin: "bg-warning/15 text-warning border-warning/20",
};

export default function AdminDashboard() {
  const { roles: myRoles } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [stats, setStats] = useState({ total: 0, students: 0, teachers: 0, admins: 0, classes: 0, assignments: 0, announcements: 0 });
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ email: "", password: "", full_name: "", subject: "", batch: "", class_name: "" });
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentForm, setStudentForm] = useState({ email: "", password: "", full_name: "", class_name: "" });
  const [addingStudent, setAddingStudent] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", class_name: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [addedTeacherCreds, setAddedTeacherCreds] = useState<{
    teacherCode: string;
    password: string;
    name: string;
    email: string;
  } | null>(null);

  const [salaryConfigs, setSalaryConfigs] = useState<any[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    teacher_id: "",
    salary_type: "per_day" as "per_day" | "monthly",
    monthly_salary: "",
    daily_rate: "",
    bonuses: "",
    deductions: "",
    daysWorked: "",
  });
  const [salaryCalc, setSalaryCalc] = useState<Record<string, any>>({});

  const isAdmin = myRoles.includes("admin");

  const fetchUsers = async () => {
    setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) { setUsers([]); setLoading(false); return; }

    const res = await api<any[]>("/api/users", { method: "GET", accessToken });
    if (res.status !== 200 || !res.data) {
      toast.error("Failed to load users");
      setUsers([]);
      setLoading(false);
      return;
    }

    const combined: UserWithRole[] = res.data.map((u: any) => ({
      user_id: String(u._id ?? u.id),
      email: String(u.email ?? ""),
      full_name: (u.name ?? u.full_name ?? null) as string | null,
      avatar_url: (u.avatar_url ?? null) as string | null,
      class_name: (u.assignedClass ?? u.class_name ?? null) as string | null,
      student_id: (u.studentId ?? u.student_id ?? null) as string | null,
      teacher_code: (u.teacherCode ?? u.teacher_code ?? null) as string | null,
      created_at: String(u.createdAt ?? u.created_at ?? new Date().toISOString()),
      roles: [u.role as AppRole],
    }));
    setUsers(combined);

    const students = combined.filter((u) => u.roles.includes("student")).length;
    const teachers = combined.filter((u) => u.roles.includes("teacher")).length;
    const admins = combined.filter((u) => u.roles.includes("admin")).length;
    setStats((s) => ({ ...s, total: combined.length, students, teachers, admins }));
    setLoading(false);
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const fetchSalaryConfigs = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    setSalaryLoading(true);
    try {
      const res = await api<any[]>("/api/salary/config", { method: "GET", accessToken });
      if (res.status === 200 && res.data) setSalaryConfigs(res.data);
      else setSalaryConfigs([]);
    } finally {
      setSalaryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "salary") void fetchSalaryConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const addTeacher = async () => {
    if (!teacherForm.email || !teacherForm.password || !teacherForm.full_name) {
      toast.error("Email, password and name are required"); return;
    }
    if (teacherForm.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!teacherForm.class_name) {
      toast.error("Class assignment is required"); return;
    }
    setAddingTeacher(true);
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); setAddingTeacher(false); return; }
    const res = await api("/api/users", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        email: teacherForm.email,
        password: teacherForm.password,
        full_name: teacherForm.full_name,
        role: "teacher",
        batch: teacherForm.class_name, // backend maps batch -> assignedClass
      }),
    });
    if (res.status !== 201) {
      toast.error(getApiErrorMessage(res.error, "Failed to add teacher"));
    } else {
      const newCode = (res.data as { teacherCode?: string } | undefined)?.teacherCode;
      if (newCode) {
        toast.success(`Teacher added! Code: ${newCode}`);
        setAddedTeacherCreds({
          teacherCode: newCode,
          password: teacherForm.password,
          name: teacherForm.full_name,
          email: teacherForm.email,
        });
      } else {
        toast.success("Teacher added successfully! ✅");
      }
      const welcomeEmailSent = (res.data as { welcomeEmailSent?: boolean } | undefined)?.welcomeEmailSent;
      if (welcomeEmailSent) {
        toast.success("Welcome email sent to the teacher.");
      } else {
        toast.error("Welcome email could not be sent", {
          description:
            "Check RESEND_* or SMTP in backend .env and server logs. The teacher account was still created.",
        });
      }
      setShowTeacherForm(false);
      setTeacherForm({ email: "", password: "", full_name: "", subject: "", batch: "", class_name: "" });
      void fetchUsers();
    }
    setAddingTeacher(false);
  };

  const addStudent = async () => {
    if (!studentForm.password || !studentForm.full_name) {
      toast.error("Password and name are required");
      return;
    }
    if (!studentForm.email.trim()) {
      toast.error("Student email is required so we can send the welcome message.");
      return;
    }
    if (studentForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!studentForm.class_name) {
      toast.error("Class is required");
      return;
    }
    setAddingStudent(true);
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); setAddingStudent(false); return; }
    const body: Record<string, unknown> = {
      email: studentForm.email.trim(),
      password: studentForm.password,
      full_name: studentForm.full_name,
      role: "student",
      batch: studentForm.class_name,
    };
    const res = await api("/api/users", {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    });
    if (res.status !== 201) {
      toast.error(getApiErrorMessage(res.error, "Failed to add student"));
    }
    else {
      const newStudentId = (res.data as { studentId?: string } | undefined)?.studentId;
      toast.success(
        newStudentId
          ? `Student added! Student ID: ${newStudentId} (share with student for login)`
          : "Student added successfully! ✅"
      );
      const welcomeEmailSent = (res.data as { welcomeEmailSent?: boolean } | undefined)?.welcomeEmailSent;
      if (welcomeEmailSent) {
        toast.success("Welcome email sent to the student.");
      } else {
        toast.error("Welcome email could not be sent", {
          description:
            "Check RESEND_* or SMTP in backend .env and server logs. The student account was still created.",
        });
      }
      setShowStudentForm(false);
      setStudentForm({ email: "", password: "", full_name: "", class_name: "" });
      void fetchUsers();
    }
    setAddingStudent(false);
  };

  const updateUser = async (userId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/users/${userId}`, {
      method: "PUT",
      accessToken,
      body: JSON.stringify({
        full_name: editForm.full_name,
        class_name: editForm.class_name || null,
      }),
    });
    if (res.status !== 200) { toast.error("Update failed"); return; }
    toast.success("Updated successfully! ✅");
    setEditingUser(null);
    void fetchUsers();
  };

  const assignRole = async (userId: string, role: AppRole) => {
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/users/${userId}/assign-role`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({ role }),
    });
    if (res.status !== 200) toast.error("Role update failed");
    else { toast.success(`Role set to "${role}"`); void fetchUsers(); }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/users/${userId}/remove-role`, {
      method: "DELETE",
      accessToken,
      body: JSON.stringify({ role }),
    });
    if (res.status !== 200) toast.error("Role remove failed");
    else {
      toast.success(res.message ?? `Role "${role}" removed`);
      void fetchUsers();
    }
  };

  const saveSalaryConfig = async () => {
    if (!salaryForm.teacher_id) { toast.error("Select a teacher"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    setSavingSalary(true);
    try {
      const existing = salaryConfigs.find((c: any) => String(c.teacher_id) === String(salaryForm.teacher_id));
      const payload: any = {
        teacher_id: salaryForm.teacher_id,
        salary_type: salaryForm.salary_type,
        monthly_salary: salaryForm.salary_type === "monthly" ? Number(salaryForm.monthly_salary || 0) : undefined,
        daily_rate: salaryForm.salary_type === "per_day" ? Number(salaryForm.daily_rate || 0) : undefined,
        bonuses: Number(salaryForm.bonuses || 0),
        deductions: Number(salaryForm.deductions || 0),
        is_active: true,
      };

      const res = existing
        ? await api(`/api/salary/config/${existing._id}`, { method: "PUT", accessToken, body: JSON.stringify(payload) })
        : await api("/api/salary/config", { method: "POST", accessToken, body: JSON.stringify(payload) });

      if (res.status !== 200 && res.status !== 201) {
        toast.error("Failed to save salary config");
        return;
      }
      toast.success("Salary config saved ✅");
      await fetchSalaryConfigs();
    } finally {
      setSavingSalary(false);
    }
  };

  const calculateSalary = async (configId: string, teacherId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const days = Number(salaryForm.daysWorked || 0);
    const qs = days ? `?days=${encodeURIComponent(String(days))}` : "";
    const res = await api<any>(`/api/salary/calculate/${configId}${qs}`, { method: "GET", accessToken });
    if (res.status !== 200 || !res.data) { toast.error("Calculation failed"); return; }
    setSalaryCalc((p) => ({ ...p, [teacherId]: res.data }));
  };

  const deleteUser = async (userId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    setDeletingUser(true);
    try {
      const res = await api(`/api/users/${userId}`, { method: "DELETE", accessToken });
      if (res.status !== 200) { toast.error("Delete failed"); return; }
      toast.success("User deleted! 🗑️");
      void fetchUsers();
    } finally {
      setDeletingUser(false);
      setDeleteConfirm(null);
    }
  };

  const teachers = users.filter(u => u.roles.includes("teacher"));
  const students = users.filter(u => u.roles.includes("student"));

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors";

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Delete user?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete{" "}
              <span className="font-semibold text-foreground">{deleteConfirm?.userName}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (!deleteConfirm) return;
                void deleteUser(deleteConfirm.userId);
              }}
            >
              {deletingUser ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {addedTeacherCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Teacher added</h3>
              <p className="text-sm text-muted-foreground mt-1">Share these with <strong>{addedTeacherCreds.name}</strong></p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/50 text-left">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Teacher code (sign-in)</p>
                <p className="text-sm font-mono font-semibold text-foreground mt-0.5 select-all">{addedTeacherCreds.teacherCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Password</p>
                <p className="text-sm font-mono font-semibold text-foreground mt-0.5 select-all">{addedTeacherCreds.password}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Email (welcome / contact)</p>
                <p className="text-sm font-mono text-foreground mt-0.5 select-all break-all">{addedTeacherCreds.email}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">Teacher signs in at the teacher login page with Teacher code + password (not email).</p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `Teacher code: ${addedTeacherCreds.teacherCode}\nPassword: ${addedTeacherCreds.password}\nEmail: ${addedTeacherCreds.email}`
                  );
                  toast.success("Copied to clipboard");
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
              >
                Copy details
              </button>
              <button
                type="button"
                onClick={() => setAddedTeacherCreds(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 hidden md:block">
        <div className="glass-card p-3 space-y-1 sticky top-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-2 font-semibold">Admin Panel</p>
          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === item.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 p-2 flex gap-1 overflow-x-auto">
        {sidebarItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium min-w-fit transition-all",
              activeTab === item.key ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-6 min-w-0 pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage users, roles, and monitor platform activity</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "all_teachers" && (
              <button
                onClick={() => setShowTeacherForm(!showTeacherForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground shadow-lg"
                style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}
              >
                <Plus className="w-4 h-4" />{showTeacherForm ? "Cancel" : "Add Teacher"}
              </button>
            )}
            <button
              onClick={() => { void fetchUsers(); if (activeTab === "salary") void fetchSalaryConfigs(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Teacher Form */}
        {showTeacherForm && activeTab === "all_teachers" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Add New Teacher</h3>
            <p className="text-xs text-muted-foreground">
              A unique <strong className="text-foreground">Teacher code</strong> (e.g. TCH2026…) is generated automatically. The teacher uses that code and password on the teacher login page. Email is still saved for welcome messages and contact.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input className={inputClass} value={teacherForm.full_name} onChange={e => setTeacherForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Dr. Sarah Kim" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Email *</label>
                <input className={inputClass} type="email" value={teacherForm.email} onChange={e => setTeacherForm(p => ({ ...p, email: e.target.value }))} placeholder="e.g. teacher@example.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Password *</label>
                <input className={inputClass} type="password" minLength={8} value={teacherForm.password} onChange={e => setTeacherForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Assigned Class *</label>
                <select className={inputClass} value={teacherForm.class_name} onChange={e => setTeacherForm(p => ({ ...p, class_name: e.target.value }))}>
                  <option value="">Select class</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Subject</label>
                <input className={inputClass} value={teacherForm.subject} onChange={e => setTeacherForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Computer Science" />
              </div>
            </div>
            <button onClick={addTeacher} disabled={addingTeacher} className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}>
              {addingTeacher ? "Adding..." : "Add Teacher"}
            </button>
          </motion.div>
        )}

        {/* Add Student Form */}
        {showStudentForm && activeTab === "all_students" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Add New Student</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input className={inputClass} value={studentForm.full_name} onChange={e => setStudentForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Student email *</label>
                <input className={inputClass} type="email" value={studentForm.email} onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} placeholder="For welcome email (must be new on LearnX)" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Password *</label>
                <input className={inputClass} type="password" minLength={6} value={studentForm.password} onChange={e => setStudentForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Class *</label>
                <select className={inputClass} value={studentForm.class_name} onChange={e => setStudentForm(p => ({ ...p, class_name: e.target.value }))}>
                  <option value="">Select class</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
            </div>
            <button onClick={addStudent} disabled={addingStudent} className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}>
              {addingStudent ? "Adding..." : "Add Student"}
            </button>
          </motion.div>
        )}

        {/* Stats - Overview */}
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
                  />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Loading Dashboard Data</h3>
                    <p className="text-sm text-muted-foreground">Fetching real-time statistics and user information...</p>
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
              </motion.div>
            )}
            {!loading && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Users", value: stats.total, icon: Users, color: "primary" },
                    { label: "Students", value: stats.students, icon: GraduationCap, color: "primary" },
                    { label: "Teachers", value: stats.teachers, icon: School, color: "secondary" },
                    { label: "Admins", value: stats.admins, icon: Crown, color: "warning" },
                  ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        <stat.icon className={`w-4 h-4 text-${stat.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Total Classes", value: stats.classes, icon: BookOpen, desc: "Classes created by teachers" },
                    { label: "Assignments", value: stats.assignments, icon: FileText, desc: "Across all teachers" },
                    { label: "Announcements", value: stats.announcements, icon: Bell, desc: "Platform-wide" },
                  ].map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span>
                        <card.icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-foreground mb-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ===== ALL TEACHERS ===== */}
        {activeTab === "all_teachers" && (
          <motion.div key="all_teachers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
                  />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Loading Teachers Data</h3>
                    <p className="text-sm text-muted-foreground">Fetching teacher information and assignments...</p>
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
              </motion.div>
            )}
            {!loading && (
              <>
                <h2 className="text-lg font-semibold text-foreground">All Teachers ({teachers.length})</h2>
                {teachers.length === 0 ? (
                  <div className="glass-card p-8 text-center text-muted-foreground">
                    <School className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No teachers found</p>
                  </div>
                ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <table className="w-full min-w-[720px] md:min-w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Name</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Class</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Teacher code</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Students</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Joined</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map(t => {
                        const classStudents = students.filter(s => s.class_name === t.class_name);
                        const isEditing = editingUser === t.user_id;

                        return (
                          <tr key={t.user_id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                            <td className="px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">
                              {isEditing ? (
                                <input className={cn(inputClass, "max-w-[150px] md:max-w-[200px] text-xs md:text-sm")} value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
                              ) : (
                                <div className="flex items-center gap-2 md:gap-3">
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-secondary/15 flex items-center justify-center text-[10px] md:text-xs font-bold text-secondary">
                                    {(t.full_name || "?")[0]?.toUpperCase()}
                                  </div>
                                  <span className="text-xs md:text-sm font-medium text-foreground truncate max-w-[100px] md:max-w-none">{t.full_name || "Unknown"}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">
                              {isEditing ? (
                                <select className={cn(inputClass, "max-w-[80px] md:max-w-[120px] text-xs md:text-sm")} value={editForm.class_name} onChange={e => setEditForm(p => ({ ...p, class_name: e.target.value }))}>
                                  <option value="">None</option>
                                  <option value="10">Class 10</option>
                                  <option value="11">Class 11</option>
                                  <option value="12">Class 12</option>
                                </select>
                              ) : (
                                <span className={cn("px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium", t.class_name ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                  {t.class_name ? `Class ${t.class_name}` : "Not Assigned"}
                                </span>
                              )}
                            </td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm font-mono text-foreground whitespace-nowrap">{t.teacher_code || "—"}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-foreground font-medium whitespace-nowrap">{classStudents.length}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-xs md:text-sm text-muted-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 md:gap-2">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => updateUser(t.user_id)} className="p-1 md:p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"><Save className="w-3 h-3 md:w-4 md:h-4" /></button>
                                    <button onClick={() => setEditingUser(null)} className="p-1 md:p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"><X className="w-3 h-3 md:w-4 md:h-4" /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditingUser(t.user_id); setEditForm({ full_name: t.full_name || "", class_name: t.class_name || "" }); }} className="p-1 md:p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Edit className="w-3 h-3 md:w-4 md:h-4" /></button>
                                    <button onClick={() => setDeleteConfirm({ userId: t.user_id, userName: t.full_name || "Teacher" })} className="p-1 md:p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ===== ALL STUDENTS ===== */}
        {activeTab === "all_students" && (
          <motion.div key="all_students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
                  />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Loading Students Data</h3>
                    <p className="text-sm text-muted-foreground">Fetching student information and enrollments...</p>
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
              </motion.div>
            )}
            {!loading && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">All Students ({students.length})</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowStudentForm(!showStudentForm)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground shadow-lg"
                      style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}
                    >
                      <Plus className="w-4 h-4" />{showStudentForm ? "Cancel" : "Add Student"}
                    </button>
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-full sm:w-64"
                    />
                  </div>
                </div>
                {students.length === 0 ? (
                  <div className="glass-card p-8 text-center text-muted-foreground">
                    <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No students found</p>
                  </div>
                ) : (
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Name</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Student ID</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Class</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Batch</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Joined</th>
                        <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students
                        .filter(s => {
                          const q = search.toLowerCase();
                          if (!q) return true;
                          return Boolean(
                            s.full_name?.toLowerCase().includes(q) ||
                            (s.student_id && s.student_id.toLowerCase().includes(q))
                          );
                        })
                        .map(s => {
                          const isEditing = editingUser === s.user_id;
                          return (
                            <tr key={s.user_id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                              <td className="px-5 py-3">
                                {isEditing ? (
                                  <input className={cn(inputClass, "max-w-[200px]")} value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                      {(s.full_name || "?")[0]?.toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{s.full_name || "Unknown"}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-3 text-sm font-mono text-foreground">{s.student_id || "—"}</td>
                              <td className="px-5 py-3">
                                {isEditing ? (
                                  <select className={cn(inputClass, "max-w-[120px]")} value={editForm.class_name} onChange={e => setEditForm(p => ({ ...p, class_name: e.target.value }))}>
                                    <option value="">None</option>
                                    <option value="10">Class 10</option>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                  </select>
                                ) : (
                                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", s.class_name ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                    {s.class_name ? `Class ${s.class_name}` : "—"}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{s.class_name || "—"}</td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button onClick={() => updateUser(s.user_id)} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"><Save className="w-4 h-4" /></button>
                                      <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"><X className="w-4 h-4" /></button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => { setEditingUser(s.user_id); setEditForm({ full_name: s.full_name || "", class_name: s.class_name || "" }); }} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Edit className="w-4 h-4" /></button>
                                      <button onClick={() => setDeleteConfirm({ userId: s.user_id, userName: s.full_name || "Student" })} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ===== USER MANAGEMENT ===== */}
        {activeTab === "user_management" && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as AppRole | "all")} className="px-4 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50">
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <table className="w-full min-w-[700px] md:min-w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">User</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Class</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Roles</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Joined</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-3 md:px-5 py-2 md:py-3 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Loading users...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No users found</td></tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <UserRow key={user.user_id} user={user} onAssignRole={assignRole} onRemoveRole={removeRole} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}




        {/* ===== SALARY MANAGEMENT ===== */}
        {activeTab === "salary" && (
          <motion.div key="salary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Salary Management</h2>
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Set Teacher Salary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Teacher</label>
                  <select className={inputClass} value={salaryForm.teacher_id} onChange={e => {
                    const tid = e.target.value;
                    setSalaryForm(p => ({ ...p, teacher_id: tid }));
                    const existing = salaryConfigs.find((c: any) => c.teacher_id === tid);
                    if (existing) {
                      setSalaryForm((p) => ({
                        ...p,
                        teacher_id: tid,
                        salary_type: existing.salary_type,
                        monthly_salary: existing.monthly_salary?.toString() || "",
                        daily_rate: existing.daily_rate?.toString() || "",
                        bonuses: (existing.bonuses ?? 0).toString(),
                        deductions: (existing.deductions ?? 0).toString(),
                      }));
                    }
                  }}>
                    <option value="">Select teacher</option>
                    {teachers.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name || u.user_id.slice(0, 8)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Salary Type</label>
                  <select className={inputClass} value={salaryForm.salary_type} onChange={e => setSalaryForm(p => ({ ...p, salary_type: e.target.value as "per_day" | "monthly" }))}>
                    <option value="per_day">Per Day</option>
                    <option value="monthly">Fixed Monthly</option>
                  </select>
                </div>
                {salaryForm.salary_type === "monthly" && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Monthly Salary (₹)</label>
                    <input type="number" className={inputClass} value={salaryForm.monthly_salary} onChange={e => setSalaryForm(p => ({ ...p, monthly_salary: e.target.value }))} placeholder="e.g. 30000" />
                  </div>
                )}
                {salaryForm.salary_type === "per_day" && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Daily Rate (₹)</label>
                    <input type="number" className={inputClass} value={salaryForm.daily_rate} onChange={e => setSalaryForm(p => ({ ...p, daily_rate: e.target.value }))} placeholder="e.g. 1500" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Bonuses (₹)</label>
                  <input type="number" className={inputClass} value={salaryForm.bonuses} onChange={e => setSalaryForm(p => ({ ...p, bonuses: e.target.value }))} placeholder="e.g. 1000" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Deductions (₹)</label>
                  <input type="number" className={inputClass} value={salaryForm.deductions} onChange={e => setSalaryForm(p => ({ ...p, deductions: e.target.value }))} placeholder="e.g. 500" />
                </div>
              </div>
              <button
                onClick={saveSalaryConfig}
                disabled={savingSalary}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50"
                style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" }}
              >
                {savingSalary ? "Saving..." : "Save Salary Config"}
              </button>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Teacher</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Type</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Rate</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Bonuses/Deductions</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Days Worked</th>
                      <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-5 py-3">Calculated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryLoading ? (
                      <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Loading salary configs...</td></tr>
                    ) : teachers.map(teacher => {
                      const config = salaryConfigs.find((c: any) => String(c.teacher_id) === String(teacher.user_id));
                      const calc = salaryCalc[teacher.user_id];
                      return (
                        <tr key={teacher.user_id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-xs font-bold text-secondary">{(teacher.full_name || "?")[0]?.toUpperCase()}</div>
                              <span className="text-sm font-medium text-foreground">{teacher.full_name || "Unknown"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{config ? (config.salary_type === "per_day" ? "Per Day" : "Monthly") : "Not Set"}</td>
                          <td className="px-5 py-3 text-sm text-foreground font-medium">
                            {config
                              ? (config.salary_type === "per_day" ? `₹${config.daily_rate}/day` : `₹${config.monthly_salary}/mo`)
                              : "—"}
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">
                            {config ? `+₹${config.bonuses ?? 0} / -₹${config.deductions ?? 0}` : "—"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className={cn(inputClass, "max-w-[110px]")}
                                value={salaryForm.teacher_id === teacher.user_id ? salaryForm.daysWorked : ""}
                                onChange={(e) => setSalaryForm((p) => ({ ...p, teacher_id: teacher.user_id, daysWorked: e.target.value }))}
                                placeholder="e.g. 22"
                              />
                              <button
                                onClick={() => config ? calculateSalary(String(config._id), teacher.user_id) : toast.error("Set config first")}
                                className="px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-xs text-foreground hover:bg-muted transition-colors"
                              >
                                Calculate
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm font-bold text-foreground">
                            {calc?.netPay !== undefined ? `₹${Math.round(calc.netPay).toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onAssignRole, onRemoveRole }: { user: UserWithRole; onAssignRole: (userId: string, role: AppRole) => void; onRemoveRole: (userId: string, role: AppRole) => void }) {
  const [open, setOpen] = useState(false);
  const allRoles: AppRole[] = ["student", "teacher", "admin"];
  const availableRoles = allRoles.filter((r) => !user.roles.includes(r));

  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{user.full_name?.[0]?.toUpperCase() || "?"}</div>
          <div>
            <p className="text-sm font-medium text-foreground">{user.full_name || "Unnamed"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", user.class_name ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
          {user.class_name ? `Class ${user.class_name}` : "—"}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1.5">
          {user.roles.map((role) => {
            const Icon = roleIcons[role];
            return (
              <span key={role} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${roleColors[role]}`}>
                <Icon className="w-3 h-3" />{role}
              </span>
            );
          })}
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
      <td className="px-5 py-3">
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 text-xs text-foreground hover:bg-muted transition-colors">
            Manage <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg bg-card border border-border/50 shadow-lg overflow-hidden">
                {availableRoles.length > 0 && (
                  <div className="px-3 py-2 border-b border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Assign Role</p>
                    {availableRoles.map((role) => {
                      const Icon = roleIcons[role];
                      return (
                        <button key={role} onClick={() => { onAssignRole(user.user_id, role); setOpen(false); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-foreground hover:bg-muted/50 transition-colors">
                          <UserCheck className="w-3 h-3 text-success" /><Icon className="w-3 h-3" />Add {role}
                        </button>
                      );
                    })}
                  </div>
                )}
                {user.roles.length > 0 && (
                  <div className="px-3 py-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Remove Role</p>
                    {user.roles.map((role) => {
                      const Icon = roleIcons[role];
                      return (
                        <button key={role} onClick={() => { onRemoveRole(user.user_id, role); setOpen(false); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-destructive hover:bg-destructive/10 transition-colors">
                          <UserX className="w-3 h-3" /><Icon className="w-3 h-3" />Remove {role}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
    </tr>
  );
}
