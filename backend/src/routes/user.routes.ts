import { Router } from 'express';
import { body } from 'express-validator';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/', getUsers);

router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').optional().isIn(['ADMIN', 'USER']),
  ],
  validate,
  createUser
);

router.put(
  '/:id',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('role').optional().isIn(['ADMIN', 'USER']),
  ],
  validate,
  updateUser
);

router.delete('/:id', deleteUser);

router.put(
  '/:id/reset-password',
  [body('newPassword').isLength({ min: 8 })],
  validate,
  resetUserPassword
);

export default router;
