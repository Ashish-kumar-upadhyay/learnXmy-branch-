import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Award, CheckCircle2, Play, Eye, Trash2, Camera, AlertTriangle, Shield, Wand2, RefreshCw, Calendar, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, API_BASE, getAccessToken } from "@/lib/backendApi";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import * as faceDetection from "@tensorflow-models/face-detection";
import "@tensorflow/tfjs";

interface Exam {
  id: string;
  title: string;
  batch: string | null;
  teacher_id: string;
  exam_type: string;
  duration_minutes: number;
  total_marks?: number;
  status: string;
  scheduled_at?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  created_at: string;
  question_count?: number;
}

interface Question {
  id: string;
  exam_id: string;
  question: string;
  options: string[];
  correct_answer?: string;
  marks: number;
  sort_order: number;
}

interface Submission {
  id: string;
  exam_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  percentage: number | null;
  status: string;
  warning_count?: number;
  auto_submit_reason?: "time_up" | "tab_switch" | "reload" | null;
  result_breakdown?: ResultItem[];
  expires_at?: string;
}

interface ResultItem {
  question_id: string;
  question: string;
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
}

interface AttemptStartPayload {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  warning_count: number;
}

interface SubmitPayload extends Submission {
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
}

interface AiDraftQuestion {
  localId: string;
  question: string;
  options: string[];
  correct_answer: string;
  selected: boolean;
}

interface StudentPerformance {
  id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  score: number;
  percentage: number;
  status: string;
  submitted_at?: string;
  started_at?: string;
  auto_submit_reason?: string;
  warning_count: number;
}

type View = "list" | "create" | "questions" | "attempt" | "result" | "student-reports";

const ACTIVE_EXAM_KEY = "learnx_active_exam";
const ACTIVE_ANSWERS_KEY = "learnx_active_exam_answers";

