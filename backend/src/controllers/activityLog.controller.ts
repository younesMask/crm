import { Response } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export async function getActivityLogs(req: AuthRequest, res: Response): Promise<void> {
  const limit = Math.min(100, parseInt((req.query.limit as string) || '50'));

  const where = req.user!.role !== 'ADMIN' ? { userId: req.user!.userId } : {};

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  sendSuccess(res, logs);
}
