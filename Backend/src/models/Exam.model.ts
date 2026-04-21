import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExam extends Document {
  title: string;
  exam_type: 'quiz' | 'midterm' | 'final' | 'practice';
  teacher_id: Types.ObjectId;
  class_id?: Types.ObjectId;
  batch?: string;
  duration_minutes?: number;
  total_marks?: number;
  status: 'draft' | 'published';
  scheduled_at?: Date;
  exam_date?: Date;
  start_time?: string;
  end_time?: string;
  created_at: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    title: { type: String, required: true },
    exam_type: {
      type: String,
      enum: ['quiz', 'midterm', 'final', 'practice'],
      default: 'quiz',
    },
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    class_id: { type: Schema.Types.ObjectId, ref: 'Class' },
    batch: { type: String, index: true },
    duration_minutes: { type: Number },
    total_marks: { type: Number },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    scheduled_at: { type: Date },
    exam_date: { type: Date },
    start_time: { type: String },
    end_time: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'exams' }
);

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
