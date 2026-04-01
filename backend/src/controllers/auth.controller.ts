import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, firstName, lastName } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    sendError(res, 'Email already in use', 409);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role as 'ADMIN' | 'USER' });
  sendSuccess(res, { user, token }, 'Account created successfully', 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role as 'ADMIN' | 'USER' });
  const { password: _, ...userWithoutPassword } = user;
  sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, user);
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { firstName, lastName } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { firstName, lastName },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, updatedAt: true },
  });

  sendSuccess(res, user, 'Profile updated');
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    sendError(res, 'Current password is incorrect', 401);
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { password: hashedPassword },
  });

  sendSuccess(res, null, 'Password changed successfully');
}
