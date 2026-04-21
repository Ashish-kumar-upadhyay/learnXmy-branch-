import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITimetable extends Document {
  class_id?: Types.ObjectId;
  batch?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  teacher_id?: Types.ObjectId;
  room?: string;
  is_active: boolean;
  created_at: Date;
}

const TimetableSchema = new Schema<ITimetable>(
  {
    class_id: { type: Schema.Types.ObjectId, ref: 'Class' },
    batch: { type: String, index: true },
    day_of_week: { type: Number, required: true, min: 0, max: 6, index: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    subject: { type: String, required: true },
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User' },
    room: { type: String },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'timetable' }
);

export const Timetable = mongoose.model<ITimetable>('Timetable', TimetableSchema);
