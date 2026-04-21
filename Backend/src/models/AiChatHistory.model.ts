import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IAiChatHistory extends Document {
  user_id: Types.ObjectId;
  session_id: string;
  messages: IAiChatMessage[];
  created_at: Date;
  updated_at: Date;
}

const AiChatHistorySchema = new Schema<IAiChatHistory>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    session_id: { type: String, required: true, index: true },
    messages: {
      type: [
        {
          role: { type: String, enum: ['user', 'assistant'], required: true },
          content: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: 'ai_chat_history' }
);

export const AiChatHistory = mongoose.model<IAiChatHistory>('AiChatHistory', AiChatHistorySchema);
