import mongoose, { Schema, Document } from 'mongoose';

export interface ISprintPlan extends Document {
  id?: string;
  title: string;
  description?: string | null;
  week_start: Date;
  week_end: Date;
  batch?: string | null;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
}

const SprintPlanSchema = new Schema<ISprintPlan>(
  {
    id: { type: String },
    title: { type: String, required: true },
    description: { type: String, default: null },
    week_start: { type: Date, required: true },
    week_end: { type: Date, required: true },
    batch: { type: String, default: null },
    created_by: { type: String, required: true, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: 'sprint_plans' }
);

SprintPlanSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export const SprintPlan = mongoose.model<ISprintPlan>('SprintPlan', SprintPlanSchema);

