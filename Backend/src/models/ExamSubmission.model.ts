import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExamSubmission extends Document {
  exam_id: Types.ObjectId;
  student_id: Types.ObjectId;
  answers: Record<string, string>;
  score: number;
  percentage?: number;
  started_at?: Date;
  submitted_at?: Date;
  expires_at?: Date;
  warning_count: number;
  auto_submit_reason?: 'time_up' | 'tab_switch' | 'reload' | null;
  result_breakdown?: Array<{
    question_id: string;
    question: string;
    selected_answer: string | null;
    correct_answer: string;
    is_correct: boolean;
  }>;
  status: 'in_progress' | 'submitted' | 'auto_submitted';
}

const ExamSubmissionSchema = new Schema<IExamSubmission>(
  {
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, default: 0 },
    percentage: { type: Number },
    started_at: { type: Date },
    submitted_at: { type: Date },
    expires_at: { type: Date },
    warning_count: { type: Number, default: 0 },
    auto_submit_reason: { type: String, enum: ['time_up', 'tab_switch', 'reload', null], default: null },
    result_breakdown: {
      type: [
        {
          question_id: { type: String, required: true },
          question: { type: String, required: true },
          selected_answer: { type: String, default: null },
          correct_answer: { type: String, required: true },
          is_correct: { type: Boolean, required: true },
        },
      ],
      default: [],
    },
    status: { type: String, enum: ['in_progress', 'submitted', 'auto_submitted'], default: 'in_progress' },
  },
  { collection: 'exam_submissions' }
);

ExamSubmissionSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

export const ExamSubmission = mongoose.model<IExamSubmission>('ExamSubmission', ExamSubmissionSchema);
