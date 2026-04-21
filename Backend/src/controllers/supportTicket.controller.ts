import { Response } from 'express';
import { Types } from 'mongoose';
import { ok, created, fail } from '../utils/response';
import { AuthRequest } from '../types/auth.types';
import { SupportTicket } from '../models/SupportTicket.model';
import { Notification } from '../models/Notification.model';
import { notifyUser } from '../realtime';

function mapId(doc: any) {
  return { ...doc, id: doc.id ?? String(doc._id) };
}

export async function listSupportTickets(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const isStaff = req.authUser.roles.includes('admin') || req.authUser.roles.includes('teacher');
  const q = isStaff ? {} : { student_id: req.authUser.id };
  const items = await SupportTicket.find(q).sort({ created_at: -1 }).lean();
  return ok(res, (items as any[]).map(mapId));
}

export async function createSupportTicket(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const body = { ...req.body };
  const doc = await SupportTicket.create({
    ...body,
    student_id: req.authUser.id,
    status: body.status ?? 'open',
    response: body.response ?? null,
    responded_by: body.responded_by ?? null,
    responded_at: body.responded_at ?? null,
  });
  return created(res, mapId(doc.toObject()));
}

export async function respondSupportTicket(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { status, response } = req.body as { status: string; response: string | null };
  const { id } = req.params;

  const set = {
    status,
    response: response ?? null,
    responded_by: req.authUser.id,
    responded_at: new Date(),
  };

  // Frontend sends Mongo _id as `id`; legacy rows may use string field `id`
  let updated = Types.ObjectId.isValid(id)
    ? await SupportTicket.findByIdAndUpdate(id, { $set: set }, { new: true }).lean()
    : null;
  if (!updated) {
    updated = await SupportTicket.findOneAndUpdate({ id }, { $set: set }, { new: true }).lean();
  }
  if (!updated) return fail(res, 404, 'Not found');

  // Notify student when staff responds/updates status
  try {
    const studentId = String((updated as any).student_id);
    const subject = String((updated as any).subject ?? 'Support ticket');
    const title = 'Support ticket updated';
    const message =
      status === 'resolved'
        ? `Your ticket "${subject}" was resolved.`
        : status === 'in_progress'
          ? `Your ticket "${subject}" is now in progress.`
          : status === 'closed'
            ? `Your ticket "${subject}" was closed.`
            : `Your ticket "${subject}" was updated.`;

    const n = await Notification.create({
      user_id: studentId,
      title,
      message,
      type: 'support_ticket',
      target_path: '/support',
    });
    notifyUser(studentId, 'notification', {
      id: String(n._id),
      title: n.title,
      message: n.message,
      type: (n as any).type,
      target_path: (n as any).target_path ?? null,
    });
  } catch (e) {
    // Support ticket update already succeeded; log only.
    console.error('Support ticket notification failed', e);
  }
  return ok(res, mapId(updated));
}

