import { Response } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, PaginationQuery, ContractStatus } from '../types';

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

  await prisma.contract.delete({ where: { id } });
  sendSuccess(res, null, 'Contract deleted');
}

export async function getContractStats(req: AuthRequest, res: Response): Promise<void> {
  const where = req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {};

  const [total, byStatus, totalValue] = await Promise.all([
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
  ]);

  const statusCounts = byStatus.reduce((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {} as Record<string, number>);

  sendSuccess(res, {
    total,
    byStatus: statusCounts,
    activeValue: totalValue._sum.value || 0,
  });
}
