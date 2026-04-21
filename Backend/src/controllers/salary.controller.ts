import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import { SalaryConfig } from '../models/SalaryConfig.model';
import * as paymentService from '../services/payment.service';
import { ok, created, fail } from '../utils/response';

export async function listSalaryConfig(_req: AuthRequest, res: Response) {
  const items = await SalaryConfig.find().lean();
  return ok(res, items);
}

export async function createSalaryConfig(req: AuthRequest, res: Response) {
  const body = { ...req.body, teacher_id: new Types.ObjectId(req.body.teacher_id) };
  const doc = await SalaryConfig.create(body);
  return created(res, doc);
}

export async function updateSalaryConfig(req: AuthRequest, res: Response) {
  const body = { ...req.body };
  if (body.teacher_id) body.teacher_id = new Types.ObjectId(body.teacher_id);
  const doc = await SalaryConfig.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
  if (!doc) return fail(res, 404, 'Not found');
  return ok(res, doc);
}

export async function deleteSalaryConfig(req: AuthRequest, res: Response) {
  await SalaryConfig.findByIdAndDelete(req.params.id);
  return ok(res, null, 'Deleted');
}

export async function calculateSalary(req: AuthRequest, res: Response) {
  const cfg = await SalaryConfig.findById(req.params.id).lean();
  if (!cfg) return fail(res, 404, 'Not found');
  const daysWorked = Number(req.query.days) || undefined;
  const result = paymentService.calculateSalary({ ...cfg, daysWorked });
  return ok(res, result);
}

export async function processSalary(req: AuthRequest, res: Response) {
  const out = await paymentService.processSalaryPayments(req.body);
  return ok(res, out);
}
