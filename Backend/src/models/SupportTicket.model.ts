import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  id?: string;
  student_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  response?: string | null;
  responded_by?: string | null;
  responded_at?: Date | null;
  created_at: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    id: { type: String },
    student_id: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'general' },
    priority: { type: String, default: 'medium' },
    status: { type: String, default: 'open' },
    response: { type: String, default: null },
    responded_by: { type: String, default: null },
    responded_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'support_tickets' }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

