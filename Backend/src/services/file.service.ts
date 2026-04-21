import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/environment';
import { FileMeta } from '../models/FileMeta.model';
import { Types } from 'mongoose';

export async function ensureUploadRoot() {
  await fs.mkdir(env.uploadDir, { recursive: true });
}

export function buildStoredPath(ownerId: string, kind: string, originalName: string) {
  const ext = path.extname(originalName) || '.bin';
  const safe = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  return path.join(ownerId, kind, safe).replace(/\\/g, '/');
}

export async function saveFileRecord(
  ownerId: string,
  kind: 'avatar' | 'selfie' | 'other',
  diskPath: string,
  mime: string,
  size: number,
  originalName?: string
) {
  const meta = await FileMeta.create({
    owner_id: new Types.ObjectId(ownerId),
    kind,
    path: diskPath,
    mime,
    size,
    original_name: originalName,
  });
  return meta;
}

export async function getMetaById(id: string) {
  return FileMeta.findById(id).lean();
}

export async function deleteMeta(id: string, ownerId: string) {
  const meta = await FileMeta.findOne({ _id: id, owner_id: ownerId });
  if (!meta) return null;
  const abs = path.join(env.uploadDir, meta.path);
  await fs.unlink(abs).catch(() => undefined);
  await meta.deleteOne();
  return meta;
}

export function publicFileUrl(reqHost: string, fileId: string) {
  return `${reqHost}/api/files/${fileId}`;
}
