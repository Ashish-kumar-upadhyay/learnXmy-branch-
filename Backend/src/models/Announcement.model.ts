import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  teacher_id: Types.ObjectId;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  batch?: string;
  created_at: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
    batch: { type: String, index: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'announcements' }
);

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
