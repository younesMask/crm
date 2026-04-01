import { Router } from 'express';
import { body } from 'express-validator';
import {
  createContract,
  getContracts,
  getContract,
  updateContract,
  deleteContract,
  getContractStats,
} from '../controllers/contract.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getContractStats);

router.get('/', getContracts);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('clientName').trim().notEmpty().withMessage('Client name is required'),
    body('clientEmail').optional().isEmail(),
    body('value').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validate,
  createContract
);

router.get('/:id', getContract);

router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('clientEmail').optional().isEmail(),
    body('value').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('signedAt').optional().isISO8601(),
  ],
  validate,
  updateContract
);

router.delete('/:id', deleteContract);

export default router;
