import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISalaryConfig extends Document {
  teacher_id: Types.ObjectId;
  salary_type: 'per_day' | 'monthly';
  monthly_salary?: number;
  daily_rate?: number;
  base_salary?: number;
  bonuses?: number;
  deductions?: number;
  is_active: boolean;
  created_at: Date;
}

const SalaryConfigSchema = new Schema<ISalaryConfig>(
  {
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    salary_type: { type: String, enum: ['per_day', 'monthly'], default: 'monthly' },
    monthly_salary: { type: Number },
    daily_rate: { type: Number },
    base_salary: { type: Number },
    bonuses: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'salary_config' }
);

export const SalaryConfig = mongoose.model<ISalaryConfig>('SalaryConfig', SalaryConfigSchema);
