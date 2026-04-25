import { Request } from 'express';

export type AppRole = 'student' | 'teacher' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  roles: AppRole[];
  tokenVersion: number;
};

// Custom file type to match multer's file structure
export type UploadedFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
};

// Important: do NOT use `req.user` because passport also uses `req.user`.
export type AuthRequest = Request & { authUser?: AuthUser; file?: UploadedFile };
