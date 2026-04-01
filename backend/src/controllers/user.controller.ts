import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function getUsers(_req: AuthRequest, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, _count: { select: { contracts: true } } },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, users);
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  const { email, password, firstName, lastName, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    sendError(res, 'Email already in use', 409);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName, role: role || 'USER' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });
  sendSuccess(res, user, 'User created', 201);
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { firstName, lastName, role } = req.body;

  if (id === req.user!.userId) {
    sendError(res, 'Cannot modify your own account here', 400);
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(role !== undefined && { role }),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });
  sendSuccess(res, user, 'User updated');
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  if (id === req.user!.userId) {
    sendError(res, 'Cannot delete your own account', 400);
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 'User not found', 404);
    return;
  }

  await prisma.user.delete({ where: { id } });
  sendSuccess(res, null, 'User deleted');
}

export async function resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { newPassword } = req.body;

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  sendSuccess(res, null, 'Password reset successfully');
}
