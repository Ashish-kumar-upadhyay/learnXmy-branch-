import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { FeeStructure } from '../models/FeeStructure.model';
import { FeePayment } from '../models/FeePayment.model';
import * as paymentService from '../services/payment.service';
import { ok, created, fail } from '../utils/response';

export async function listFeeStructure(_req: AuthRequest, res: Response) {
  const items = await FeeStructure.find().sort({ created_at: -1 }).lean();
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
  const items = await FeePayment.find({ student_id: req.params.id }).sort({ paid_at: -1 }).lean();
  return ok(res, items);
}

export async function receipts(_req: AuthRequest, res: Response) {
  const items = await paymentService.listReceipts();
  return ok(res, items);
}
