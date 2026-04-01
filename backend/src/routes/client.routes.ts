import { Router } from 'express';
import { body } from 'express-validator';
import { getClients, getClient, createClient, updateClient, deleteClient } from '../controllers/client.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail(),
  ],
  validate,
  createClient
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
  ],
  validate,
  updateClient
);

router.delete('/:id', deleteClient);

export default router;
