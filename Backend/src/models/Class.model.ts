import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClass extends Document {
  id?: string;
  name?: string;
  title: string;
  description?: string;
  teacher_id: Types.ObjectId;
  batch?: string;
  schedule?: Date;
  duration?: number;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    id: { type: String, default: () => new Types.ObjectId().toString(), index: true },
    // Legacy compatibility: old DB has unique index on `name`.
    name: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    batch: { type: String, index: true },
    schedule: { type: Date },
    duration: { type: Number },
    location: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'classes' }
);

export const Class = mongoose.model<IClass>('Class', ClassSchema);
