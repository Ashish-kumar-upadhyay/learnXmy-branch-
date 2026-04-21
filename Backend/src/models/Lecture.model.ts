import mongoose, { Schema, Document } from 'mongoose';

export interface ILecture extends Document {
  id?: string;
  teacher_id: string;
  title: string;
  description?: string | null;
  youtube_url: string;
  batch?: string | null;
  status: string;
  created_at: Date;
  updated_at?: Date;
}

const LectureSchema = new Schema<ILecture>(
  {
    id: { type: String },
    teacher_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    youtube_url: { type: String, required: true },
    batch: { type: String, default: null },
    status: { type: String, default: 'published' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: 'lectures' }
);

LectureSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export const Lecture = mongoose.model<ILecture>('Lecture', LectureSchema);

