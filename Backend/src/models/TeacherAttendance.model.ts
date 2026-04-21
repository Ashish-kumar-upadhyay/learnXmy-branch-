import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeacherAttendance extends Document {
  teacher_id: Types.ObjectId;
  status: 'present' | 'absent' | 'late';
  check_in_time?: Date;
  check_out_time?: Date;
  notes?: string;
  date: Date;
}

const TeacherAttendanceSchema = new Schema<ITeacherAttendance>(
  {
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
    check_in_time: { type: Date },
    check_out_time: { type: Date },
    notes: { type: String },
    date: { type: Date, required: true, default: () => new Date(new Date().toDateString()) },
  },
  { collection: 'teacher_attendance' }
);

export const TeacherAttendance = mongoose.model<ITeacherAttendance>(
  'TeacherAttendance',
  TeacherAttendanceSchema
);
