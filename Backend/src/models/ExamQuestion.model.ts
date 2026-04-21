import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExamQuestion extends Document {
  exam_id: Types.ObjectId;
  question: string;
  options: string[];
  correct_answer: string;
  marks: number;
  sort_order: number;
}

const ExamQuestionSchema = new Schema<IExamQuestion>(
  {
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correct_answer: { type: String, required: true },
    marks: { type: Number, default: 1 },
    sort_order: { type: Number, default: 0 },
  },
  { collection: 'exam_questions' }
);

export const ExamQuestion = mongoose.model<IExamQuestion>('ExamQuestion', ExamQuestionSchema);
