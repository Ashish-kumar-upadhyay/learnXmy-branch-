import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken, getApiErrorMessage } from "@/lib/backendApi";
import {
  CalendarPlus, FileText, Users, Megaphone, Plus, Clock,
  MapPin, BookOpen, Trash2, Edit, Send, AlertTriangle, Info, ClipboardCheck,
  ExternalLink, Link2, Star, ChevronDown, ChevronUp, Inbox, Bell, CheckCircle2, XCircle, UserCheck, UserX, School,
  Fingerprint, CalendarOff, Save, Video, Youtube, Play, X, Loader2
} from "lucide-react";
import AttendanceMarker from "@/components/AttendanceMarker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type ClassRow = {
  id: string;
  title: string;
  subject: string;
  batch: string | null;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  status: string;
  created_at: string;
};

type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  reference_link?: string | null;
  batch: string | null;
  due_date: string;
  max_score: number | null;
  status: string;
  created_at: string;
  class_id: string | null;
};

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  batch: string | null;
  priority: string;
  created_at: string;
};

const TEACHER_TAB_KEYS = [
  "classes",
  "assignments",
  "students",
  "announcements",
  "lectures",
  "myattendance",
  "myleave",
  "approvals",
] as const;
type TeacherTabKey = (typeof TEACHER_TAB_KEYS)[number];
function isTeacherTabKey(v: string | null): v is TeacherTabKey {
  return !!v && (TEACHER_TAB_KEYS as readonly string[]).includes(v);
}

