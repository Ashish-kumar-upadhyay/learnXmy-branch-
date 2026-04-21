import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description?: string;
  reference_link?: string;
  teacher_id: Types.ObjectId;
  class_id?: Types.ObjectId;
  batch?: string;
  start_date?: Date;
  due_date?: Date;
  max_score?: number;
  status: 'draft' | 'published';
  created_at: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    description: { type: String },
    reference_link: { type: String },
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    class_id: { type: Schema.Types.ObjectId, ref: 'Class', index: true },
    batch: { type: String, index: true },
    start_date: { type: Date },
    due_date: { type: Date },
    max_score: { type: Number },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'assignments' }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
