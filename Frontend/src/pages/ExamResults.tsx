import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Award, Eye } from "lucide-react";
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

export default function ExamResults() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const submission = location.state?.submission as Submission;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

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

  const goBackToExams = () => {
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

  if (!exam || !submission) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Exam results not found</p>
        <button
            onClick={goBackToExams}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Back to Exams
          </button>
      </div>
    );
  }

  const correctAnswers = submission.result_breakdown?.filter(item => item.is_correct).length || 0;
  const wrongAnswers = questions.length - correctAnswers;

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
            <p className="text-sm text-muted-foreground">Exam Results</p>
          </div>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-card border border-border/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Score</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{exam.duration_minutes} min</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="text-3xl font-bold text-primary">{submission.score}</div>
          <div className="text-sm text-muted-foreground">out of {exam.total_marks || questions.length * questions[0]?.marks || 5}</div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
            {submission.percentage}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-emerald-500/5 rounded-xl p-3">
            <div className="text-lg font-semibold text-emerald-600">{correctAnswers}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          <div className="bg-destructive/5 rounded-xl p-3">
            <div className="text-lg font-semibold text-destructive">{wrongAnswers}</div>
            <div className="text-xs text-muted-foreground">Wrong</div>
          </div>
          <div className="bg-amber-500/5 rounded-xl p-3">
            <div className="text-lg font-semibold text-amber-600">{questions.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>

      {/* Questions and Answers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Question Review</h2>
        {questions.map((question, index) => {
          const result = submission.result_breakdown?.find(item => item.question_id === question.id);
          const isCorrect = result?.is_correct || false;
          const selectedAnswer = result?.selected_answer;

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border/20 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-primary">Q{index + 1}</span>
                    <span className="text-xs text-muted-foreground">({question.marks} marks)</span>
                    {isCorrect ? (
                      <span className="text-xs text-emerald-600 font-medium">Correct</span>
                    ) : (
                      <span className="text-xs text-destructive font-medium">Wrong</span>
                    )}
                  </div>
                  
                  <p className="text-foreground font-medium mb-3">{question.question}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const optionLetter = String.fromCharCode(65 + optionIndex);
                      const isCorrectAnswer = option === question.correct_answer;
                      const isSelectedAnswer = option === selectedAnswer;
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            isCorrectAnswer && isSelectedAnswer
                              ? "bg-emerald-500/10 text-emerald-600 font-medium border border-emerald-500/20"
                              : isCorrectAnswer
                              ? "bg-emerald-500/10 text-emerald-600 font-medium"
                              : isSelectedAnswer
                              ? "bg-destructive/10 text-destructive font-medium border border-destructive/20"
                              : "bg-muted/20 text-muted-foreground"
                          }`}
                        >
                          <span className="font-medium">{optionLetter}.</span>
                          <span>{option}</span>
                          {isCorrectAnswer && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />
                          )}
                          {isSelectedAnswer && !isCorrectAnswer && (
                            <XCircle className="w-4 h-4 text-destructive ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Info */}
      {submission.auto_submit_reason && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Exam was auto-submitted</span>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Reason: {submission.auto_submit_reason === 'time_up' ? 'Time expired' : 
                    submission.auto_submit_reason === 'tab_switch' ? 'Tab switch detected' : 
                    'Page reload detected'}
          </p>
        </div>
      )}
    </div>
  );
}
