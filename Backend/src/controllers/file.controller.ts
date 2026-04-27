import fs from 'fs/promises';
import path from 'path';
import { Response } from 'express';
import { AuthRequest } from '../types/auth.types';
import { env } from '../config/environment';
import * as fileService from '../services/file.service';
import { FileMeta } from '../models/FileMeta.model';
import { User } from '../models/User.model';
import { ok, fail } from '../utils/response';

export async function uploadFile(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const file = req.file;
  if (!file) return fail(res, 400, 'No file');
  const kind = (req.body.kind as 'avatar' | 'selfie' | 'other') || 'other';
  const uploadRoot = path.resolve(env.uploadDir);
  const fileAbs = path.resolve(file.path);
  let rel = path.relative(uploadRoot, fileAbs).replace(/\\/g, '/');
  if (!rel || rel.startsWith('..')) {
    // Safety fallback if relative path cannot be derived cleanly.
    rel = path.join(req.authUser.id, kind, path.basename(file.path)).replace(/\\/g, '/');
  }
  const meta = await fileService.saveFileRecord(req.authUser.id, kind, rel, file.mimetype, file.size, file.originalname);
  if (kind === 'avatar') {
    // Store full URL to ensure persistence and proper access
    const fullAvatarUrl = `${req.protocol}://${req.get('host')}/api/files/${meta._id}`;
    
    try {
      // Get current user to clean up old avatar if exists
      const currentUser = await User.findById(req.authUser.id).select('avatar_url').lean();
      if (currentUser?.avatar_url) {
        // Extract file ID from old avatar URL for cleanup
        const oldUrlMatch = currentUser.avatar_url.match(/\/api\/files\/(.+)$/);
        if (oldUrlMatch && oldUrlMatch[1]) {
          // Clean up old avatar file
          await fileService.deleteMeta(oldUrlMatch[1], req.authUser.id).catch(() => {});
        }
      }
      
      await User.findByIdAndUpdate(req.authUser.id, { avatar_url: fullAvatarUrl } as Record<string, unknown>);
      return ok(res, { id: String(meta._id), url: fullAvatarUrl });
    } catch (error) {
      // If database update fails, clean up the uploaded file
      await fileService.deleteMeta(String(meta._id), req.authUser.id).catch(() => {});
      throw error;
    }
  }
  return ok(res, { id: String(meta._id), url: `/api/files/${meta._id}` });
}

export async function getFile(req: AuthRequest, res: Response) {
  const meta = await fileService.getMetaById(req.params.id);
  if (!meta) return fail(res, 404, 'Not found');
  const candidates = [
    path.resolve(env.uploadDir, meta.path),
    path.resolve(meta.path),
  ];
  let chosen = '';
  for (const c of candidates) {
    try {
      await fs.access(c);
      chosen = c;
      break;
    } catch {
      // try next candidate
    }
  }
  if (!chosen) {
    // If file not found, clean up the database record and return 404
    await fileService.deleteMeta(req.params.id, meta.owner_id.toString()).catch(() => {});
    return fail(res, 404, 'File not found on disk');
  }
  res.setHeader('Content-Type', meta.mime);
  return res.sendFile(chosen);
}

export async function deleteFile(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const meta = await fileService.deleteMeta(req.params.id, req.authUser.id);
  if (!meta) return fail(res, 404, 'Not found');
  return ok(res, null, 'Deleted');
}

export async function profileFiles(req: AuthRequest, res: Response) {
  const items = await FileMeta.find({ owner_id: req.params.userId }).lean();
  return ok(res, items);
}

export async function uploadSelfie(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) return fail(res, 400, 'No file');
  const ownerId = req.authUser?.id || (req.body.user_id as string);
  if (!ownerId) return fail(res, 400, 'user required');
  const rel = path.relative(env.uploadDir, file.path).replace(/\\/g, '/');
  const meta = await fileService.saveFileRecord(ownerId, 'selfie', rel, file.mimetype, file.size, file.originalname);
  return ok(res, { id: String(meta._id), url: `/api/files/selfie/${meta._id}` });
}

export async function getSelfie(req: AuthRequest, res: Response) {
  return getFile(req, res);
}

// Utility function to validate and fix avatar URLs
export async function validateAvatarUrl(userId: string, avatarUrl: string | null): Promise<string | null> {
  if (!avatarUrl) return null;
  
  try {
    // Extract file ID from avatar URL
    const urlMatch = avatarUrl.match(/\/api\/files\/(.+)$/);
    if (!urlMatch) return avatarUrl; // Return as-is if format doesn't match
    
    const fileId = urlMatch[1];
    const meta = await fileService.getMetaById(fileId);
    
    if (!meta) {
      // File metadata doesn't exist, clear the avatar URL
      await User.findByIdAndUpdate(userId, { avatar_url: null } as Record<string, unknown>);
      return null;
    }
    
    // Check if file exists on disk
    const filePath = path.resolve(env.uploadDir, meta.path);
    try {
      await fs.access(filePath);
      return avatarUrl; // URL is valid
    } catch {
      // File doesn't exist on disk, clean up
      await fileService.deleteMeta(fileId, userId).catch(() => {});
      await User.findByIdAndUpdate(userId, { avatar_url: null } as Record<string, unknown>);
      return null;
    }
  } catch (error) {
    console.error('Error validating avatar URL:', error);
    return avatarUrl; // Return original URL on error
  }
}
