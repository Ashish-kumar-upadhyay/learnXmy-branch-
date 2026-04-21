import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeaveRequest extends Document {
  user_id: Types.ObjectId;
  user_type: 'student' | 'teacher';
  start_date?: Date;
  end_date?: Date;
  leave_date?: Date;
  type: 'full_day' | 'half_day';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: Types.ObjectId;
  reviewer_note?: string;
  created_at: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    user_type: { type: String, enum: ['student', 'teacher'], required: true },
    start_date: { type: Date },
    end_date: { type: Date },
    leave_date: { type: Date },
    type: { type: String, enum: ['full_day', 'half_day'], default: 'full_day' },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewer_note: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'leave_requests' }
);

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
