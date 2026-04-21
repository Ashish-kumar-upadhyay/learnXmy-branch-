import { FeePayment } from '../models/FeePayment.model';
import { SalaryConfig } from '../models/SalaryConfig.model';
import { Types } from 'mongoose';

function randomReceipt() {
  return `RCPT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function recordFeePayment(data: {
  student_id: string;
  fee_structure_id: string;
  amount_paid: number;
  payment_method?: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  status?: 'paid' | 'pending' | 'overdue';
}) {
  return FeePayment.create({
    student_id: new Types.ObjectId(data.student_id),
    fee_structure_id: new Types.ObjectId(data.fee_structure_id),
    amount_paid: data.amount_paid,
    payment_method: data.payment_method ?? 'cash',
    receipt_no: randomReceipt(),
    status: data.status ?? 'paid',
  });
}

export type ReceiptRow = {
  receipt_no: string | undefined;
  amount_paid: number;
  paid_at: Date;
  student_id: Types.ObjectId;
  fee_structure_id: Types.ObjectId;
};

export async function listReceipts(): Promise<ReceiptRow[]> {
  return FeePayment.find({ status: 'paid' })
    .select('receipt_no amount_paid paid_at student_id fee_structure_id')
    .lean() as Promise<ReceiptRow[]>;
}

export function calculateSalary(config: {
  monthly_salary?: number;
  daily_rate?: number;
  base_salary?: number;
  bonuses?: number;
  deductions?: number;
  salary_type: 'per_day' | 'monthly';
  daysWorked?: number;
}) {
  const base =
    config.salary_type === 'monthly'
      ? config.monthly_salary ?? config.base_salary ?? 0
      : (config.daily_rate ?? 0) * (config.daysWorked ?? 0);
  const gross = base + (config.bonuses ?? 0) - (config.deductions ?? 0);
  return { base, bonuses: config.bonuses ?? 0, deductions: config.deductions ?? 0, gross };
}

export async function getSalaryConfigForTeacher(teacherId: string) {
  return SalaryConfig.findOne({ teacher_id: teacherId, is_active: true }).lean();
}

/** Placeholder: integrate Stripe/Razorpay webhooks here */
export async function processSalaryPayments(_payload: { teacher_ids: string[]; month: string }) {
  return { ok: true, processed: 0, note: 'Wire to payment provider in production' };
}
