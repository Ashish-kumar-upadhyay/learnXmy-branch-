import * as user from '../controllers/user.controller.js';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/role.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createUserAdminSchema, roleAssignSchema } from '../utils/validation.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const r = Router();
r.use(authMiddleware);

r.get('/', requireRoles('admin'), cacheMiddleware(5 * 60 * 1000), user.listUsers);
r.post('/', requireRoles('admin'), validateBody(createUserAdminSchema), user.createUser);
r.get('/batch/:batch', cacheMiddleware(3 * 60 * 1000), user.usersByBatch);
r.get('/:id', cacheMiddleware(10 * 60 * 1000), user.getUserById);
r.put('/:id', user.updateUser);
r.delete('/:id', requireRoles('admin', 'teacher'), user.deleteUser);
r.post('/:id/assign-role', requireRoles('admin'), validateBody(roleAssignSchema), user.assignRole);
r.delete('/:id/remove-role', requireRoles('admin'), validateBody(roleAssignSchema), user.removeRoleFromUser);

export default r;
