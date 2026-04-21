import { Router } from 'express';
import * as ctrl from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const r = Router();

r.post('/upload', authMiddleware, upload.single('file'), ctrl.uploadFile);
r.get('/profile/:userId', authMiddleware, ctrl.profileFiles);
r.post('/selfie', authMiddleware, upload.single('file'), ctrl.uploadSelfie);
r.get('/selfie/:id', authMiddleware, ctrl.getSelfie);
r.get('/:id', ctrl.getFile);
r.delete('/:id', authMiddleware, ctrl.deleteFile);

export default r;
