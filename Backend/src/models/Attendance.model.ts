import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  student_id: Types.ObjectId;
  class_id?: Types.ObjectId;
  date?: Date;
  status: 'present' | 'absent' | 'late' | 'half_day';
  selfie_url?: string;
  location?: {
    latitude: number;
    longitude: number;
    verified?: boolean;
  };
  checked_in_at: Date;
  verified: boolean;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    class_id: { type: Schema.Types.ObjectId, ref: 'Class' },
    date: { type: Date },
    status: { type: String, enum: ['present', 'absent', 'late', 'half_day'], default: 'present' },
    selfie_url: { type: String },
    location: {
      latitude: Number,
      longitude: Number,
      verified: { type: Boolean, default: false },
    },
    checked_in_at: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
  },
  { collection: 'attendance' }
);

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
