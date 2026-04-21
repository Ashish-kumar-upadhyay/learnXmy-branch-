import mongoose, { Schema, Document } from 'mongoose';

export interface ISprintPlanTask extends Document {
  id?: string;
  sprint_plan_id: string;
  title: string;
  module: string;
  is_done: boolean;
  sort_order: number;
  link?: string;
}

const SprintPlanTaskSchema = new Schema<ISprintPlanTask>(
  {
    id: { type: String },
    sprint_plan_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    module: { type: String, required: true, default: 'General' },
    is_done: { type: Boolean, default: false },
    sort_order: { type: Number, required: true, index: true },
    link: { type: String },
  },
  { collection: 'sprint_plan_tasks' }
);

export const SprintPlanTask = mongoose.model<ISprintPlanTask>(
  'SprintPlanTask',
  SprintPlanTaskSchema
);

