import { Response } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, PaginationQuery, ContractStatus } from '../types';
import { logActivity } from '../utils/activityLog';

export async function createContract(req: AuthRequest, res: Response): Promise<void> {
  const { title, description, clientName, clientEmail, value, currency, status, startDate, endDate, notes } = req.body;

  const contract = await prisma.contract.create({
    data: {
      title,
      description,
      clientName,
      clientEmail,
      value: value ? parseFloat(value) : undefined,
      currency: currency || 'USD',
      status: status || 'DRAFT',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      notes,
      createdById: req.user!.userId,
    },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  await logActivity('CREATE', 'Contract', contract.id, contract.title, req.user!.userId, `${contract.createdBy.firstName} ${contract.createdBy.lastName}`);
  sendSuccess(res, contract, 'Contract created', 201);
}

export async function getContracts(req: AuthRequest, res: Response): Promise<void> {
  const { page = '1', limit = '10', search, sortBy = 'createdAt', sortOrder = 'desc', status } = req.query as PaginationQuery & { status?: string };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where = {
    ...(req.user!.role !== 'ADMIN' && { createdById: req.user!.userId }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
      ],
    }),
  };

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy]: sortOrder },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    prisma.contract.count({ where }),
  ]);

  sendSuccess(res, {
    contracts,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
}

export async function getContract(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const contract = await prisma.contract.findFirst({
    where: {
      id,
      ...(req.user!.role !== 'ADMIN' && { createdById: req.user!.userId }),
    },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  if (!contract) {
    sendError(res, 'Contract not found', 404);
    return;
  }

  sendSuccess(res, contract);
}

export async function updateContract(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { title, description, clientName, clientEmail, value, currency, status, startDate, endDate, signedAt, notes } = req.body;

  const existing = await prisma.contract.findFirst({
    where: { id, ...(req.user!.role !== 'ADMIN' && { createdById: req.user!.userId }) },
  });

  if (!existing) {
    sendError(res, 'Contract not found', 404);
    return;
  }

  const contract = await prisma.contract.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(clientName !== undefined && { clientName }),
      ...(clientEmail !== undefined && { clientEmail }),
      ...(value !== undefined && { value: parseFloat(value) }),
      ...(currency !== undefined && { currency }),
      ...(status !== undefined && { status }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(signedAt !== undefined && { signedAt: new Date(signedAt) }),
      ...(notes !== undefined && { notes }),
    },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });

  await logActivity('UPDATE', 'Contract', contract.id, contract.title, req.user!.userId, `${contract.createdBy.firstName} ${contract.createdBy.lastName}`);
  sendSuccess(res, contract, 'Contract updated');
}

export async function deleteContract(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.contract.findFirst({
    where: { id, ...(req.user!.role !== 'ADMIN' && { createdById: req.user!.userId }) },
  });

  if (!existing) {
    sendError(res, 'Contract not found', 404);
    return;
  }

  await logActivity('DELETE', 'Contract', id, existing.title, req.user!.userId, req.user!.email);
  await prisma.contract.delete({ where: { id } });
  sendSuccess(res, null, 'Contract deleted');
}

export async function getMonthlyStats(req: AuthRequest, res: Response): Promise<void> {
  const where = req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {};

  const contracts = await prisma.contract.findMany({
    where: { ...where, createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    select: { createdAt: true, value: true, status: true },
  });

  const months: Record<string, { month: string; count: number; value: number }> = {};
  for (let m = 0; m < 12; m++) {
    const key = `${new Date().getFullYear()}-${String(m + 1).padStart(2, '0')}`;
    const label = new Date(new Date().getFullYear(), m, 1).toLocaleString('default', { month: 'short' });
    months[key] = { month: label, count: 0, value: 0 };
  }

  for (const c of contracts) {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) {
      months[key].count++;
      months[key].value += c.value ?? 0;
    }
  }

  sendSuccess(res, Object.values(months));
}

export async function getContractStats(req: AuthRequest, res: Response): Promise<void> {
  const where = req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {};

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [total, byStatus, activeValue, totalValue, expiringSoon] = await Promise.all([
    prisma.contract.count({ where }),
    prisma.contract.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
    prisma.contract.aggregate({
      where: { ...where, status: 'ACTIVE' },
      _sum: { value: true },
    }),
    prisma.contract.aggregate({
      where,
      _sum: { value: true },
    }),
    prisma.contract.count({
      where: {
        ...where,
        status: 'ACTIVE',
        endDate: { gte: new Date(), lte: thirtyDaysFromNow },
      },
    }),
  ]);

  const statusCounts = byStatus.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);

  sendSuccess(res, {
    total,
    byStatus: statusCounts,
    activeValue: activeValue._sum.value || 0,
    totalValue: totalValue._sum.value || 0,
    expiringSoon,
  });
}
