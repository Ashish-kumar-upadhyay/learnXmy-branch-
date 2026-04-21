import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExamSubmission extends Document {
  exam_id: Types.ObjectId;
  student_id: Types.ObjectId;
  answers: Record<string, string>;
  score: number;
  percentage?: number;
  submitted_at: Date;
  status: 'submitted' | 'auto_submitted';
}

const ExamSubmissionSchema = new Schema<IExamSubmission>(
  {
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, default: 0 },
    percentage: { type: Number },
    submitted_at: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'auto_submitted'], default: 'submitted' },
  },
  { collection: 'exam_submissions' }
);

ExamSubmissionSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

export const ExamSubmission = mongoose.model<IExamSubmission>('ExamSubmission', ExamSubmissionSchema);
