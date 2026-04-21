import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiTutorFeedback extends Document {
  user_id: Types.ObjectId;
  chat_id: Types.ObjectId;
  rating: number;
  feedback?: string;
  created_at: Date;
}

const AiTutorFeedbackSchema = new Schema<IAiTutorFeedback>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chat_id: { type: Schema.Types.ObjectId, ref: 'AiChatHistory', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'ai_tutor_feedback' }
);

export const AiTutorFeedback = mongoose.model<IAiTutorFeedback>(
  'AiTutorFeedback',
  AiTutorFeedbackSchema
);
