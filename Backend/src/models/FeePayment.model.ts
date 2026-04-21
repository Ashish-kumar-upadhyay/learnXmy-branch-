import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFeePayment extends Document {
  student_id: Types.ObjectId;
  fee_structure_id: Types.ObjectId;
  amount_paid: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  receipt_no?: string;
  paid_at: Date;
  status: 'paid' | 'pending' | 'overdue';
}

const FeePaymentSchema = new Schema<IFeePayment>(
  {
    student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fee_structure_id: { type: Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
    amount_paid: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
      default: 'cash',
    },
    receipt_no: { type: String, unique: true, sparse: true },
    paid_at: { type: Date, default: Date.now },
    status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'paid' },
  },
  { collection: 'fee_payments' }
);

export const FeePayment = mongoose.model<IFeePayment>('FeePayment', FeePaymentSchema);
