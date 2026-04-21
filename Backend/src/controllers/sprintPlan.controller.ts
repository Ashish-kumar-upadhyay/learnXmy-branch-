import { Response } from 'express';
import { requireRoles } from '../middleware/role.middleware';
import { ok, created, fail } from '../utils/response';
import { AuthRequest, AppRole } from '../types/auth.types';
import { SprintPlan } from '../models/SprintPlan.model';
import { SprintPlanTask } from '../models/SprintPlanTask.model';

function mapId<T extends Record<string, any>>(doc: T) {
  return { ...doc, id: doc.id ?? String(doc._id) };
}

export async function listSprintPlans(req: AuthRequest, res: Response) {
  const items = await SprintPlan.find().sort({ week_start: -1 }).lean();
  return ok(res, (items as any[]).map(mapId));
}

export async function createSprintPlan(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const body = { ...req.body };
  const doc = await SprintPlan.create({
    title: body.title,
    description: body.description ?? null,
    week_start: body.week_start,
    week_end: body.week_end,
    batch: body.batch ?? null,
    created_by: req.authUser.id,
    id: body.id,
  });
  return created(res, mapId(doc.toObject()));
}

export async function deleteSprintPlan(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { id } = req.params;
  await SprintPlan.deleteOne({ id }).catch(() => undefined);
  await SprintPlanTask.deleteMany({ sprint_plan_id: id }).catch(() => undefined);
  return ok(res, null, 'Deleted');
}

export async function listSprintPlanTasks(_req: AuthRequest, res: Response) {
  const items = await SprintPlanTask.find().sort({ sort_order: 1 }).lean();
  return ok(res, (items as any[]).map(mapId));
}

export async function createSprintPlanTask(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const body = { ...req.body };
  const doc = await SprintPlanTask.create({
    sprint_plan_id: body.sprint_plan_id,
    title: body.title,
    module: body.module ?? 'General',
    is_done: body.is_done ?? false,
    sort_order: body.sort_order,
    link: body.link ?? null,
    id: body.id,
  });
  return created(res, mapId(doc.toObject()));
}

export async function toggleSprintPlanTask(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { id } = req.params;
  const { is_done } = req.body as { is_done: boolean };
  const doc = await SprintPlanTask.findOneAndUpdate({ _id: id }, { $set: { is_done } }, { new: true }).lean();
  if (!doc) return fail(res, 404, 'Not found');
  return ok(res, mapId(doc));
}

export async function deleteSprintPlanTask(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { id } = req.params;
  await SprintPlanTask.deleteOne({ _id: id });
  return ok(res, null, 'Deleted');
}

