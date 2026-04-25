import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { FeeStructure } from '../models/FeeStructure.model';
import { FeePayment } from '../models/FeePayment.model';
import { User } from '../models/User.model';
import { env } from '../config/environment';
import * as paymentService from '../services/payment.service';
import { ok, created, fail } from '../utils/response';

function batchVariants(batchRaw: string | null | undefined): string[] {
  const b = String(batchRaw || '').trim();
  if (!b) return [];
  const stripped = b.replace(/^batch\s+/i, '').trim();
  const withPrefix = stripped ? `Batch ${stripped}` : '';
  return Array.from(new Set([b, stripped, withPrefix].filter(Boolean)));
}

export async function listFeeStructure(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const isStudent = req.authUser.roles.includes('student') && !req.authUser.roles.includes('admin') && !req.authUser.roles.includes('teacher');
  let q: Record<string, unknown> = {};
  if (isStudent) {
    const me = await User.findById(req.authUser.id).select('assignedClass').lean();
    const options = batchVariants((me as any)?.assignedClass ?? null);
    q = options.length ? { batch: { $in: options }, is_active: true } : { _id: null };
  }
  const items = await FeeStructure.find(q).sort({ created_at: -1 }).lean();
  return ok(res, items);
}

export async function createFeeStructure(req: AuthRequest, res: Response) {
  const doc = await FeeStructure.create(req.body);
  return created(res, doc);
}

export async function updateFeeStructure(req: AuthRequest, res: Response) {
  const doc = await FeeStructure.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean();
  if (!doc) return fail(res, 404, 'Not found');
  return ok(res, doc);
}

export async function deleteFeeStructure(req: AuthRequest, res: Response) {
  await FeeStructure.findByIdAndDelete(req.params.id);
  return ok(res, null, 'Deleted');
}

export async function listPayments(_req: AuthRequest, res: Response) {
  const items = await FeePayment.find().sort({ paid_at: -1 }).lean();
  return ok(res, items);
}

export async function createPayment(req: AuthRequest, res: Response) {
  const doc = await paymentService.recordFeePayment(req.body);
  return created(res, doc);
}

export async function studentPayments(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const isStudentOnly = req.authUser.roles.includes('student') && !req.authUser.roles.includes('admin') && !req.authUser.roles.includes('teacher');
  if (isStudentOnly && req.authUser.id !== req.params.id) return fail(res, 403, 'Forbidden');
  const items = await FeePayment.find({ student_id: req.params.id }).sort({ paid_at: -1 }).lean();
  return ok(res, items);
}

export async function createRazorpayFeeOrder(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  if (!env.razorpayKeyId || !env.razorpayKeySecret) return fail(res, 400, 'Razorpay is not configured');
  const { fee_structure_id } = req.body as { fee_structure_id?: string };
  if (!fee_structure_id) return fail(res, 400, 'fee_structure_id is required');
  const fee = await FeeStructure.findById(fee_structure_id).lean();
  if (!fee) return fail(res, 404, 'Fee structure not found');
  const me = await User.findById(req.authUser.id).select('assignedClass').lean();
  const options = batchVariants((me as any)?.assignedClass ?? null);
  if (options.length && !options.includes(String((fee as any).batch ?? '').trim())) {
    return fail(res, 403, 'This fee is not assigned to your batch');
  }
  const order = await paymentService.createRazorpayOrder({
    amount: Number((fee as any).amount ?? 0),
    receipt: `fee_${String(req.authUser.id).slice(-6)}_${Date.now()}`,
    notes: {
      student_id: req.authUser.id,
      fee_structure_id: String((fee as any)._id),
    },
  });
  return ok(res, { ...order, key_id: env.razorpayKeyId, amount_rupees: Number((fee as any).amount ?? 0) });
}

export async function verifyRazorpayFeePayment(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { fee_structure_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    fee_structure_id?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  if (!fee_structure_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return fail(res, 400, 'Missing Razorpay verification fields');
  }
  const verified = paymentService.verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  if (!verified) return fail(res, 400, 'Invalid payment signature');

  const fee = await FeeStructure.findById(fee_structure_id).lean();
  if (!fee) return fail(res, 404, 'Fee structure not found');

  const doc = await paymentService.recordFeePayment({
    student_id: req.authUser.id,
    fee_structure_id,
    amount_paid: Number((fee as any).amount ?? 0),
    payment_method: 'upi',
    status: 'paid',
  });
  return created(res, { ...doc.toObject(), razorpay_order_id, razorpay_payment_id, verified: true });
}

export async function receipts(_req: AuthRequest, res: Response) {
  const items = await paymentService.listReceipts();
  return ok(res, items);
}
