import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceWindow extends Document {
  batch: string;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  effective_from: Date; // start-of-day, local server time
  created_by?: string | null;
  created_at: Date;
}

const AttendanceWindowSchema = new Schema<IAttendanceWindow>(
  {
    batch: { type: String, required: true, index: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    effective_from: { type: Date, required: true, index: true },
    created_by: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'attendance_windows' }
);

AttendanceWindowSchema.index({ batch: 1, effective_from: -1 });

export const AttendanceWindow = mongoose.model<IAttendanceWindow>(
  'AttendanceWindow',
  AttendanceWindowSchema
);

