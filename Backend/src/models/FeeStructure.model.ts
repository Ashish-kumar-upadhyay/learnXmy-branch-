import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeStructure extends Document {
  name?: string;
  batch?: string;
  fee_type: 'tuition' | 'exam' | 'library' | 'sports' | 'transport' | 'other';
  amount: number;
  due_date?: Date;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    name: { type: String },
    batch: { type: String, index: true },
    fee_type: {
      type: String,
      enum: ['tuition', 'exam', 'library', 'sports', 'transport', 'other'],
      default: 'tuition',
    },
    amount: { type: Number, required: true },
    due_date: { type: Date },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'fee_structure' }
);

export const FeeStructure = mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);
