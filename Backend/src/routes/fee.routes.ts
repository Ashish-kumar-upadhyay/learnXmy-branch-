import { Router } from 'express';
import * as ctrl from '../controllers/fee.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';

const r = Router();
r.use(authMiddleware);

r.get('/structure', ctrl.listFeeStructure);
r.post('/structure', requireRoles('admin'), ctrl.createFeeStructure);
r.put('/structure/:id', requireRoles('admin'), ctrl.updateFeeStructure);
r.delete('/structure/:id', requireRoles('admin'), ctrl.deleteFeeStructure);

r.get('/payments/student/:id', ctrl.studentPayments);
r.get('/payments', ctrl.listPayments);
r.post('/payments', requireRoles('admin', 'teacher'), ctrl.createPayment);
r.get('/receipts', requireRoles('admin', 'teacher'), ctrl.receipts);

export default r;
