import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  name: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  is_active: boolean;
  created_at: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    start_date: { type: Date },
    end_date: { type: Date },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'batches' }
);

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
