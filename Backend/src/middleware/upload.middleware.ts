import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../config/environment';

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId =
      (req as { authUser?: { id: string } }).authUser?.id ||
      (req as { user?: { id: string } }).user?.id ||
      (req.body.user_id as string) ||
      'anonymous';
    const kind = (req.body.kind as string) || 'other';
    const dir = path.join(env.uploadDir, userId, kind);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const maxBytes = env.maxFileMb * 1024 * 1024;

export const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    const okMime =
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('text/');
    if (!okMime) {
      cb(new Error('Unsupported file type'));
      return;
    }
    cb(null, true);
  },
});