type StudentProfile = {
  user_id: string;
  full_name: string | null;
  batch: string | null;
  avatar_url: string | null;
  class_name?: string | null;
  /** Unique login code (e.g. STU2026…), same as Student ID on login page */
  student_id?: string | null;
  is_approved?: boolean;
};

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTeacherTab = useMemo(() => {
    const t = searchParams.get("tab");
    return isTeacherTabKey(t) ? t : "classes";
  }, [searchParams]);
  
  // Sync tab with URL on mount
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && isTeacherTabKey(currentTab)) {
      // Tab is already in URL, no action needed
      console.log("Tab from URL:", currentTab);
    } else {
      // No valid tab in URL, set default to classes
      setSearchParams(new URLSearchParams());
    }
  }, []); // Run only once on mount
  const setTeacherTab = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (value === "classes") p.delete("tab");
          else p.set("tab", value);
          return p;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const teacherClass = profile?.class_name || "";
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);
  const [pendingStudents, setPendingStudents] = useState<StudentProfile[]>([]);
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalClassFilter, setApprovalClassFilter] = useState("all");
  const [bulkApprovalAction, setBulkApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  /** Only first dashboard load shows full-page spinner; later refetches keep tabs mounted + active tab preserved */
  const isFirstDashboardFetch = useRef(true);
  const [addingStudent, setAddingStudent] = useState(false);
  const [attendanceClass, setAttendanceClass] = useState<ClassRow | null>(null);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [expandedClassAttendance, setExpandedClassAttendance] = useState<string | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [addedCredentials, setAddedCredentials] = useState<{
    studentId: string;
    password: string;
    name: string;
    contactEmail?: string;
  } | null>(null);

  // Teacher attendance & leave states
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [todayMarked, setTodayMarked] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_date: new Date(), leave_type: "full_day", reason: "" });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [teacherCoords, setTeacherCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Form states
  const [showClassForm, setShowClassForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [lecturesList, setLecturesList] = useState<any[]>([]);
  const [lectureForm, setLectureForm] = useState({ title: "", description: "", youtube_url: "", batch: "" });
  const [playingLecture, setPlayingLecture] = useState<any | null>(null);

  // Edit student states
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({ full_name: "" });
  const [studentDeleteTarget, setStudentDeleteTarget] = useState<{ userId: string; name: string } | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Student form - auto-set class_name from teacher's assigned class
  const [studentForm, setStudentForm] = useState({
    email: "",
    password: "",
    full_name: "",
    batch: "",
    class_name: teacherClass
  });

  // Class form
  const [classForm, setClassForm] = useState({
    title: "", subject: "", batch: "", description: "",
    scheduled_at: new Date(), duration_minutes: 60, location: ""
  });

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    title: "", description: "", batch: teacherClass, due_date: new Date(),
    due_time: "23:59",
    max_score: 100, class_id: "", duration_hours: "", reference_link: ""
  });

  // Announcement form
  const [announcementForm, setAnnouncementForm] = useState({
    title: "", content: "", batch: "", priority: "normal"
  });

  const lastFetchedUserId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!user?.id) return;
    if (lastFetchedUserId.current !== user.id) {
      isFirstDashboardFetch.current = true;
      lastFetchedUserId.current = user.id;
    }
    void fetchAll();
  }, [user?.id]);

  async function fetchAll() {
    const blockUi = isFirstDashboardFetch.current;
    if (blockUi) setLoading(true);
    try {
    const accessToken = getAccessToken();
    const [c, a, n, s, myAtt, myLv, lec] = await Promise.all([
      (async () => {
        if (!accessToken) return { data: [] as any[] };
        const res = await api<any[]>(`/api/classes/teacher/${encodeURIComponent(user!.id)}`, {
          method: "GET",
          accessToken,
        });
        return { data: res.status === 200 ? (res.data ?? []) : [] as any[] };
      })(),
      (async () => {
        if (!accessToken) return { data: [] as any[] };
        const res = await api<any[]>(`/api/assignments?teacher_id=${encodeURIComponent(user!.id)}`, {
          method: "GET",
          accessToken,
        });
        return { data: res.status === 200 ? (res.data ?? []) : [] as any[] };
      })(),
      (async () => {
        if (!accessToken) return { data: [] as any[] };
        const res = await api<any[]>(`/api/announcements?teacher_id=${encodeURIComponent(user!.id)}`, {
          method: "GET",
          accessToken,
        });
        return { data: res.status === 200 ? (res.data ?? []) : [] as any[] };
      })(),
      { data: [] as any[] },
      (async () => {
        if (!accessToken) return { data: [] as any[] };
        const res = await api<any[]>(`/api/teacher-attendance/history?teacher_id=${encodeURIComponent(user!.id)}`, {
          method: "GET",
          accessToken,
        });
        return { data: res.status === 200 ? (res.data ?? []) : [] as any[] };
      })(),
      (async () => {
        if (!accessToken) return { data: [] as any[] };
        const res = await api<any[]>(`/api/leave-requests?user_id=${encodeURIComponent(user!.id)}`, {
          method: "GET",
          accessToken,
        });
        return { data: res.status === 200 ? (res.data ?? []) : [] as any[] };
      })(),
      (async () => {
        if (!accessToken) return { data: [] as any[] };
        const res = await api<any[]>(`/api/lectures?teacher_id=${encodeURIComponent(user!.id)}`, {
          method: "GET",
          accessToken,
        });
        return { data: res.status === 200 ? (res.data ?? []) : [] as any[] };
      })(),
    ]);
    if (lec.data) setLecturesList(lec.data);
    if (c.data) {
      // Map backend class fields to UI shape
      const mapped = (c.data as any[]).map((cls) => ({
        ...cls,
        scheduled_at: cls.scheduled_at ?? cls.schedule ?? cls.scheduled_at,
        duration_minutes: cls.duration_minutes ?? cls.duration ?? cls.duration_minutes ?? 60,
      }));
      setClasses(mapped);
    }
    if (a.data) setAssignments(a.data);
    if (n.data) setAnnouncements(n.data);
    if (myAtt.data) {
      setMyAttendance(myAtt.data);
      const today = new Date().toISOString().split("T")[0];
      setTodayMarked(
        myAtt.data.some((att: any) => {
          const dateOnly = att?.date ? new Date(att.date).toISOString().split("T")[0] : null;
          return dateOnly === today;
        })
      );
    }
    if (myLv.data) {
      setMyLeaves(
        (myLv.data as any[]).map((lv: any) => ({
          ...lv,
          leave_type: lv.leave_type ?? lv.type ?? "full_day",
        }))
      );
    }

    // Load submissions for teacher assignments from backend
    if (accessToken && a.data && a.data.length > 0) {
      const allSubs = await Promise.all(
        (a.data as any[]).map(async (ass: any) => {
          const res = await api<any[]>(`/api/assignments/${ass.id}/submissions`, {
            method: "GET",
            accessToken,
          });
          return (res.status === 200 && res.data ? res.data : []).map((sub: any) => ({
            ...sub,
            assignment_id: String(sub.assignment_id ?? ass.id),
          }));
        })
      );
      setAllSubmissions(allSubs.flat());
    } else {
      setAllSubmissions([]);
    }

    // Fetch students from backend Mongo users collection
    if (accessToken && teacherClass) {
      const usersRes = await api<any[]>(`/api/users/batch/${encodeURIComponent(teacherClass)}`, {
        method: "GET",
        accessToken,
      });
      if (usersRes.status === 200 && usersRes.data) {
        const students = usersRes.data
          .filter((u: any) => u.role === "student")
          .map((u: any) => ({
            user_id: String(u._id ?? u.id),
            full_name: u.name ?? null,
            batch: u.batch ?? u.assignedClass ?? null,
            avatar_url: u.avatar_url ?? null,
            class_name: u.assignedClass ?? teacherClass,
            student_id: (u.studentId ?? u.student_id ?? null) as string | null,
            is_approved: u.is_approved ?? true,
          })) as StudentProfile[];
        setAllStudents(students);
        setPendingStudents(students.filter((s) => !s.is_approved));
      }
    }

    // Fetch attendance for all classes from backend
    if (accessToken && c.data && c.data.length > 0) {
      const attendanceRows = await Promise.all(
        (c.data as any[]).map(async (cls: any) => {
          const d = cls.scheduled_at ? new Date(cls.scheduled_at) : null;
          if (!d || isNaN(d.getTime())) {
            return { classId: cls.id, rows: [] };
          }
          const dayStr = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
          const res = await api<any[]>(
            `/api/attendance/class/${cls.id}?date=${encodeURIComponent(dayStr)}`,
            { method: "GET", accessToken }
          );
          return { classId: cls.id, rows: res.status === 200 && res.data ? res.data : [] };
        })
      );
      const map: Record<string, string[]> = {};
      attendanceRows.forEach(({ classId, rows }) => {
        map[classId] = rows
          .filter((att: any) => att.status === "present" || att.status === "late" || att.status === "half_day")
          .map((att: any) => String(att.student_id));
      });
      setAttendanceData(map);
    } else {
      setAttendanceData({});
    }
    } finally {
      if (blockUi) {
        setLoading(false);
        isFirstDashboardFetch.current = false;
      }
    }
  }

  function requestTeacherGPS() {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTeacherCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        toast.error(err.message || "Failed to get location");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function markMyAttendance() {
    if (!teacherCoords) {
      toast.error("Please capture your location first");
      return;
    }
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api("/api/teacher-attendance/checkin", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        status: "present",
        notes: `lat:${teacherCoords.lat},lng:${teacherCoords.lng}`,
      }),
    });
    if (res.status !== 200) { toast.error("Failed to mark attendance"); return; }
    toast.success("Attendance marked with location! ✅");
    setTodayMarked(true);
    setTeacherCoords(null);
    fetchAll();
  }

  async function requestLeave() {
    if (!leaveForm.reason) { toast.error("Reason is required"); return; }
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api("/api/leave-requests", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        user_type: "teacher",
        leave_date: format(leaveForm.leave_date, "yyyy-MM-dd"),
        type: leaveForm.leave_type,
        reason: leaveForm.reason,
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to submit leave request"); return; }
    toast.success("Leave request submitted! 📋");
    setShowLeaveForm(false);
    setLeaveForm({ leave_date: new Date(), leave_type: "full_day", reason: "" });
    fetchAll();
  }

  async function createClass() {
    if (!classForm.title || !classForm.subject) {
      toast.error("Title and subject are required"); return;
    }
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api("/api/classes", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        teacher_id: user!.id,
        title: classForm.title,
        subject: classForm.subject,
        batch: classForm.batch || null,
        description: classForm.description || null,
        schedule: classForm.scheduled_at.toISOString(),
        duration: classForm.duration_minutes,
        location: classForm.location || null,
        status: "scheduled",
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to schedule class"); return; }
    toast.success("Class scheduled!");
    setShowClassForm(false);
    setClassForm({ title: "", subject: "", batch: "", description: "", scheduled_at: new Date(), duration_minutes: 60, location: "" });
    fetchAll();
  }

  async function createAssignment() {
    if (!assignmentForm.title) { toast.error("Title is required"); return; }
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const dueAt = new Date(assignmentForm.due_date);
    const [hh, mm] = (assignmentForm.due_time || "23:59").split(":");
    dueAt.setHours(Number(hh) || 23, Number(mm) || 59, 0, 0);

    const res = await api("/api/assignments", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        teacher_id: user!.id,
        title: assignmentForm.title,
        description: assignmentForm.description || null,
        reference_link: assignmentForm.reference_link || null,
        batch: assignmentForm.batch || teacherClass || null,
        due_date: dueAt.toISOString(),
        max_score: assignmentForm.max_score,
        class_id: assignmentForm.class_id || null,
        status: "published",
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to create assignment"); return; }
    toast.success("Assignment published!");
    setShowAssignmentForm(false);
    setAssignmentForm({ title: "", description: "", batch: teacherClass, due_date: new Date(), due_time: "23:59", max_score: 100, class_id: "", duration_hours: "", reference_link: "" });
    fetchAll();
  }

  async function publishAssignment(id: string) {
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api(`/api/assignments/${id}`, {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify({ status: "published" }),
    });
    if (res.status !== 200) { toast.error("Failed to publish assignment"); return; }
    toast.success("Assignment published!");
    fetchAll();
  }

  async function createAnnouncement() {
    if (!announcementForm.title || !announcementForm.content) { toast.error("Title and content required"); return; }
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api("/api/announcements", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        title: announcementForm.title,
        content: announcementForm.content,
        batch: announcementForm.batch || null,
        priority: announcementForm.priority,
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to post announcement"); return; }
    toast.success("Announcement posted!");
    setShowAnnouncementForm(false);
    setAnnouncementForm({ title: "", content: "", batch: "", priority: "normal" });
    fetchAll();
  }

  async function deleteItem(table: "classes" | "teacher_assignments" | "announcements", id: string) {
    if (table === "classes") {
      const token = getAccessToken();
      if (!token) { toast.error("Login required"); return; }
      const res = await api(`/api/classes/${id}`, { method: "DELETE", accessToken: token });
      if (res.status !== 200) { toast.error("Delete failed"); return; }
      toast.success("Deleted!");
      fetchAll();
      return;
    }
    if (table === "announcements") {
      const token = getAccessToken();
      if (!token) { toast.error("Login required"); return; }
      const res = await api(`/api/announcements/${id}`, { method: "DELETE", accessToken: token });
      if (res.status !== 200) { toast.error("Delete failed"); return; }
      toast.success("Deleted!");
      fetchAll();
      return;
    }
    if (table === "teacher_assignments") {
      const token = getAccessToken();
      if (!token) { toast.error("Login required"); return; }
      const res = await api(`/api/assignments/${id}`, { method: "DELETE", accessToken: token });
      if (res.status !== 200) { toast.error("Delete failed"); return; }
      toast.success("Deleted!");
      fetchAll();
      return;
    }
    toast.error("Delete handler not found");
  }

  async function gradeSubmission(submissionId: string) {
    const input = gradeInputs[submissionId];
    if (!input?.grade) { toast.error("Please enter a grade"); return; }
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const sub = allSubmissions.find((x: any) => x.id === submissionId);
    if (!sub?.assignment_id || !sub?.student_id) { toast.error("Submission data missing"); return; }
    const res = await api(`/api/assignments/${sub.assignment_id}/grade`, {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify({
        student_id: sub.student_id,
        grade: Number(input.grade),
        feedback: input.feedback || null,
      }),
    });
    if (res.status !== 200) { toast.error("Failed to grade submission"); return; }
    toast.success("Graded successfully!");
    setGradeInputs(prev => { const n = { ...prev }; delete n[submissionId]; return n; });
    fetchAll();
  }

  function getSubmissionsForAssignment(assignmentId: string) {
    return allSubmissions.filter((s: any) => s.assignment_id === assignmentId);
  }

  function getStudentsForClass(cls: ClassRow) {
    if (cls.batch) {
      return allStudents.filter(s => s.batch === cls.batch);
    }
    return allStudents;
  }

  function getUniqueBatches() {
    const batches = new Set<string>();
    allStudents.forEach(s => {
      if (s.batch) batches.add(s.batch);
    });
    if (teacherClass) batches.add(teacherClass);
    return Array.from(batches).sort();
  }

  function getAttendedStudents(classId: string) {
    return attendanceData[classId] || [];
  }

  async function sendAttendanceReminder(cls: ClassRow) {
    setSendingReminder(cls.id);
    const students = getStudentsForClass(cls);
    const attended = getAttendedStudents(cls.id);
    const absentStudents = students.filter(s => !attended.includes(s.user_id));

    if (absentStudents.length === 0) {
      toast.info("All students have already marked attendance!");
      setSendingReminder(null);
      return;
    }

    // Insert notifications for absent students
    const notifications = absentStudents.map(s => ({
      user_id: s.user_id,
      title: "📢 Attendance Reminder",
      message: `You haven't marked attendance for "${cls.title}" (${format(new Date(cls.scheduled_at), "PPp")}). Please mark your attendance now!`,
      type: "attendance_reminder",
    }));

    const token = getAccessToken();
    if (!token) { toast.error("Login required"); setSendingReminder(null); return; }
    await Promise.all(
      notifications.map((n) =>
        api("/api/notifications", {
          method: "POST",
          accessToken: token,
          body: JSON.stringify(n),
        })
      )
    );
    toast.success(`Reminder sent to ${absentStudents.length} student${absentStudents.length > 1 ? "s" : ""}! 🔔`);
    setSendingReminder(null);
  }

  async function approveStudent(studentId: string) {
    setApprovingId(studentId);
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); setApprovingId(null); return; }
    const updateRes = await api(`/api/users/${studentId}`, {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify({ is_approved: true }),
    });
    if (updateRes.status !== 200) {
      toast.error("Failed to approve student");
      setApprovingId(null);
      return;
    }
    await api("/api/notifications", {
      method: "POST",
      accessToken: token,
      body: JSON.stringify({
        user_id: studentId,
        title: "🎉 Account Approved!",
        message: "Your account has been approved by the teacher. You can now log in and start learning!",
        type: "approval",
      }),
    });
    toast.success("Student approved! ✅");
    fetchAll();
    setApprovingId(null);
  }

  async function approveAllPending() {
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const targets = pendingStudents.filter((s) => {
      const matchName = (s.full_name ?? "").toLowerCase().includes(approvalSearch.trim().toLowerCase());
      const matchClass = approvalClassFilter === "all" || (s.class_name ?? "unassigned") === approvalClassFilter;
      return matchName && matchClass;
    });
    if (targets.length === 0) {
      toast.info("No matching pending students to approve");
      return;
    }

    setApprovingId("bulk");
    let successCount = 0;
    for (const s of targets) {
      const updateRes = await api(`/api/users/${s.user_id}`, {
        method: "PUT",
        accessToken: token,
        body: JSON.stringify({ is_approved: true }),
      });
      if (updateRes.status === 200) successCount += 1;
    }
    setApprovingId(null);
    if (successCount === 0) {
      toast.error("Bulk approve failed");
      return;
    }
    toast.success(`${successCount} student${successCount > 1 ? "s" : ""} approved! ✅`);
    fetchAll();
  }

  async function rejectAllPending() {
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const targets = pendingStudents.filter((s) => {
      const matchName = (s.full_name ?? "").toLowerCase().includes(approvalSearch.trim().toLowerCase());
      const matchClass = approvalClassFilter === "all" || (s.class_name ?? "unassigned") === approvalClassFilter;
      return matchName && matchClass;
    });
    if (targets.length === 0) {
      toast.info("No matching pending students to reject");
      return;
    }

    setApprovingId("bulk-reject");
    let successCount = 0;
    for (const s of targets) {
      const delRes = await api(`/api/users/${s.user_id}`, { method: "DELETE", accessToken: token });
      if (delRes.status === 200) successCount += 1;
    }
    setApprovingId(null);
    if (successCount === 0) {
      toast.error("Bulk reject failed");
      return;
    }
    toast.success(`${successCount} student request${successCount > 1 ? "s" : ""} rejected`);
    fetchAll();
  }

  async function rejectStudent(studentId: string) {
    setApprovingId(studentId);
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); setApprovingId(null); return; }
    await api(`/api/users/${studentId}`, { method: "DELETE", accessToken: token });
    toast.success("Student request rejected");
    fetchAll();
    setApprovingId(null);
  }

  async function addStudent() {
    if (!studentForm.password || !studentForm.full_name || !studentForm.batch) {
      toast.error("Password, name, and batch are required");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error("Login required");
      return;
    }

    const contact = studentForm.email.trim();
    if (!contact) {
      toast.error("Student email is required so we can send the welcome message.");
      return;
    }
    if (user?.email && contact.toLowerCase() === user.email.toLowerCase()) {
      toast.error(
        "Use the student's own email address, not your teacher login email. Login for the student still uses Student ID + password."
      );
      return;
    }

    setAddingStudent(true);
    try {
      const assignedClass = teacherClass || studentForm.class_name || null;
      const res = await api<any>("/api/auth/create-student", {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({
          name: studentForm.full_name,
          password: studentForm.password,
          assignedClass,
          batch: studentForm.batch,
          email: contact,
        }),
      });

      if (res.status !== 201 || !res.data) {
        toast.error(getApiErrorMessage(res.error, "Failed to add student"));
        return;
      }

      const newStudentId = res.data.studentId as string | undefined;
      if (newStudentId) {
        toast.success(`Student added! ID: ${newStudentId}`);
      } else {
        toast.success("Student added successfully! ✅");
      }

      const welcomeEmailSent = res.data?.welcomeEmailSent as boolean | undefined;
      if (welcomeEmailSent) {
        toast.success("Welcome email sent to the student.");
      } else {
        toast.error("Welcome email could not be sent", {
          description:
            "Check backend logs. Ensure RESEND_API_KEY / RESEND_FROM or SMTP (SMTP_HOST, SMTP_USER, SMTP_FROM) is set. The student account was still created.",
        });
      }

      if (!newStudentId) {
        toast.error("Student ID missing in server response");
        return;
      }
      setAddedCredentials({
        studentId: newStudentId,
        password: studentForm.password,
        name: studentForm.full_name,
        contactEmail: contact,
      });
      setShowStudentForm(false);
      setStudentForm({ email: "", password: "", full_name: "", batch: "", class_name: teacherClass });
      fetchAll();
    } catch (err: unknown) {
      console.error("Add student error:", err);
      toast.error(getApiErrorMessage(err, "Failed to add student"));
    } finally {
      setAddingStudent(false);
    }
  }

  async function confirmDeleteStudent() {
    if (!studentDeleteTarget) return;
    setDeletingStudent(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Login required", { description: "Please sign in again." });
        setStudentDeleteTarget(null);
        return;
      }
      const res = await api(`/api/users/${studentDeleteTarget.userId}`, { method: "DELETE", accessToken: token });
      if (res.status !== 200) {
        toast.error("Couldn't remove student", {
          description: getApiErrorMessage(res.error, "Check permissions or try again."),
        });
        return;
      }

      toast.success("Student removed", {
        description: `${studentDeleteTarget.name} was permanently deleted from your class.`,
        duration: 5000,
      });
      setStudentDeleteTarget(null);
      void fetchAll();
    } catch (error) {
      console.error("Delete student error:", error);
      toast.error("Something went wrong", {
        description: getApiErrorMessage(error, "Please try again."),
      });
    } finally {
      setDeletingStudent(false);
    }
  }

  async function updateStudent(studentId: string) {
    const token = getAccessToken();
    if (!token) { toast.error("Login required"); return; }
    const res = await api(`/api/users/${studentId}`, {
      method: "PUT",
      accessToken: token,
      body: JSON.stringify({ full_name: editStudentForm.full_name }),
    });
    if (res.status !== 200) { toast.error("Failed to update student"); return; }
    toast.success("Student updated! ✅");
    setEditingStudent(null);
    fetchAll();
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors";
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block";
  const tabsListClass = "grid h-auto w-full grid-cols-2 gap-2 rounded-2xl border border-border/50 bg-muted/50 p-2 sm:flex sm:flex-wrap sm:justify-start";
  const tabsTriggerClass = "w-full justify-start px-2.5 py-2 text-xs sm:w-auto sm:justify-center sm:px-3 sm:py-1.5 sm:text-sm";
  const sectionHeaderClass = "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";
  const primarySectionButtonClass = "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground sm:w-auto";
  const sectionMetaClass = "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end";
  const approvalClassOptions = Array.from(new Set(pendingStudents.map((s) => s.class_name ?? "unassigned")));
  const filteredPendingStudents = pendingStudents.filter((s) => {
    const q = approvalSearch.trim().toLowerCase();
    const matchesSearch = !q || (s.full_name ?? "").toLowerCase().includes(q);
    const matchesClass = approvalClassFilter === "all" || (s.class_name ?? "unassigned") === approvalClassFilter;
    return matchesSearch && matchesClass;
  });

  const stats = [
    { label: "Students", value: allStudents.length, icon: Users, gradient: "var(--gradient-warning, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))" },
    { label: "Classes", value: classes.length, icon: CalendarPlus, gradient: "var(--gradient-primary)" },
    { label: "Assignments", value: assignments.length, icon: FileText, gradient: "var(--gradient-accent)" },
    { label: "Announcements", value: announcements.length, icon: Megaphone, gradient: "var(--gradient-success)" },
  ];

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="glass-card p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary"
            />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Loading Teacher Dashboard</h3>
              <p className="text-sm text-muted-foreground">Fetching your classes and student data...</p>
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Credentials Modal */}
      {addedCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Student Added Successfully! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">Share these credentials with <strong>{addedCredentials.name}</strong></p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Student ID (login code)</p>
                <p className="text-sm font-mono font-semibold text-foreground mt-0.5 select-all">{addedCredentials.studentId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Password</p>
                <p className="text-sm font-mono font-semibold text-foreground mt-0.5 select-all">{addedCredentials.password}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">Student signs in with this Student ID and password on the student login page (not email).</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Student ID: ${addedCredentials.studentId}\nPassword: ${addedCredentials.password}`);
                  toast.success("Credentials copied! 📋");
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                📋 Copy Credentials
              </button>
              <button
                onClick={() => setAddedCredentials(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {teacherClass ? `Managing Class ${teacherClass}` : "Manage your classes, assignments, and announcements"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label || `stat-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.gradient }}>
                <s.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTeacherTab} onValueChange={setTeacherTab} className="space-y-4">
        <TabsList className={tabsListClass}>
          <TabsTrigger value="classes" className={cn(tabsTriggerClass, "data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <CalendarPlus className="w-4 h-4 mr-2" />Classes
          </TabsTrigger>
          <TabsTrigger value="assignments" className={cn(tabsTriggerClass, "data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <FileText className="w-4 h-4 mr-2" />Assignments
          </TabsTrigger>
          <TabsTrigger value="students" className={cn(tabsTriggerClass, "data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <Users className="w-4 h-4 mr-2" />Students
          </TabsTrigger>
          <TabsTrigger value="announcements" className={cn(tabsTriggerClass, "data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <Megaphone className="w-4 h-4 mr-2" />Announcements
          </TabsTrigger>
          <TabsTrigger value="lectures" className={cn(tabsTriggerClass, "data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <Video className="w-4 h-4 mr-2" />Lectures
          </TabsTrigger>
          <TabsTrigger value="myattendance" className={cn(tabsTriggerClass, "data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <Fingerprint className="w-4 h-4 mr-2" />My Attendance
          </TabsTrigger>
          <TabsTrigger value="myleave" className={cn(tabsTriggerClass, "data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <CalendarOff className="w-4 h-4 mr-2" />My Leave
          </TabsTrigger>
          <TabsTrigger value="approvals" className={cn(tabsTriggerClass, "relative data-[state=active]:bg-primary/10 data-[state=active]:text-primary")}>
            <UserCheck className="w-4 h-4 mr-2" />Approvals
            {pendingStudents.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {pendingStudents.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== CLASSES ===== */}
        <TabsContent value="classes" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">Class Schedule</h2>
            <button onClick={() => setShowClassForm(!showClassForm)} className={primarySectionButtonClass} style={{ background: "var(--gradient-primary)" }}>
              <Plus className="w-4 h-4" />{showClassForm ? "Cancel" : "Schedule Class"}
            </button>
          </div>

          {showClassForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Title</label><input className={inputClass} value={classForm.title} onChange={e => setClassForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Data Structures Lecture" /></div>
                <div><label className={labelClass}>Subject</label><input className={inputClass} value={classForm.subject} onChange={e => setClassForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Computer Science" /></div>
                <div><label className={labelClass}>Batch</label><input className={inputClass} value={classForm.batch} onChange={e => setClassForm(p => ({ ...p, batch: e.target.value }))} placeholder="e.g. CS-2026" /></div>
                <div><label className={labelClass}>Location</label><input className={inputClass} value={classForm.location} onChange={e => setClassForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Room 301" /></div>
                <div>
                  <label className={labelClass}>Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "text-left")}>{format(classForm.scheduled_at, "PPP")}</button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={classForm.scheduled_at} onSelect={d => d && setClassForm(p => ({ ...p, scheduled_at: d }))} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div><label className={labelClass}>Duration (min)</label><input type="number" className={inputClass} value={classForm.duration_minutes} onChange={e => setClassForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))} /></div>
              </div>
              <div><label className={labelClass}>Description</label><textarea className={cn(inputClass, "min-h-[80px]")} value={classForm.description} onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional class description..." /></div>
              <button onClick={createClass} className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>Create Class</button>
            </motion.div>
          )}

          {classes.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground"><CalendarPlus className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No classes scheduled yet</p></div>
          ) : (
            <div className="space-y-3">
              {classes.map(c => {
                const classStudents = getStudentsForClass(c);
                const attended = getAttendedStudents(c.id);
                const absentStudents = classStudents.filter(s => !attended.includes(s.user_id));
                const isExpanded = expandedClassAttendance === c.id;

                return (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-hover p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-foreground">{c.title}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c.subject}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(c.scheduled_at), "PPp")} · {c.duration_minutes}min</span>
                          {c.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>}
                          {c.batch && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]">{c.batch}</span>}
                        </div>
                        {/* Attendance summary badges */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 text-[11px] font-medium bg-success/10 text-success px-2 py-0.5 rounded-full">
                            <UserCheck className="w-3 h-3" /> {attended.length} Present
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            <UserX className="w-3 h-3" /> {absentStudents.length} Absent
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            / {classStudents.length} total
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {classStudents.length > 0 && (
                          <button onClick={() => setExpandedClassAttendance(isExpanded ? null : c.id)} className="text-muted-foreground hover:text-primary transition-colors" title="View Attendance">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                        <button onClick={() => setAttendanceClass(c)} className="text-muted-foreground hover:text-primary transition-colors" title="Mark Attendance"><ClipboardCheck className="w-4 h-4" /></button>
                        {absentStudents.length > 0 && (
                          <button
                            onClick={() => sendAttendanceReminder(c)}
                            disabled={sendingReminder === c.id}
                            className="text-muted-foreground hover:text-warning transition-colors"
                            title="Send Reminder to Absent Students"
                          >
                            <Bell className={cn("w-4 h-4", sendingReminder === c.id && "animate-pulse")} />
                          </button>
                        )}
                        <button onClick={() => deleteItem("classes", c.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Expanded attendance list */}
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground">Attendance Details</h4>
                          {absentStudents.length > 0 && (
                            <button
                              onClick={() => sendAttendanceReminder(c)}
                              disabled={sendingReminder === c.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              {sendingReminder === c.id ? "Sending..." : `Send Reminder (${absentStudents.length})`}
                            </button>
                          )}
                        </div>

                        {/* Present students */}
                        {attended.length > 0 && (
                          <div>
                            <p className="text-xs text-success font-medium mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Present ({attended.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {attended.map(sid => {
                                const student = allStudents.find(s => s.user_id === sid);
                                return (
                                  <div key={sid} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/5 border border-success/20">
                                    <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center text-[10px] font-semibold text-success">
                                      {(student?.full_name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-foreground">{student?.full_name || "Unknown"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Absent students */}
                        {absentStudents.length > 0 && (
                          <div>
                            <p className="text-xs text-destructive font-medium mb-2 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Absent ({absentStudents.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {absentStudents.map(student => (
                                <div key={student.user_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/5 border border-destructive/20">
                                  <div className="w-6 h-6 rounded-full bg-destructive/15 flex items-center justify-center text-[10px] font-semibold text-destructive">
                                    {(student.full_name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs text-foreground">{student.full_name || "Unknown"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Attendance Marker */}
          {attendanceClass && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5">
              <AttendanceMarker
                classId={attendanceClass.id}
                classTitle={attendanceClass.title}
                classBatch={attendanceClass.batch}
                scheduledAt={attendanceClass.scheduled_at}
                onClose={() => { setAttendanceClass(null); fetchAll(); }}
              />
            </motion.div>
          )}
        </TabsContent>

        {/* ===== ASSIGNMENTS ===== */}
        <TabsContent value="assignments" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
            <button onClick={() => setShowAssignmentForm(!showAssignmentForm)} className={primarySectionButtonClass} style={{ background: "var(--gradient-primary)" }}>
              <Plus className="w-4 h-4" />{showAssignmentForm ? "Cancel" : "Create Assignment"}
            </button>
          </div>

          {showAssignmentForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Title</label><input className={inputClass} value={assignmentForm.title} onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Binary Trees Assignment" /></div>
                <div><label className={labelClass}>Batch</label>
                  <select className={inputClass} value={assignmentForm.batch} onChange={e => setAssignmentForm(p => ({ ...p, batch: e.target.value }))}>
                    <option value="">Select Batch</option>
                    {getUniqueBatches().map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>📅 Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "text-left font-medium")}>{format(assignmentForm.due_date, "PPP")}</button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={assignmentForm.due_date} onSelect={d => d && setAssignmentForm(p => ({ ...p, due_date: d }))} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className={labelClass}>⏰ Due Time</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={assignmentForm.due_time}
                    onChange={e => setAssignmentForm(p => ({ ...p, due_time: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Students can submit for practice after this deadline</p>
                </div>
                <div><label className={labelClass}>Max Score</label><input type="number" className={inputClass} value={assignmentForm.max_score} onChange={e => setAssignmentForm(p => ({ ...p, max_score: parseInt(e.target.value) || 100 }))} /></div>
                <div><label className={labelClass}>Duration (hours)</label><input type="number" step="0.5" className={inputClass} value={assignmentForm.duration_hours} onChange={e => setAssignmentForm(p => ({ ...p, duration_hours: e.target.value }))} placeholder="e.g. 2, 0.5" /></div>
                <div><label className={labelClass}>Reference Link (optional)</label><input className={inputClass} value={assignmentForm.reference_link} onChange={e => setAssignmentForm(p => ({ ...p, reference_link: e.target.value }))} placeholder="https://docs.google.com/... / problem link" /></div>
                {classes.length > 0 && (
                  <div>
                    <label className={labelClass}>Link to Class (optional)</label>
                    <select className={inputClass} value={assignmentForm.class_id} onChange={e => setAssignmentForm(p => ({ ...p, class_id: e.target.value }))}>
                      <option value="">None</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div><label className={labelClass}>Description</label><textarea className={cn(inputClass, "min-h-[80px]")} value={assignmentForm.description} onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))} placeholder="Assignment instructions..." /></div>
              
              {/* Deadline Preview */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Deadline Preview</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Students must submit before: <span className="font-mono text-foreground">{format(new Date(assignmentForm.due_date), "PPP")} at {assignmentForm.due_time || "23:59"}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  After deadline: <span className="text-violet-600 font-medium">Practice Mode Available</span>
                </p>
              </div>
              
              <button onClick={createAssignment} className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>Create & Publish</button>
            </motion.div>
          )}

          {assignments.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No assignments created yet</p></div>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => {
                const subs = getSubmissionsForAssignment(a.id);
                const isExpanded = expandedAssignment === a.id;
                return (
                  <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-hover p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{a.title}</h3>
                          <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", a.status === "published" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{a.status}</span>
                          {subs.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                              {subs.length} submission{subs.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due {format(new Date(a.due_date), "PPP")}</span>
                          <span>Max: {a.max_score} pts</span>
                          {a.batch && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]">{a.batch}</span>}
                          {a.reference_link && (
                            <a href={a.reference_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="w-3 h-3" /> Reference
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {subs.length > 0 && (
                          <button onClick={() => setExpandedAssignment(isExpanded ? null : a.id)} className="text-muted-foreground hover:text-primary transition-colors" title="View Submissions">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                        {a.status === "draft" && (
                          <button onClick={() => publishAssignment(a.id)} className="text-muted-foreground hover:text-success transition-colors" title="Publish"><Send className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => deleteItem("teacher_assignments", a.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Submissions expandable */}
                    {isExpanded && subs.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border/30 space-y-3">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Inbox className="w-4 h-4" /> Student Submissions
                        </h4>
                        {subs.map((sub: any, index: number) => {
                          const studentName = sub.student_name || "Unknown Student";
                          const gi = gradeInputs[sub.id] || { grade: sub.grade || "", feedback: sub.feedback || "" };
                          return (
                            <div key={sub.id || `sub-${index}`} className="p-3 rounded-lg bg-muted/30 border border-border/20 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{studentName}</p>
                                  {(sub.status === "late" || sub.is_late) && (
                                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/15 text-warning">
                                      Late Submission
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Link2 className="w-3 h-3 text-primary" />
                                    <a href={sub.submission_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-xs">
                                      {sub.submission_link}
                                    </a>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    Submitted: {format(new Date(sub.submitted_at), "PPp")}
                                  </p>
                                </div>
                                {sub.grade && (
                                  <span className="px-3 py-1 rounded-lg bg-success/15 text-success text-sm font-semibold">
                                    {sub.grade}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <input
                                  className={cn(inputClass, "sm:w-24")}
                                  placeholder="Grade"
                                  value={gi.grade}
                                  onChange={e => setGradeInputs(prev => ({ ...prev, [sub.id]: { ...gi, grade: e.target.value } }))}
                                />
                                <input
                                  className={cn(inputClass, "flex-1")}
                                  placeholder="Feedback (optional)"
                                  value={gi.feedback}
                                  onChange={e => setGradeInputs(prev => ({ ...prev, [sub.id]: { ...gi, feedback: e.target.value } }))}
                                />
                                <button
                                  onClick={() => gradeSubmission(sub.id)}
                                  className="px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground flex-shrink-0"
                                  style={{ background: "var(--gradient-primary)" }}
                                >
                                  <Star className="w-4 h-4 inline mr-1" />{sub.grade ? "Update" : "Grade"}
                                </button>
                              </div>
                              {sub.feedback && sub.grade && (
                                <p className="text-xs text-muted-foreground italic">"{sub.feedback}"</p>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== STUDENTS ===== */}
        <TabsContent value="students" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">Student Management</h2>
            <div className={sectionMetaClass}>
              <span className="text-sm text-muted-foreground">{allStudents.length} students enrolled</span>
              <button onClick={() => setShowStudentForm(!showStudentForm)} className={primarySectionButtonClass} style={{ background: "var(--gradient-primary)" }}>
                <Plus className="w-4 h-4" />{showStudentForm ? "Cancel" : "Add Student"}
              </button>
            </div>
          </div>

          {showStudentForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 space-y-4">
              <p className="text-xs text-muted-foreground">
                A unique <strong className="text-foreground">Student ID</strong> (login code) is created for sign-in. <strong className="text-foreground">Student email</strong> is required so we can send the welcome message. It must be a new address on LearnX (the student&apos;s inbox, not your teacher login email).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className={labelClass}>Full Name *</label><input className={inputClass} value={studentForm.full_name} onChange={e => setStudentForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Rahul Sharma" /></div>
                <div><label className={labelClass}>Student email *</label><input className={inputClass} type="email" value={studentForm.email} onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))} placeholder="Student's inbox for welcome email" required /></div>
                <div><label className={labelClass}>Password *</label><input className={inputClass} type="password" value={studentForm.password} onChange={e => setStudentForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" /></div>
                <div>
                  <label className={labelClass}>Batch *</label>
                  <select className={inputClass} value={studentForm.batch} onChange={e => setStudentForm(p => ({ ...p, batch: e.target.value }))} required>
                    <option value="">Select Batch</option>
                    {getUniqueBatches().map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Class (auto-assigned)</label>
                  <input className={cn(inputClass, "bg-muted/80")} value={teacherClass ? `Class ${teacherClass}` : "Not assigned"} disabled />
                </div>
              </div>
              <button onClick={addStudent} disabled={addingStudent} className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-primary)" }}>
                {addingStudent ? "Adding..." : "Add Student"}
              </button>
            </motion.div>
          )}
          {allStudents.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No students enrolled yet</p></div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Name</th>
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Class</th>
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Student ID</th>
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Attendance</th>
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map(s => {
                    const totalClasses = classes.filter(c => !c.batch || c.batch === s.batch).length;
                    const attendedClasses = Object.entries(attendanceData).filter(([classId, studentIds]) => {
                      const cls = classes.find(c => c.id === classId);
                      return cls && (!cls.batch || cls.batch === s.batch) && studentIds.includes(s.user_id);
                    }).length;
                    const rate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
                    const isEditing = editingStudent === s.user_id;

                    return (
                      <tr key={s.user_id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input className={cn(inputClass, "max-w-[180px]")} value={editStudentForm.full_name} onChange={e => setEditStudentForm(p => ({ ...p, full_name: e.target.value }))} />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                {(s.full_name || "?").charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-foreground">{s.full_name || "Unknown"}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                            {s.class_name ? `Class ${s.class_name}` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-foreground">{s.student_id || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-muted/50 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", rate >= 75 ? "bg-success" : rate >= 50 ? "bg-warning" : "bg-destructive")}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className={cn("text-xs font-medium", rate >= 75 ? "text-success" : rate >= 50 ? "text-warning" : "text-destructive")}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {isEditing ? (
                              <>
                                <button onClick={() => updateStudent(s.user_id)} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingStudent(null)} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingStudent(s.user_id); setEditStudentForm({ full_name: s.full_name || "" }); }} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStudentDeleteTarget({ userId: s.user_id, name: s.full_name || "Student" })
                                  }
                                  className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                  title="Delete student"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
        </TabsContent>

        {/* ===== ANNOUNCEMENTS ===== */}
        <TabsContent value="announcements" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
            <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className={primarySectionButtonClass} style={{ background: "var(--gradient-primary)" }}>
              <Plus className="w-4 h-4" />{showAnnouncementForm ? "Cancel" : "Post Announcement"}
            </button>
          </div>

          {showAnnouncementForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Title</label><input className={inputClass} value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Exam Schedule Update" /></div>
                <div><label className={labelClass}>Batch (optional)</label><input className={inputClass} value={announcementForm.batch} onChange={e => setAnnouncementForm(p => ({ ...p, batch: e.target.value }))} placeholder="Leave empty for all" /></div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select className={inputClass} value={announcementForm.priority} onChange={e => setAnnouncementForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div><label className={labelClass}>Content</label><textarea className={cn(inputClass, "min-h-[100px]")} value={announcementForm.content} onChange={e => setAnnouncementForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your announcement..." /></div>
              <button onClick={createAnnouncement} className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>Post Announcement</button>
            </motion.div>
          )}

          {announcements.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground"><Megaphone className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No announcements yet</p></div>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-hover p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{a.title}</h3>
                        {a.priority === "urgent" && <AlertTriangle className="w-4 h-4 text-destructive" />}
                        {a.priority === "important" && <Info className="w-4 h-4 text-warning" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{format(new Date(a.created_at), "PPp")}</span>
                        {a.batch && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]">{a.batch}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteItem("announcements", a.id)} className="self-end text-muted-foreground hover:text-destructive transition-colors sm:self-auto"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== MY ATTENDANCE ===== */}
        <TabsContent value="myattendance" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">My Attendance</h2>
          </div>

          {/* GPS Location Attendance Flow */}
          {!todayMarked && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  teacherCoords ? "bg-success/15" : "bg-primary/10"
                }`}>
                  {gpsLoading ? (
                    <Clock className="w-5 h-5 text-primary animate-spin" />
                  ) : teacherCoords ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Verify Your Location</h3>
                  <p className="text-xs text-muted-foreground">
                    {teacherCoords
                      ? `📍 Location captured (${teacherCoords.lat.toFixed(4)}, ${teacherCoords.lng.toFixed(4)})`
                      : "Capture your GPS location to mark attendance"}
                  </p>
                </div>
                {!teacherCoords && (
                  <button
                    onClick={requestTeacherGPS}
                    disabled={gpsLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-50"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {gpsLoading ? "Locating..." : "Get Location"}
                  </button>
                )}
              </div>

              {teacherCoords && (
                <button
                  onClick={markMyAttendance}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Fingerprint className="w-4 h-4" />
                  Mark Attendance
                </button>
              )}
            </motion.div>
          )}

          {todayMarked && (
            <div className="glass-card p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <p className="text-sm font-semibold text-foreground">Today's Attendance Marked ✅</p>
                <p className="text-xs text-muted-foreground">You have already checked in today</p>
              </div>
            </div>
          )}
          
            <div className="glass-card p-4">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="stat-card flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Present</p>
                <p className="text-2xl font-bold text-foreground mt-1">{myAttendance.filter(a => a.status === "present").length}</p>
              </div>
              <div className="stat-card flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">This Month</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {myAttendance.filter(a => {
                    const d = new Date(a.date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>

          {myAttendance.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <Fingerprint className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No attendance records yet</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs text-muted-foreground uppercase tracking-wider px-4 py-3">Check In</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.slice(0, 30).map((att: any, index: number) => (
                    <tr key={att.id || `att-${index}`} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3 text-sm text-foreground">{format(new Date(att.date), "PPP")}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium",
                          att.status === "present" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        )}>{att.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {att.check_in_time ? format(new Date(att.check_in_time), "p") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== MY LEAVE ===== */}
        <TabsContent value="myleave" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">My Leave Requests</h2>
            <button
              onClick={() => setShowLeaveForm(!showLeaveForm)}
              className={primarySectionButtonClass}
              style={{ background: "var(--gradient-primary)" }}
            >
              <Plus className="w-4 h-4" />{showLeaveForm ? "Cancel" : "Request Leave"}
            </button>
          </div>

          {showLeaveForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Leave Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn(inputClass, "text-left")}>{format(leaveForm.leave_date, "PPP")}</button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={leaveForm.leave_date} onSelect={d => d && setLeaveForm(p => ({ ...p, leave_date: d }))} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className={labelClass}>Leave Type</label>
                  <select className={inputClass} value={leaveForm.leave_type} onChange={e => setLeaveForm(p => ({ ...p, leave_type: e.target.value }))}>
                    <option value="full_day">Full Day</option>
                    <option value="half_day">Half Day</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Reason *</label>
                <textarea className={cn(inputClass, "min-h-[80px]")} value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave..." />
              </div>
              <button onClick={requestLeave} className="px-6 py-2.5 rounded-lg text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>Submit Request</button>
            </motion.div>
          )}

          {myLeaves.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <CalendarOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeaves.map((lv: any, index: number) => (
                <motion.div key={lv.id || `leave-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card-hover p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{format(new Date(lv.leave_date), "PPP")}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium",
                          lv.leave_type === "full_day" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"
                        )}>{lv.leave_type === "full_day" ? "Full Day" : "Half Day"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{lv.reason}</p>
                      {lv.reviewer_note && <p className="text-xs text-muted-foreground italic">Admin note: "{lv.reviewer_note}"</p>}
                    </div>
                    <span className={cn("px-3 py-1 rounded-lg text-xs font-medium",
                      lv.status === "approved" ? "bg-success/15 text-success" :
                      lv.status === "rejected" ? "bg-destructive/15 text-destructive" :
                      "bg-warning/15 text-warning"
                    )}>{lv.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== APPROVALS ===== */}
        <TabsContent value="approvals" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">Pending Student Approvals</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm text-muted-foreground">{filteredPendingStudents.length} shown / {pendingStudents.length} pending</span>
              <button
                onClick={() => setBulkApprovalAction("approve")}
                disabled={filteredPendingStudents.length === 0 || approvingId === "bulk"}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {approvingId === "bulk" ? "Approving..." : "Approve All (Filtered)"}
              </button>
              <button
                onClick={() => setBulkApprovalAction("reject")}
                disabled={filteredPendingStudents.length === 0 || approvingId === "bulk-reject"}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                {approvingId === "bulk-reject" ? "Rejecting..." : "Reject All (Filtered)"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Search Student</label>
              <input
                className={inputClass}
                value={approvalSearch}
                onChange={(e) => setApprovalSearch(e.target.value)}
                placeholder="Type student name..."
              />
            </div>
            <div>
              <label className={labelClass}>Filter by Class</label>
              <select
                className={inputClass}
                value={approvalClassFilter}
                onChange={(e) => setApprovalClassFilter(e.target.value)}
              >
                <option value="all">All Classes</option>
                {approvalClassOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === "unassigned" ? "Unassigned" : `Class ${c}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {filteredPendingStudents.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No matching pending approvals</p>
              <p className="text-xs mt-1">Try clearing search/filter or all students are approved</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPendingStudents.map(s => (
                <motion.div key={s.user_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-sm font-bold text-amber-600 dark:text-amber-400">
                      {(s.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.full_name || "Unknown"}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {s.class_name && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <School className="w-3 h-3" /> {s.class_name}
                          </span>
                        )}
                        {s.student_id && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                            ID: {s.student_id}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <button
                        onClick={() => approveStudent(s.user_id)}
                        disabled={approvingId === s.user_id}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50 sm:w-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => rejectStudent(s.user_id)}
                        disabled={approvingId === s.user_id}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50 sm:w-auto"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
        <AlertDialog open={!!bulkApprovalAction} onOpenChange={(open) => { if (!open) setBulkApprovalAction(null); }}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkApprovalAction === "approve" ? "Approve filtered students?" : "Reject filtered students?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkApprovalAction === "approve"
                  ? `This will approve ${filteredPendingStudents.length} pending student account(s).`
                  : `This will delete ${filteredPendingStudents.length} pending student account(s). This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={approvingId === "bulk" || approvingId === "bulk-reject"}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (bulkApprovalAction === "approve") await approveAllPending();
                  if (bulkApprovalAction === "reject") await rejectAllPending();
                  setBulkApprovalAction(null);
                }}
                disabled={approvingId === "bulk" || approvingId === "bulk-reject"}
                className={bulkApprovalAction === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                {bulkApprovalAction === "approve" ? "Yes, Approve All" : "Yes, Reject All"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ===== LECTURES ===== */}
        <TabsContent value="lectures" className="space-y-4">
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-semibold text-foreground">Lectures</h2>
            <button onClick={() => setShowLectureForm(!showLectureForm)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto">
              <Plus className="w-4 h-4" /> Add Lecture
            </button>
          </div>

          {showLectureForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Youtube className="w-5 h-5 text-destructive" /> New Lecture</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Title *</label><input value={lectureForm.title} onChange={e => setLectureForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Lecture title" /></div>
                <div><label className={labelClass}>YouTube URL *</label><input value={lectureForm.youtube_url} onChange={e => setLectureForm(p => ({ ...p, youtube_url: e.target.value }))} className={inputClass} placeholder="https://youtube.com/watch?v=..." /></div>
                <div><label className={labelClass}>Batch</label><input value={lectureForm.batch} onChange={e => setLectureForm(p => ({ ...p, batch: e.target.value }))} className={inputClass} placeholder="e.g. 2024" /></div>
                <div className="md:col-span-2"><label className={labelClass}>Description</label><textarea value={lectureForm.description} onChange={e => setLectureForm(p => ({ ...p, description: e.target.value }))} className={inputClass + " min-h-[80px]"} placeholder="Lecture description..." /></div>
              </div>
              <button onClick={async () => {
                if (!lectureForm.title || !lectureForm.youtube_url) { toast.error("Title and YouTube URL are required"); return; }
                    const token = getAccessToken();
                    if (!token) { toast.error("Login required"); return; }

                    const res = await api("/api/lectures", {
                      method: "POST",
                      accessToken: token,
                      body: JSON.stringify({
                        title: lectureForm.title,
                        description: lectureForm.description || null,
                        youtube_url: lectureForm.youtube_url,
                        batch: lectureForm.batch || null,
                        status: "published",
                      }),
                    });

                    if (res.status !== 201 && res.status !== 200) {
                      toast.error("Failed to create lecture");
                      return;
                    }

                    toast.success("Lecture added! 🎬");
                setShowLectureForm(false);
                setLectureForm({ title: "", description: "", youtube_url: "", batch: "" });
                fetchAll();
              }} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                Create Lecture
              </button>
            </motion.div>
          )}

          {lecturesList.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No lectures yet. Add your first lecture!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lecturesList.map((lec: any) => {
                const videoId = extractYouTubeId(lec.youtube_url);
                const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
                return (
                  <motion.div key={lec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        if (!videoId) {
                          toast.error("Invalid YouTube URL");
                          return;
                        }
                        setPlayingLecture(lec);
                      }}
                      className="relative w-full aspect-video bg-black/90 overflow-hidden group"
                      aria-label="Play lecture"
                    >
                      {thumb ? (
                        <img src={thumb} alt={lec.title} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Youtube className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </button>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">{lec.title}</h3>
                      {lec.description && <p className="text-xs text-muted-foreground line-clamp-2">{lec.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{lec.created_at ? format(new Date(lec.created_at), "PP") : "No date"}</span>
                        <button
                          onClick={async () => {
                            const token = getAccessToken();
                            if (!token) { toast.error("Login required"); return; }
                            const delRes = await api(`/api/lectures/${lec.id}`, { method: "DELETE", accessToken: token });
                            if (delRes.status !== 200) toast.error("Delete failed");
                            else toast.success("Deleted!");
                            fetchAll();
                          }}
                          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {playingLecture && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
              <button
                type="button"
                onClick={() => setPlayingLecture(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(playingLecture.youtube_url)}?autoplay=1&rel=0&modestbranding=1`}
                  title={playingLecture.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={studentDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletingStudent) setStudentDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-[440px] border-2 border-destructive/25 bg-gradient-to-b from-background via-background to-destructive/[0.04] shadow-2xl shadow-destructive/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/5 ring-2 ring-destructive/20">
            <Trash2 className="h-7 w-7 text-destructive" aria-hidden />
          </div>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-xl font-bold tracking-tight">Remove this student?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              <span className="font-semibold text-foreground">{studentDeleteTarget?.name}</span> will lose access to
              LearnX and their data for this class. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 pt-2">
            <AlertDialogCancel disabled={deletingStudent} className="rounded-xl border-2 sm:min-w-[120px]">
              Cancel
            </AlertDialogCancel>
            <button
              type="button"
              disabled={deletingStudent}
              onClick={() => void confirmDeleteStudent()}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "rounded-xl gap-2 sm:min-w-[160px] bg-gradient-to-r from-destructive to-rose-600 hover:from-destructive/90 hover:to-rose-600/90 shadow-lg shadow-destructive/25"
              )}
            >
              {deletingStudent ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove student
                </>
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
