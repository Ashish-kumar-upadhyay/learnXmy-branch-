import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trash2, Edit, Plus, Eye, Clock, Award, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { api, getAccessToken } from "@/lib/backendApi";

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

export default function ExamQuestions() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuth();
  const isTeacher = roles.includes("teacher");
  const isAdmin = roles.includes("admin");

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (examId) {
      void fetchExamDetails();
      void fetchQuestions();
    }
  }, [examId]);

  const fetchExamDetails = async () => {
    if (!examId) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      const res = await api<Exam>(`/api/exams/${examId}`, { method: "GET", accessToken });
      if (res.status === 200 && res.data) {
        setExam(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch exam details");
    }
  };

  const fetchQuestions = async () => {
    if (!examId) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      const res = await api<Question[]>(`/api/exams/${examId}/questions`, { method: "GET", accessToken });
      if (res.status === 200 && res.data) {
        setQuestions(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!examId) return;
    const accessToken = getAccessToken();
    if (!accessToken) return;

    setDeleteLoading(questionId);
    try {
      const res = await api(`/api/exams/${examId}/questions/${questionId}`, { 
        method: "DELETE", 
        accessToken 
      });
      
      if (res.status === 200) {
        toast.success("Question deleted successfully");
        void fetchQuestions();
        void fetchExamDetails(); // Refresh exam to update question count
      } else {
        toast.error("Failed to delete question");
      }
    } catch (error) {
      toast.error("Failed to delete question");
    } finally {
      setDeleteLoading(null);
    }
  };

  const goToAddQuestions = () => {
    navigate(`/exams`, { state: { view: "questions", examId } });
  };

  const goBackToExams = () => {
    // Check if we came from the exams page with specific state
    if (location.state?.from === 'exams') {
      navigate(-1);
    } else {
      navigate('/exams');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Exam not found</p>
        <button
            onClick={goBackToExams}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Back to Exams
          </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBackToExams}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">Manage exam questions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(isTeacher || isAdmin) && (
            <button
              onClick={goToAddQuestions}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Add Questions
            </button>
          )}
        </div>
      </div>

      {/* Exam Info Card */}
      <div className="bg-card border border-border/20 rounded-2xl p-5">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {exam.exam_type}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{exam.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Award className="w-4 h-4" />
            <span>{exam.total_marks || 5} marks</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{questions.length} questions</span>
          </div>
          {exam.batch && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>🏷 Batch {exam.batch}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
              exam.status === "published" 
                ? "bg-emerald-500/10 text-emerald-600" 
                : "bg-amber-500/10 text-amber-600"
            }`}>
              {exam.status}
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border/20 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No questions yet</h3>
          <p className="text-muted-foreground mb-6">This exam doesn't have any questions yet.</p>
          {(isTeacher || isAdmin) && (
            <button
              onClick={goToAddQuestions}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add First Question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border/20 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-primary">Q{index + 1}</span>
                    <span className="text-xs text-muted-foreground">({question.marks} marks)</span>
                  </div>
                  
                  <p className="text-foreground font-medium mb-3">{question.question}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          option === question.correct_answer
                            ? "bg-emerald-500/10 text-emerald-600 font-medium"
                            : "bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                        <span>{option}</span>
                        {option === question.correct_answer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {(isTeacher || isAdmin) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      disabled={deleteLoading === question.id}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete question"
                    >
                      {deleteLoading === question.id ? (
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      {questions.length > 0 && (
        <div className="bg-muted/20 rounded-xl border border-border/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? 's' : ''} • Total marks: {questions.reduce((sum, q) => sum + q.marks, 0)}
          </p>
          {exam.status === "draft" && questions.length < 5 && (
            <p className="text-xs text-amber-600 mt-1">
              Add {5 - questions.length} more question{5 - questions.length !== 1 ? 's' : ''} to enable publishing
            </p>
          )}
          {exam.status === "draft" && questions.length === 5 && (
            <p className="text-xs text-emerald-600 mt-1">
              Ready to publish! Go to exams page to publish this exam.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
