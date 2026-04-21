import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user_id: string;
  title: string;
  message: string;
  // Frontend uses arbitrary notification types like `lecture`, `approval`, `attendance_reminder`, etc.
  type: string;
  target_path?: string | null;
  is_read: boolean;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    target_path: { type: String, default: null },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'notifications' }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