export default function Exams() {
  const { user, roles, profile } = useAuth();
  const navigate = useNavigate();
  const isStudent = !roles.includes("admin") && !roles.includes("teacher");
  const isTeacher = roles.includes("teacher");
  const isAdmin = roles.includes("admin");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tabSwitchedRef = useRef(false);
  const lastWarningRef = useRef<string>("");
  const lastWarningTypeRef = useRef<"warning" | "error">("warning");
  const faceDetectorRef = useRef<faceDetection.FaceDetector | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPersonCountRef = useRef<number>(0);

  const normalizeBatch = (b?: string | null) => {
    const s = String(b ?? "").trim();
    if (!s) return "";
    return s.replace(/^batch\s+/i, "").trim();
  };

  const [view, setView] = useState<View>("list");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resultData, setResultData] = useState<SubmitPayload | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [attemptMeta, setAttemptMeta] = useState<AttemptStartPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptAlert, setAttemptAlert] = useState<{ type: "warning" | "error"; text: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{ type: "warning" | "error"; text: string } | null>(null);

  const [examForm, setExamForm] = useState({ 
  title: "", 
  exam_type: "quiz", 
  duration_minutes: 10,
  due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  due_time: "23:59"
});

  const [qForm, setQForm] = useState({ question: "", options: ["", "", "", ""], correct_answer: "", marks: 1 });
  const [questionMode, setQuestionMode] = useState<"manual" | "ai">("manual");
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<AiDraftQuestion[]>([]);
  const [examStatistics, setExamStatistics] = useState<Record<string, {
    totalStudents: number;
    submittedStudents: number;
    inProgressStudents: number;
    completionRate: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    gradeDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  }>>({});
  const [studentPerformance, setStudentPerformance] = useState<Record<string, StudentPerformance[]>>({});
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    examId: string | null;
    examTitle: string | null;
  }>({ isOpen: false, examId: null, examTitle: null });
  const [selectedExamForReports, setSelectedExamForReports] = useState<Exam | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [personCount, setPersonCount] = useState(0);
  const [personDetectionWarning, setPersonDetectionWarning] = useState(false);
  const [personWarningCount, setPersonWarningCount] = useState(0);

  const stopFaceDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setPersonCount(0);
    setPersonDetectionWarning(false);
    setPersonWarningCount(0);
  }, []);

  const clearMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    stopFaceDetection();
  }, [stopFaceDetection]);

  const playAlertBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.22);
    } catch {
      // no-op when browser blocks audio context
    }
  }, []);

  const clearActiveAttemptStorage = useCallback(() => {
    localStorage.removeItem(ACTIVE_EXAM_KEY);
    localStorage.removeItem(ACTIVE_ANSWERS_KEY);
  }, []);

  const fetchExamStatistics = useCallback(async (examIds: string[]) => {
    const accessToken = getAccessToken();
    if (!accessToken || examIds.length === 0) return;

    const statsPromises = examIds.map(async (examId) => {
      try {
        const res = await api(`/api/exams/${examId}/statistics`, { method: "GET", accessToken });
        if (res.status === 200 && res.data) {
          return { examId, stats: res.data };
        }
        return null;
      } catch (error) {
        console.error(`Failed to fetch statistics for exam ${examId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(statsPromises);
    const newStats: Record<string, any> = {};
    
    results.forEach(result => {
      if (result) {
        newStats[result.examId] = result.stats;
      }
    });

    setExamStatistics(newStats);
  }, []);

  const fetchStudentPerformance = useCallback(async (examIds: string[]) => {
    console.log('🔍 fetchStudentPerformance called with examIds:', examIds);
    const accessToken = getAccessToken();
    if (!accessToken || examIds.length === 0) {
      console.log('❌ No access token or empty examIds');
      return;
    }

    const performancePromises = examIds.map(async (examId) => {
      try {
        console.log(`📡 Fetching student performance for exam ${examId}...`);
        const res = await api<StudentPerformance[]>(`/api/exams/${examId}/student-performance`, { method: "GET", accessToken });
        console.log(`📊 Response for exam ${examId}:`, { status: res.status, data: res.data });
        
        if (res.status === 200 && res.data) {
          console.log(`✅ Success for exam ${examId}, got ${res.data.length} students`);
          return { examId, performance: res.data as StudentPerformance[] };
        }
        console.log(`❌ Failed response for exam ${examId}:`, res.status);
        return null;
      } catch (error) {
        console.error(`❌ Failed to fetch student performance for exam ${examId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(performancePromises);
    console.log('📋 All results:', results);
    
    const newPerformance: Record<string, StudentPerformance[]> = {};
    
    results.forEach(result => {
      if (result) {
        newPerformance[result.examId] = result.performance;
        console.log(`💾 Stored performance for exam ${result.examId}:`, result.performance);
      }
    });

    console.log('🔄 Setting studentPerformance state:', newPerformance);
    setStudentPerformance(newPerformance);
  }, []);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) {
      setExams([]);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const examsPath = isStudent
      ? `/api/exams?status=published` // Show ALL published exams
      : isAdmin
        ? "/api/exams"
        : `/api/exams?teacher_id=${encodeURIComponent(user?.id || "")}`;

    const [examsRes, subsRes] = await Promise.all([
      api<Exam[]>(examsPath, { method: "GET", accessToken }),
      isStudent ? api<Submission[]>("/api/exams/my-submissions", { method: "GET", accessToken }) : Promise.resolve({ status: 200, data: [] as Submission[] }),
    ]);

    const fetchedExams = examsRes.status === 200 && examsRes.data ? examsRes.data : [];
    setExams(fetchedExams);
    setSubmissions(subsRes.status === 200 && subsRes.data ? subsRes.data : []);
    
    // Fetch statistics and student performance for teachers and admins
    if (!isStudent && fetchedExams.length > 0) {
      await Promise.all([
        fetchExamStatistics(fetchedExams.map(exam => exam.id)),
        fetchStudentPerformance(fetchedExams.map(exam => exam.id))
      ]);
    }
    
    setLoading(false);
  }, [isAdmin, isStudent, profile?.batch, profile?.class_name, user?.id, fetchExamStatistics, fetchStudentPerformance]);

  useEffect(() => { void fetchExams(); }, [fetchExams]);

  useEffect(() => {
    if (view === "student-reports" && selectedExamForReports) {
      void fetchStudentPerformance([selectedExamForReports.id]);
      void fetchExamStatistics([selectedExamForReports.id]);
    }
  }, [view, selectedExamForReports, fetchStudentPerformance, fetchExamStatistics]);

  const handleViewExamQuestions = (examId: string) => {
    navigate(`/exams/${examId}/questions`, { state: { from: 'exams' } });
  };

  const handleViewExamResults = (examId: string, submission: Submission | undefined) => {
    if (!submission) return;
    navigate(`/exams/${examId}/results`, { 
      state: { 
        submission,
        from: 'exams' 
      } 
    });
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      examId,
      examTitle
    });
  };

  const handleViewStudentReports = (exam: Exam) => {
    setSelectedExamForReports(exam);
    setView("student-reports");
  };

  const confirmDeleteExam = async () => {
    if (!confirmDialog.examId) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("Login required");
      return;
    }

    setDeletingExamId(confirmDialog.examId);
    try {
      const res = await api(`/api/exams/${confirmDialog.examId}`, {
        method: "DELETE",
        accessToken,
      });

      if (res.status === 200) {
        toast.success("Exam deleted successfully");
        void fetchExams(); // Refresh the exam list
      } else {
        toast.error("Failed to delete exam");
      }
    } catch (error) {
      toast.error("Failed to delete exam");
    } finally {
      setDeletingExamId(null);
      setConfirmDialog({ isOpen: false, examId: null, examTitle: null });
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.title.trim()) { toast.error("Title required"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    
    // Calculate due date
    const dueAt = new Date(examForm.due_date);
    const [hh, mm] = (examForm.due_time || "23:59").split(":");
    dueAt.setHours(Number(hh) || 23, Number(mm) || 59, 0, 0);
    
    const examData = {
        title: examForm.title,
        teacher_id: user!.id,
        exam_type: examForm.exam_type,
        duration_minutes: examForm.duration_minutes,
        total_marks: 5,
        status: "draft",
        due_date: dueAt.toISOString(),
        due_time: examForm.due_time,
      };
      
      const res = await api<Exam>("/api/exams", {
        method: "POST",
        accessToken,
        body: JSON.stringify(examData),
      });
    if (res.status !== 201 || !res.data) { 
      toast.error("Failed to create exam"); 
      return; 
    }
    toast.success("Exam created! Now add questions.");
    setSelectedExam(res.data as Exam);
    setQuestionMode("manual");
    setExamForm({ 
      title: "", 
      exam_type: "quiz", 
      duration_minutes: 10,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      due_time: "23:59"
    });
    setView("questions");
    void fetchExams();
  };

  const handleAddQuestion = async () => {
    const filledOptions = qForm.options.map((o) => o.trim()).filter(Boolean);
    if (!qForm.question.trim()) { toast.error("Question text required"); return; }
    if (filledOptions.length !== 4) { toast.error("Exactly 4 options are required"); return; }
    if (!qForm.correct_answer) { toast.error("Select the correct answer"); return; }
    if (questions.length >= 5) { toast.error("Only 5 questions allowed"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/exams/${selectedExam!.id}/questions`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        question: qForm.question.trim(),
        options: qForm.options.map((o) => o.trim()),
        correct_answer: qForm.correct_answer,
        marks: qForm.marks,
        sort_order: questions.length,
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to add question"); return; }
    toast.success("Question added!");
    setQForm({ question: "", options: ["", "", "", ""], correct_answer: "", marks: 1 });
    void fetchQuestions(selectedExam!.id);
  };

  const generateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      toast.error("Topic is required");
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("Login required");
      return;
    }
    setAiLoading(true);
    const res = await api<Array<{ question: string; options: string[]; correct_answer: string }>>("/api/ai/exam/mcqs", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ topic: aiTopic.trim(), count: 10 }),
    });
    setAiLoading(false);
    if (res.status !== 200 || !res.data?.length) {
      toast.error("Failed to generate AI questions");
      return;
    }
    const normalized = res.data
      .filter((item) => item.question && Array.isArray(item.options) && item.options.length === 4 && item.correct_answer)
      .map((item, index) => ({
        localId: `${Date.now()}-${index}`,
        question: item.question,
        options: item.options,
        correct_answer: item.correct_answer,
        selected: index < 5,
      }));
    setAiDrafts(normalized);
    toast.success(`Generated ${normalized.length} AI questions`);
  };

  const toggleAiSelection = (id: string) => {
    setAiDrafts((prev) => prev.map((q) => (q.localId === id ? { ...q, selected: !q.selected } : q)));
  };

  const updateAiDraft = (id: string, patch: Partial<AiDraftQuestion>) => {
    setAiDrafts((prev) => prev.map((q) => (q.localId === id ? { ...q, ...patch } : q)));
  };

  const addSelectedAiQuestionsToExam = async () => {
    if (!selectedExam) return;
    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("Login required");
      return;
    }
    const selected = aiDrafts.filter((q) => q.selected);
    if (!selected.length) {
      toast.error("Select at least one question");
      return;
    }
    const slotsLeft = 5 - questions.length;
    if (slotsLeft <= 0) {
      toast.error("Exam already has 5 questions");
      return;
    }
    const toInsert = selected.slice(0, slotsLeft);
    for (let i = 0; i < toInsert.length; i += 1) {
      const q = toInsert[i];
      const validOptions = q.options.map((x) => x.trim()).filter(Boolean);
      if (!q.question.trim() || validOptions.length !== 4 || !validOptions.includes(q.correct_answer)) continue;
      const res = await api(`/api/exams/${selectedExam.id}/questions`, {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          question: q.question.trim(),
          options: validOptions,
          correct_answer: q.correct_answer,
          marks: 1,
          sort_order: questions.length + i,
        }),
      });
      if (res.status !== 201 && res.status !== 200) {
        toast.error("Some AI questions could not be added");
        break;
      }
    }
    if (selected.length > slotsLeft) {
      toast.warning(`Only ${slotsLeft} questions added (exam limit is 5).`);
    } else {
      toast.success("Selected AI questions added to exam");
    }
    await fetchQuestions(selectedExam.id);
  };

  const fetchQuestions = async (examId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const res = await api<Question[]>(`/api/exams/${examId}/questions`, { method: "GET", accessToken });
    setQuestions((res.status === 200 && res.data ? res.data : []) as Question[]);
  };

  const handlePublish = async (examId: string) => {
    if (questions.length !== 5) {
      toast.error("Publish requires exactly 5 questions");
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/exams/${examId}`, {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ status: "published" }),
    });
    if (res.status !== 200) { toast.error("Publish failed"); return; }
    toast.success("Exam published!");
    void fetchExams();
    // Navigate back to exams list after successful publication
    setView("list");
    setSelectedExam(null);
  };

  const ensureCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraReady(true);
      return true;
    } catch {
      setCameraReady(false);
      toast.error("Camera permission is required for exam attempt.");
      return false;
    }
  }, []);

  const initializeFaceDetection = useCallback(async () => {
    try {
      console.log('Initializing face detection...');
      const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
      const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
        runtime: 'tfjs',
        maxFaces: 5,
      };
      console.log('Face detection config:', detectorConfig);
      const detector = await faceDetection.createDetector(model, detectorConfig);
      console.log('Face detector created successfully');
      faceDetectorRef.current = detector;
    } catch (error) {
      console.error("Failed to initialize face detection:", error);
    }
  }, []);

  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !faceDetectorRef.current || view !== "attempt") return;
    
    try {
      const faces = await faceDetectorRef.current.estimateFaces(videoRef.current);
      const currentPersonCount = faces.length;
      console.log('Face detection result:', { 
        facesDetected: currentPersonCount, 
        faceDetails: faces.map((f: any) => ({ 
          confidence: f.score?.toFixed(2), 
          box: f.box 
        })),
        videoReady: !!videoRef.current,
        detectorReady: !!faceDetectorRef.current
      });
      setPersonCount(currentPersonCount);
      
      // Check if multiple people detected
      if (currentPersonCount > 1 && lastPersonCountRef.current <= 1) {
        // Multiple people detected - show warning
        setPersonDetectionWarning(true);
        setPersonWarningCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            // Auto-submit on second person detection warning
            toast.error("Multiple people detected twice! Exam auto-submitted.");
            void submitExam("tab_switch");
          } else {
            // First warning - show toast
            toast.warning(`Multiple people detected in camera! First warning (1/2)`);
          }
          return newCount;
        });
      } else if (currentPersonCount === 1 && lastPersonCountRef.current > 1) {
        // Back to single person
        setPersonDetectionWarning(false);
      }
      
      lastPersonCountRef.current = currentPersonCount;
    } catch (error) {
      console.error("Face detection error:", error);
    }
  }, [view, personWarningCount]);

  const startFaceDetection = useCallback(() => {
    console.log('Starting face detection...');
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Start detection interval
    detectionIntervalRef.current = setInterval(detectFaces, 2000); // Check every 2 seconds
    console.log('Face detection interval started');
  }, [detectFaces]);

  const startExam = async (exam: Exam) => {
    const existing = submissions.find((s) => s.exam_id === exam.id);
    if (existing && (existing.status === "submitted" || existing.status === "auto_submitted")) {
      toast.error("You have already attempted this exam. Only one attempt is allowed.");
      return;
    }
    const cameraOk = await ensureCamera();
    if (!cameraOk) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const started = await api<AttemptStartPayload>(`/api/exams/${exam.id}/start`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({}),
    });
    if (started.status !== 200 || !started.data) {
      toast.error("Unable to start exam");
      clearMedia();
      return;
    }
    setSelectedExam(exam);
    await fetchQuestions(exam.id);
    setAnswers({});
    setAttemptAlert(null);
    setAlertModal(null);
    tabSwitchedRef.current = false;
    lastWarningRef.current = "";
    lastWarningTypeRef.current = "warning";
    setAttemptMeta(started.data);
    setWarningCount(started.data.warning_count ?? 0);
    const secs = Math.max(0, Math.floor((new Date(started.data.expires_at).getTime() - Date.now()) / 1000));
    setTimeLeft(secs);
    localStorage.setItem(ACTIVE_EXAM_KEY, exam.id);
    localStorage.setItem(ACTIVE_ANSWERS_KEY, JSON.stringify({}));
    
    // Initialize and start face detection
    await initializeFaceDetection();
    startFaceDetection();
    
    setView("attempt");
  };

  useEffect(() => {
    if (view !== "attempt") return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          void submitExam("time_up");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view !== "attempt") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        tabSwitchedRef.current = true;
        setWarningCount((prev) => {
          const next = prev + 1;
          if (next === 1) {
            const msg = "Tab switch detected. Next switch will auto-submit your exam.";
            lastWarningRef.current = msg;
            lastWarningTypeRef.current = "warning";
          } else {
            const msg = "Second tab switch detected. Exam is being auto-submitted.";
            lastWarningRef.current = msg;
            lastWarningTypeRef.current = "error";
            void submitExam("tab_switch");
          }
          return next;
        });
        return;
      }
      if (document.visibilityState === "visible" && tabSwitchedRef.current) {
        tabSwitchedRef.current = false;
        if (lastWarningRef.current) {
          const payload = { type: lastWarningTypeRef.current, text: lastWarningRef.current } as const;
          setAttemptAlert(payload);
          setAlertModal(payload);
          playAlertBeep();
          toast.warning(lastWarningRef.current, { duration: 5000 });
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [playAlertBeep, view]);

  useEffect(() => {
    if (view !== "attempt") return;
    if (!videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => undefined);
    setCameraReady(true);
  }, [view]);

  useEffect(() => {
    // Stop face detection when leaving attempt view
    if (view !== "attempt") {
      stopFaceDetection();
    }
  }, [view, stopFaceDetection]);

  useEffect(() => {
    if (view !== "attempt" || !selectedExam) return;
    const onBeforeUnload = () => {
      try {
        const accessToken = getAccessToken();
        const payload = JSON.stringify({ answers, auto_submit_reason: "reload" });
        if (accessToken) {
          fetch(`${API_BASE}/api/exams/${selectedExam.id}/submit`, {
            method: "POST",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: payload,
          }).catch(() => undefined);
        }
      } catch {
        // no-op
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [answers, selectedExam, view]);

  useEffect(() => {
    const tryReloadAutoSubmit = async () => {
      if (!isStudent) return;
      const examId = localStorage.getItem(ACTIVE_EXAM_KEY);
      if (!examId) return;
      const accessToken = getAccessToken();
      if (!accessToken) return;
      let persistedAnswers: Record<string, string> = {};
      try {
        persistedAnswers = JSON.parse(localStorage.getItem(ACTIVE_ANSWERS_KEY) || "{}") as Record<string, string>;
      } catch {
        persistedAnswers = {};
      }
      await api(`/api/exams/${examId}/submit`, {
        method: "POST",
        accessToken,
        body: JSON.stringify({ answers: persistedAnswers, auto_submit_reason: "reload" }),
      });
      clearActiveAttemptStorage();
      toast.warning("Exam auto-submitted due to page reload.");
      await fetchExams();
    };
    void tryReloadAutoSubmit();
  }, [clearActiveAttemptStorage, fetchExams, isStudent]);

  const submitExam = async (reason: "time_up" | "tab_switch" | "reload" | null = null) => {
    if (!selectedExam || !user || submitting) return;
    setSubmitting(true);
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); setSubmitting(false); return; }
    const res = await api<SubmitPayload>(`/api/exams/${selectedExam.id}/submit`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({ answers, auto_submit_reason: reason }),
    });
    if (res.status !== 200 || !res.data) {
      toast.error("Failed to submit");
      setSubmitting(false);
      return;
    }
    clearMedia();
    clearActiveAttemptStorage();
    setResultData(res.data);
    setView("result");
    toast.success(`Submitted! Score: ${res.data.score} (${res.data.percentage ?? 0}%)`);
    await fetchExams();
    setSubmitting(false);
  };

  const deleteQuestion = async (id: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/exams/${selectedExam!.id}/questions/${id}`, { method: "DELETE", accessToken });
    if (res.status !== 200) toast.error("Delete failed");
    void fetchQuestions(selectedExam!.id);
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const attemptedByExam = useMemo(() => new Map(submissions.map((s) => [s.exam_id, s])), [submissions]);

  const getExamStatus = (exam: Exam, submission?: Submission) => {
    if (exam.status !== "published") {
      return { text: exam.status, color: "bg-amber-500/10 text-amber-600" };
    }

    if (!submission) {
      return { text: "available", color: "bg-blue-500/10 text-blue-600" };
    }

    if (submission.status === "submitted" || submission.status === "auto_submitted") {
      return { text: "complete", color: "bg-emerald-500/10 text-emerald-600" };
    }

    if (submission.status === "in_progress") {
      return { text: "in process", color: "bg-amber-500/10 text-amber-600" };
    }

    return { text: exam.status, color: "bg-emerald-500/10 text-emerald-600" };
  };

  const onAnswerSelect = (questionId: string, option: string) => {
    const next = { ...answers, [questionId]: option };
    setAnswers(next);
    localStorage.setItem(ACTIVE_ANSWERS_KEY, JSON.stringify(next));
  };

  if (view === "attempt" && selectedExam) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {alertModal && (
          <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl border border-border/20 bg-card shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      alertModal.type === "error" 
                        ? "bg-destructive/10 text-destructive" 
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className={`text-lg font-semibold tracking-tight ${
                      alertModal.type === "error" ? "text-destructive" : "text-amber-700"
                    }`}>
                      {alertModal.type === "error" ? "Critical Warning" : "Tab Switch Warning"}
                    </h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">{alertModal.text}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-muted/50 border border-border/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    Exam integrity rule: 1st tab switch warning, 2nd switch auto-submit.
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <button
                    onClick={() => setAlertModal(null)}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Continue Exam
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {attemptAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              attemptAlert.type === "error"
                ? "bg-destructive/5 border-destructive/20 text-destructive"
                : "bg-amber-500/5 border-amber-500/20 text-amber-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{attemptAlert.text}</span>
            </div>
          </motion.div>
        )}
        <div className="grid md:grid-cols-[1fr_280px] gap-4">
          <div className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-xl py-3 px-3 rounded-xl border border-border/20">
            <div>
              <h2 className="text-lg font-bold text-foreground">{selectedExam.title}</h2>
              <p className="text-xs text-muted-foreground">Stay on this tab. Second tab switch auto-submits.</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${timeLeft < 60 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"}`}>
              <Clock className="w-4 h-4" /> {formatTimer(timeLeft)}
            </div>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <Camera className="w-4 h-4 text-primary" /> Live Proctor Camera
            </div>
            <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video rounded-xl object-cover bg-black" />
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              {cameraReady ? "Camera active" : "Camera not active"}
            </div>
            <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Tab warnings: {warningCount}/2
            </div>
            <div className={`mt-1 text-xs flex items-center gap-1 ${
              personDetectionWarning 
                ? "text-destructive" 
                : personCount > 0 
                  ? "text-emerald-600" 
                  : "text-muted-foreground"
            }`}>
              <Users className="w-3.5 h-3.5" />
              {personCount === 0 
                ? "No person detected" 
                : personCount === 1 
                  ? "1 person detected" 
                  : `${personCount} people detected!`
              }
            </div>
            {personWarningCount > 0 && (
              <div className={`mt-1 text-xs flex items-center gap-1 ${
                personWarningCount >= 2 
                  ? "text-destructive" 
                  : "text-amber-600"
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Person warnings: {personWarningCount}/2
              </div>
            )}
          </div>
        </div>
        {questions.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border/20 rounded-2xl p-5">
            <p className="font-semibold text-foreground mb-3"><span className="text-primary">Q{i + 1}.</span> {q.question} <span className="text-xs text-muted-foreground">({q.marks} marks)</span></p>
            <div className="space-y-2">
              {(q.options as string[]).map((opt, j) => (
                <button
                  key={j}
                  onClick={() => onAnswerSelect(q.id, opt)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${answers[q.id] === opt ? "bg-primary/10 border-primary text-primary font-medium" : "border-border/20 text-muted-foreground hover:bg-muted/20"}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span> {opt}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
        <div className="flex gap-3 pb-8">
          <button disabled={submitting} onClick={() => void submitExam(null)} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    );
  }

  if (view === "result" && resultData) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="rounded-2xl border border-border/20 bg-card p-5">
          <h2 className="text-2xl font-bold text-foreground mb-2">Exam Result</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">Score: {resultData.score}</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">Correct: {resultData.correct_answers}</span>
            <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive font-semibold">Wrong: {resultData.wrong_answers}</span>
            <span className="px-3 py-1 rounded-full bg-muted/30 text-muted-foreground font-semibold">Percentage: {resultData.percentage ?? 0}%</span>
          </div>
        </div>
        <div className="space-y-3">
          {(resultData.result_breakdown || []).map((item, index) => (
            <div key={item.question_id} className="rounded-xl border border-border/20 bg-card p-4">
              <p className="font-semibold text-foreground mb-2">Q{index + 1}. {item.question}</p>
              <p className={`text-sm ${item.is_correct ? "text-emerald-600" : "text-destructive"}`}>
                Your answer: {item.selected_answer ?? "Not answered"}
              </p>
              {!item.is_correct && (
                <p className="text-sm text-emerald-600 mt-1">Correct answer: {item.correct_answer}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => { setView("list"); setResultData(null); setSelectedExam(null); }}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  if (view === "questions" && selectedExam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedExam.title} - Questions</h2>
            <p className="text-sm text-muted-foreground">{questions.length}/5 questions added</p>
          </div>
          <div className="flex gap-2">
            {selectedExam.status === "draft" && questions.length === 5 && (
              <button onClick={() => handlePublish(selectedExam.id)} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:opacity-90">Publish</button>
            )}
            <button onClick={() => { setView("list"); setSelectedExam(null); }} className="px-4 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm hover:text-foreground">Back</button>
          </div>
        </div>

        <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setQuestionMode("manual")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${questionMode === "manual" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
            >
              Manual Question Creation
            </button>
            <button
              onClick={() => setQuestionMode("ai")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${questionMode === "ai" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
            >
              AI Generated Questions
            </button>
          </div>

          {questionMode === "manual" ? (
            <>
              <h3 className="font-semibold text-foreground">Add Question</h3>
              <textarea disabled={questions.length >= 5} value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground min-h-[60px]" placeholder="Enter question..." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {qForm.options.map((opt, i) => (
                  <input disabled={questions.length >= 5} key={i} value={opt} onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm({ ...qForm, options: o }); }} className="px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Correct Answer *</label>
                  <select disabled={questions.length >= 5} value={qForm.correct_answer} onChange={e => setQForm({ ...qForm, correct_answer: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                    <option value="">Select correct option</option>
                    {qForm.options.filter(o => o.trim()).map((opt, i) => <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Marks</label>
                  <input type="number" value={qForm.marks} onChange={e => setQForm({ ...qForm, marks: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
                </div>
              </div>
              <button disabled={questions.length >= 5} onClick={handleAddQuestion} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40">Add Question</button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground"
                  placeholder='Enter topic (e.g., "HTML")'
                />
                <button onClick={generateAiQuestions} disabled={aiLoading} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center gap-2">
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {aiLoading ? "Generating..." : "Generate 10 MCQs"}
                </button>
              </div>

              {aiDrafts.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{aiDrafts.filter((q) => q.selected).length} selected</span>
                    <button onClick={() => void addSelectedAiQuestionsToExam()} disabled={questions.length >= 5} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-medium disabled:opacity-50">
                      Add Selected to Exam
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[440px] overflow-auto pr-1">
                    {aiDrafts.map((draft, idx) => (
                      <div key={draft.localId} className="rounded-xl border border-border/20 p-3 bg-background/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <input type="checkbox" checked={draft.selected} onChange={() => toggleAiSelection(draft.localId)} />
                            Q{idx + 1}
                          </label>
                        </div>
                        <textarea
                          value={draft.question}
                          onChange={(e) => updateAiDraft(draft.localId, { question: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border/20 bg-background text-sm text-foreground min-h-[52px]"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {draft.options.map((opt, i) => (
                            <input
                              key={i}
                              value={opt}
                              onChange={(e) => {
                                const next = [...draft.options];
                                next[i] = e.target.value;
                                updateAiDraft(draft.localId, { options: next });
                              }}
                              className="px-3 py-2 rounded-lg border border-border/20 bg-background text-sm text-foreground"
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            />
                          ))}
                        </div>
                        <select
                          value={draft.correct_answer}
                          onChange={(e) => updateAiDraft(draft.localId, { correct_answer: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-border/20 bg-background text-sm text-foreground"
                        >
                          <option value="">Select correct answer</option>
                          {draft.options.filter((o) => o.trim()).map((opt, i) => (
                            <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {questions.length >= 5 && <p className="text-xs text-emerald-600">5 questions completed. You can publish now.</p>}
        </div>

        {/* Questions list */}
        {questions.map((q, i) => (
          <div key={q.id} className="bg-card/50 border border-border/10 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground"><span className="text-primary">Q{i + 1}.</span> {q.question}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(q.options as string[]).map((opt, j) => (
                  <span key={j} className={`text-xs px-2 py-0.5 rounded-full ${opt === q.correct_answer ? "bg-emerald-500/10 text-emerald-600 font-medium" : "bg-muted/30 text-muted-foreground"}`}>
                    {String.fromCharCode(65 + j)}. {opt}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{q.marks} mark(s)</p>
            </div>
            <button onClick={() => deleteQuestion(q.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  // ===== CREATE VIEW =====
  if (view === "create") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Create New Exam / Quiz</h2>
          <button onClick={() => setView("list")} className="px-4 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm hover:text-foreground">Back</button>
        </div>
        <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
            <input value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="Mid-term Quiz" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={examForm.exam_type} onChange={e => setExamForm({ ...examForm, exam_type: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                <option value="quiz">Quiz</option>
                <option value="midterm">Mid-term</option>
                <option value="final">Final Exam</option>
                <option value="practice">Practice Test</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration (minutes)</label>
              <input type="number" value={examForm.duration_minutes} onChange={e => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) || 10 })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">📅 Due Date</label>
              <input 
                type="date" 
                value={examForm.due_date instanceof Date ? examForm.due_date.toISOString().split('T')[0] : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={e => setExamForm({ ...examForm, due_date: new Date(e.target.value) })} 
                className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">⏰ Due Time</label>
              <input 
                type="time" 
                value={examForm.due_time}
                onChange={e => setExamForm({ ...examForm, due_time: e.target.value })} 
                className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" 
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground rounded-xl border border-primary/20 p-3 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">Deadline Preview</span>
            </div>
            <p>
              Students must complete before: <span className="font-mono text-foreground">
                {examForm.due_date instanceof Date ? examForm.due_date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date'} at {examForm.due_time || "23:59"}
              </span>
            </p>
            <p className="mt-1">
              After deadline: <span className="text-violet-600 font-medium">Practice Mode Available</span>
            </p>
          </div>
          <div className="text-xs text-muted-foreground rounded-xl border border-border/20 p-3 bg-muted/20">
            This exam template is locked to <span className="font-semibold text-foreground">5 MCQs</span>, each with <span className="font-semibold text-foreground">4 options</span> and one correct answer.
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateExam} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90">Create & Add 5 Questions</button>
            {(isTeacher || isAdmin) && (
              <button onClick={() => setView("student-reports")} className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:opacity-90 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Student Reports
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== STUDENT REPORTS VIEW =====
  if (view === "student-reports") {
    if (!selectedExamForReports) {
      return (
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Student Exam Reports</h1>
              <p className="text-sm text-muted-foreground">View all student exam performance and statistics</p>
            </div>
            <button
              onClick={() => setView("list")}
              className="px-4 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm hover:text-foreground"
            >
              Back to Exams
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {exams.filter(exam => exam.status === "published").map((exam, index) => {
              const stats = examStatistics[exam.id];
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border/20 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedExamForReports(exam)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{exam.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase bg-emerald-500/10 text-emerald-600">
                        {exam.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
                    <span>📚 {exam.exam_type}</span>
                    <span>⏱ {exam.duration_minutes} min</span>
                    <span>📊 5 marks</span>
                    <span>❓ {exam.question_count} Qs</span>
                  </div>

                  {stats ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-500/5 rounded-lg p-3 text-center">
                          <div className="text-lg font-semibold text-emerald-600">{stats.submittedStudents}</div>
                          <div className="text-xs text-muted-foreground">Submitted</div>
                        </div>
                        <div className="bg-blue-500/5 rounded-lg p-3 text-center">
                          <div className="text-lg font-semibold text-blue-600">{stats.averageScore}</div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
                        </div>
                        <div className="bg-amber-500/5 rounded-lg p-3 text-center">
                          <div className="text-lg font-semibold text-amber-600">{stats.highestScore}</div>
                          <div className="text-xs text-muted-foreground">Highest</div>
                        </div>
                        <div className="bg-violet-500/5 rounded-lg p-3 text-center">
                          <div className="text-lg font-semibold text-violet-600">{stats.completionRate}%</div>
                          <div className="text-xs text-muted-foreground">Completion</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground">Grade Distribution</div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-emerald-600 font-medium">{stats.gradeDistribution.excellent}</div>
                            <div className="text-muted-foreground">Excellent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-600 font-medium">{stats.gradeDistribution.good}</div>
                            <div className="text-muted-foreground">Good</div>
                          </div>
                          <div className="text-center">
                            <div className="text-amber-600 font-medium">{stats.gradeDistribution.average}</div>
                            <div className="text-muted-foreground">Average</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-600 font-medium">{stats.gradeDistribution.poor}</div>
                            <div className="text-muted-foreground">Poor</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">No student data available</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    }

    // Detailed view for selected exam
    const stats = examStatistics[selectedExamForReports.id];
    const performance = studentPerformance[selectedExamForReports.id] || [];
    
    console.log('📊 Student Reports Debug:', {
      selectedExamId: selectedExamForReports.id,
      stats: stats,
      performance: performance,
      allStudentPerformance: studentPerformance,
      performanceLength: performance.length
    });

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Reports - {selectedExamForReports.title}</h1>
            <p className="text-sm text-muted-foreground">Detailed student performance for this exam</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedExamForReports(null)}
              className="px-4 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm hover:text-foreground"
            >
              Back to All Exams
            </button>
            <button
              onClick={() => {
                fetchStudentPerformance([selectedExamForReports.id]);
                fetchExamStatistics([selectedExamForReports.id]);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 text-sm hover:bg-amber-500/20 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <button
              onClick={() => setView("list")}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:opacity-90"
            >
              Back to Exam List
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-500/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.submittedStudents}</div>
              <div className="text-sm text-muted-foreground">Students Submitted</div>
            </div>
            <div className="bg-blue-500/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.averageScore}</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="bg-amber-500/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.highestScore}</div>
              <div className="text-sm text-muted-foreground">Highest Score</div>
            </div>
            <div className="bg-violet-500/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-violet-600">{stats.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Student Performance Details</h2>
          {performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Percentage</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Submitted At</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((student, index) => (
                    <tr key={student.id} className="border-b border-border/10 hover:bg-muted/20">
                      <td className="py-3 px-4 text-sm font-medium">{student.student_name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{student.student_email}</td>
                      <td className="py-3 px-4 text-sm text-center font-medium">{student.score}</td>
                      <td className="py-3 px-4 text-sm text-center">
                        <span className={`font-medium ${
                          student.percentage >= 80 ? 'text-emerald-600' : 
                          student.percentage >= 60 ? 'text-blue-600' : 
                          student.percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {student.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-600' :
                          student.status === 'auto_submitted' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-gray-500/10 text-gray-600'
                        }`}>
                          {student.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {student.submitted_at ? format(new Date(student.submitted_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        {student.warning_count > 0 ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.warning_count >= 2 ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {student.warning_count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium mb-2">No Student Data Available</div>
              <div className="text-sm">No students have attempted this exam yet.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">📝 Exams & Quizzes</h1>
            <p className="text-sm text-muted-foreground">{isStudent ? "Attempt exams and view your scores" : "Create and manage exams"}</p>
          </div>
          {(isTeacher || isAdmin) && (
            <button onClick={() => setView("create")} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Create Exam
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : exams.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No exams yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam, i) => {
              const sub = submissions.find(s => s.exam_id === exam.id);
              const attempted = !!sub;
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-card border border-border/20 rounded-2xl p-5 hover:shadow-lg transition-all ${(isTeacher || isAdmin) || (isStudent && attempted) ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (isTeacher || isAdmin) {
                      handleViewExamQuestions(exam.id);
                    } else if (isStudent && attempted) {
                      handleViewExamResults(exam.id, sub);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{exam.title}</h3>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${getExamStatus(exam, sub).color}`}>
                      {getExamStatus(exam, sub).text}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
                    <span>📚 {exam.exam_type}</span>
                    <span>⏱ {exam.duration_minutes} min</span>
                    <span>📊 5 marks</span>
                    <span>❓ {exam.question_count} Qs</span>
                  </div>

                  {/* Deadline and Time Remaining */}
                  {exam.due_date ? (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {format(new Date(exam.due_date), "PPp")}</span>
                      </div>
                      {(() => {
                        const now = new Date();
                        const due = new Date(exam.due_date);
                        const diff = due.getTime() - now.getTime();
                        
                        if (diff <= 0) {
                          return (
                            <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
                              <Clock className="w-3 h-3" />
                              <span>Practice Mode Available</span>
                            </div>
                          );
                        }
                        
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        
                        let timeText = "";
                        if (days > 0) {
                          timeText = `${days}d ${hours}h ${minutes}m remaining`;
                        } else if (hours > 0) {
                          timeText = `${hours}h ${minutes}m remaining`;
                        } else {
                          timeText = `${minutes}m remaining`;
                        }
                        
                        const isUrgent = days === 0 && hours < 2;
                        return (
                          <div className={`flex items-center gap-1.5 text-xs font-medium ${isUrgent ? "text-warning" : "text-primary"}`}>
                            <Clock className="w-3 h-3" />
                            <span>{timeText}</span>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>No deadline set</span>
                      </div>
                    </div>
                  )}

                  {isStudent && exam.status === "published" && (
                    attempted ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-600 font-medium">Score: {sub?.score} ({sub?.percentage}%)</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Eye className="w-3 h-3" />
                          <span>Click to view detailed results</span>
                        </div>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); startExam(exam); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                        <Play className="w-4 h-4" /> Start Exam
                      </button>
                    )
                  )}

                  {(isTeacher || isAdmin) && (
                    <div className="mb-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-foreground">Student Performance</div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleViewStudentReports(exam); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View Reports
                        </button>
                      </div>
                      {studentPerformance[exam.id] && studentPerformance[exam.id].length > 0 ? (
                        <div className="space-y-2">
                          {examStatistics[exam.id] && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-primary" />
                                <span>{examStatistics[exam.id].submittedStudents}/{examStatistics[exam.id].totalStudents} submitted</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-emerald-500" />
                                <span>Avg: {examStatistics[exam.id].averageScore}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>High: {examStatistics[exam.id].highestScore}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>{examStatistics[exam.id].completionRate}% completion</span>
                              </div>
                            </div>
                          )}
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {studentPerformance[exam.id].slice(0, 3).map((student, idx) => (
                              <div key={student.id} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground truncate max-w-[120px]">{student.student_name}</span>
                                <span className={`font-medium ${
                                  student.percentage >= 80 ? 'text-emerald-600' : 
                                  student.percentage >= 60 ? 'text-blue-600' : 
                                  student.percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {student.score} ({student.percentage}%)
                                </span>
                              </div>
                            ))}
                            {studentPerformance[exam.id].length > 3 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{studentPerformance[exam.id].length - 3} more students
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {exam.status === "draft" ? "Publish exam to see student reports" : "No students have attempted this exam yet"}
                        </div>
                      )}
                    </div>
                  )}

                  {(isTeacher || isAdmin) && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setSelectedExam(exam); setQuestionMode("manual"); setAiDrafts([]); setAiTopic(""); fetchQuestions(exam.id); setView("questions"); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs hover:text-foreground">
                        <Eye className="w-3.5 h-3.5" /> Questions
                      </button>
                      {exam.status === "draft" && (
                        <button onClick={() => handlePublish(exam.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs hover:bg-emerald-500/20 font-medium">
                          Publish
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteExam(exam.id, exam.title)} 
                        disabled={deletingExamId === exam.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs hover:bg-red-500/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingExamId === exam.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, examId: null, examTitle: null })}
        onConfirm={confirmDeleteExam}
        title="Delete Exam"
        message={`Are you sure you want to delete "${confirmDialog.examTitle}"? This will permanently remove the exam and all associated questions and submissions. This action cannot be undone.`}
        confirmText="Delete Exam"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}
