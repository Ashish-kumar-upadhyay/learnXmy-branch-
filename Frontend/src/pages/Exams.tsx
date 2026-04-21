import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Award, CheckCircle2, Play, Eye, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { api, getAccessToken } from "@/lib/backendApi";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  batch: string | null;
  teacher_id: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  teacher_name?: string;
  question_count?: number;
}

interface Question {
  id: string;
  exam_id: string;
  question: string;
  options: string[];
  correct_answer: string;
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
}

type View = "list" | "create" | "questions" | "attempt" | "results";

export default function Exams() {
  const { user, roles, profile } = useAuth();
  const isStudent = !roles.includes("admin") && !roles.includes("teacher");
  const isTeacher = roles.includes("teacher");
  const isAdmin = roles.includes("admin");

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

  // Create exam form
  const [examForm, setExamForm] = useState({ title: "", description: "", batch: "", exam_type: "quiz", duration_minutes: 30, total_marks: 100, scheduled_at: "" });

  // Question form
  const [qForm, setQForm] = useState({ question_text: "", options: ["", "", "", ""], correct_answer: "", marks: 1 });

  // Attempt state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => { void fetchExams(); }, [user, roles, profile]);

  const fetchExams = async () => {
    setLoading(true);
    const accessToken = getAccessToken();
    if (!accessToken) { setExams([]); setSubmissions([]); setLoading(false); return; }

    const batch = normalizeBatch(profile?.class_name || profile?.batch || "");
    // Students: published exams for their class. Teachers: own exams only. Admins: all exams.
    const examsPath = isStudent
      ? `/api/exams?status=published${batch ? `&batch=${encodeURIComponent(batch)}` : ""}`
      : isAdmin
        ? `/api/exams`
        : `/api/exams?teacher_id=${encodeURIComponent(user?.id || "")}`;

    const [examsRes, subsRes] = await Promise.all([
      api<Exam[]>(examsPath, { method: "GET", accessToken }),
      isStudent ? api<Submission[]>("/api/exams/my-submissions", { method: "GET", accessToken }) : Promise.resolve({ status: 200, data: [] as Submission[] }),
    ]);

    setExams(examsRes.status === 200 && examsRes.data ? examsRes.data : []);
    setSubmissions(subsRes.status === 200 && subsRes.data ? subsRes.data : []);
    setLoading(false);
  };

  const handleCreateExam = async () => {
    if (!examForm.title) { toast.error("Title required"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api<Exam>("/api/exams", {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        title: examForm.title,
        description: examForm.description || null,
        batch: normalizeBatch(examForm.batch || profile?.class_name || profile?.batch || "") || null,
        teacher_id: user!.id,
        exam_type: examForm.exam_type,
        duration_minutes: examForm.duration_minutes,
        total_marks: examForm.total_marks,
        scheduled_at: examForm.scheduled_at || null,
        status: "draft",
      }),
    });
    if (res.status !== 201 || !res.data) { toast.error("Failed to create exam"); return; }
    toast.success("Exam created! Now add questions.");
    setSelectedExam(res.data as Exam);
    setView("questions");
    void fetchExams();
  };

  const handleAddQuestion = async () => {
    if (!qForm.question_text || !qForm.correct_answer) { toast.error("Fill question and correct answer"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/exams/${selectedExam!.id}/questions`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        question: qForm.question_text,
        options: qForm.options.filter(o => o.trim()),
        correct_answer: qForm.correct_answer,
        marks: qForm.marks,
        sort_order: questions.length,
      }),
    });
    if (res.status !== 201 && res.status !== 200) { toast.error("Failed to add question"); return; }
    toast.success("Question added!");
    setQForm({ question_text: "", options: ["", "", "", ""], correct_answer: "", marks: 1 });
    void fetchQuestions(selectedExam!.id);
  };

  const fetchQuestions = async (examId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const res = await api<Question[]>(`/api/exams/${examId}/questions`, { method: "GET", accessToken });
    setQuestions((res.status === 200 && res.data ? res.data : []) as Question[]);
  };

  const handlePublish = async (examId: string) => {
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
  };

  const startExam = async (exam: Exam) => {
    // Check if already attempted
    const existing = submissions.find(s => s.exam_id === exam.id);
    if (existing) {
      toast.error("You have already attempted this exam. Only one attempt is allowed.");
      return;
    }
    setSelectedExam(exam);
    await fetchQuestions(exam.id);
    setAnswers({});
    setTimeLeft(exam.duration_minutes * 60);
    setView("attempt");
  };

  // Timer
  useEffect(() => {
    if (view !== "attempt" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { submitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  const submitExam = async () => {
    if (!selectedExam || !user) return;
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api<any>(`/api/exams/${selectedExam.id}/submit`, {
      method: "POST",
      accessToken,
      body: JSON.stringify({ answers }),
    });
    if (res.status !== 200) { toast.error("Failed to submit"); return; }
    toast.success(`Submitted! Score: ${res.data?.score ?? 0} (${res.data?.percentage ?? 0}%)`);
    setView("list");
    void fetchExams();
  };

  const deleteQuestion = async (id: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) { toast.error("Login required"); return; }
    const res = await api(`/api/exams/${selectedExam!.id}/questions/${id}`, { method: "DELETE", accessToken });
    if (res.status !== 200) toast.error("Delete failed");
    void fetchQuestions(selectedExam!.id);
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ===== ATTEMPT VIEW =====
  if (view === "attempt" && selectedExam) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-xl py-3 -mx-2 px-2 rounded-xl">
          <h2 className="text-lg font-bold text-foreground">{selectedExam.title}</h2>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${timeLeft < 60 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"}`}>
            <Clock className="w-4 h-4" /> {formatTimer(timeLeft)}
          </div>
        </div>
        {questions.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border/20 rounded-2xl p-5">
            <p className="font-semibold text-foreground mb-3"><span className="text-primary">Q{i + 1}.</span> {q.question} <span className="text-xs text-muted-foreground">({q.marks} marks)</span></p>
            <div className="space-y-2">
              {(q.options as string[]).map((opt, j) => (
                <button
                  key={j}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${answers[q.id] === opt ? "bg-primary/10 border-primary text-primary font-medium" : "border-border/20 text-muted-foreground hover:bg-muted/20"}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span> {opt}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
        <div className="flex gap-3 pb-8">
          <button onClick={submitExam} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition">Submit Exam</button>
          <button onClick={() => setView("list")} className="px-6 py-3 rounded-xl bg-muted/30 text-muted-foreground hover:text-foreground transition">Cancel</button>
        </div>
      </div>
    );
  }

  // ===== QUESTIONS VIEW (Teacher) =====
  if (view === "questions" && selectedExam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedExam.title} - Questions</h2>
            <p className="text-sm text-muted-foreground">{questions.length} questions added</p>
          </div>
          <div className="flex gap-2">
            {selectedExam.status === "draft" && questions.length > 0 && (
              <button onClick={() => handlePublish(selectedExam.id)} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:opacity-90">Publish</button>
            )}
            <button onClick={() => { setView("list"); setSelectedExam(null); }} className="px-4 py-2 rounded-xl bg-muted/30 text-muted-foreground text-sm hover:text-foreground">Back</button>
          </div>
        </div>

        {/* Add question form */}
        <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Add Question</h3>
          <textarea value={qForm.question_text} onChange={e => setQForm({ ...qForm, question_text: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground min-h-[60px]" placeholder="Enter question..." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {qForm.options.map((opt, i) => (
              <input key={i} value={opt} onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm({ ...qForm, options: o }); }} className="px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Correct Answer *</label>
              <select value={qForm.correct_answer} onChange={e => setQForm({ ...qForm, correct_answer: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground">
                <option value="">Select correct option</option>
                {qForm.options.filter(o => o.trim()).map((opt, i) => <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Marks</label>
              <input type="number" value={qForm.marks} onChange={e => setQForm({ ...qForm, marks: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
            </div>
          </div>
          <button onClick={handleAddQuestion} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Add Question</button>
        </div>

        {/* Questions list */}
        {questions.map((q, i) => (
          <div key={q.id} className="bg-card/50 border border-border/10 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground"><span className="text-primary">Q{i + 1}.</span> {q.question_text}</p>
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
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea value={examForm.description} onChange={e => setExamForm({ ...examForm, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground min-h-[60px]" placeholder="Brief description..." />
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
              <label className="text-xs text-muted-foreground mb-1 block">Batch</label>
              <input value={examForm.batch} onChange={e => setExamForm({ ...examForm, batch: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" placeholder="A" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration (minutes)</label>
              <input type="number" value={examForm.duration_minutes} onChange={e => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) || 30 })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Total Marks</label>
              <input type="number" value={examForm.total_marks} onChange={e => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) || 100 })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Scheduled At</label>
            <input type="datetime-local" value={examForm.scheduled_at} onChange={e => setExamForm({ ...examForm, scheduled_at: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border/20 bg-background text-sm text-foreground" />
          </div>
          <button onClick={handleCreateExam} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90">Create & Add Questions</button>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
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
                className="bg-card border border-border/20 rounded-2xl p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{exam.title}</h3>
                    {exam.description && <p className="text-xs text-muted-foreground mt-0.5">{exam.description}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${exam.status === "published" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                    {exam.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
                  <span>📚 {exam.exam_type}</span>
                  <span>⏱ {exam.duration_minutes} min</span>
                  <span>📊 {exam.total_marks} marks</span>
                  <span>❓ {exam.question_count} Qs</span>
                  {exam.batch && <span>🏷 Batch {exam.batch}</span>}
                  {exam.teacher_name && <span>👨‍🏫 {exam.teacher_name}</span>}
                </div>

                {isStudent && exam.status === "published" && (
                  attempted ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 font-medium">Score: {sub?.score} ({sub?.percentage}%)</span>
                    </div>
                  ) : (
                    <button onClick={() => startExam(exam)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                      <Play className="w-4 h-4" /> Start Exam
                    </button>
                  )
                )}

                {(isTeacher || isAdmin) && (
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedExam(exam); fetchQuestions(exam.id); setView("questions"); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs hover:text-foreground">
                      <Eye className="w-3.5 h-3.5" /> Questions
                    </button>
                    {exam.status === "draft" && (
                      <button onClick={() => handlePublish(exam.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs hover:bg-emerald-500/20 font-medium">
                        Publish
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
