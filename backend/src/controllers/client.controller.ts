import { Response } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function getClients(req: AuthRequest, res: Response): Promise<void> {
  const where = req.user!.role !== 'ADMIN' ? { createdById: req.user!.userId } : {};
  const search = req.query.search as string | undefined;

  const clients = await prisma.client.findMany({
    where: {
      ...where,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
        ],
      }),
    },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, clients);
}

export async function getClient(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const client = await prisma.client.findFirst({
    where: { id, ...(req.user!.role !== 'ADMIN' && { createdById: req.user!.userId }) },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!client) { sendError(res, 'Client not found', 404); return; }
  sendSuccess(res, client);
}

export async function createClient(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, phone, company, notes } = req.body;
  const client = await prisma.client.create({
    data: { name, email, phone, company, notes, createdById: req.user!.userId },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  sendSuccess(res, client, 'Client created', 201);
}

export async function updateClient(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, email, phone, company, notes } = req.body;

  const existing = await prisma.client.findFirst({
    where: { id, ...(req.user!.role !== 'ADMIN' && { createdById: req.user!.userId }) },
  });
  if (!existing) { sendError(res, 'Client not found', 404); return; }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(company !== undefined && { company }),
      ...(notes !== undefined && { notes }),
    },
    include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  sendSuccess(res, client, 'Client updated');
}

export async function deleteClient(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const existing = await prisma.client.findFirst({
    where: { id, ...(req.user!.role !== 'ADMIN' && { createdById: req.user!.userId }) },
  });
  if (!existing) { sendError(res, 'Client not found', 404); return; }
  await prisma.client.delete({ where: { id } });
  sendSuccess(res, null, 'Client deleted');
}
