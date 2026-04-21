import * as user from '../controllers/user.controller';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/role.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createUserAdminSchema, roleAssignSchema } from '../utils/validation';

const r = Router();
r.use(authMiddleware);

r.get('/', requireRoles('admin'), user.listUsers);
r.post('/', requireRoles('admin'), validateBody(createUserAdminSchema), user.createUser);
r.get('/batch/:batch', user.usersByBatch);
r.get('/:id', user.getUserById);
r.put('/:id', user.updateUser);
r.delete('/:id', requireRoles('admin', 'teacher'), user.deleteUser);
r.post('/:id/assign-role', requireRoles('admin'), validateBody(roleAssignSchema), user.assignRole);
r.delete('/:id/remove-role', requireRoles('admin'), validateBody(roleAssignSchema), user.removeRoleFromUser);

export default r;
