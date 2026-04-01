import prisma from '../lib/prisma';

export async function logActivity(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: string,
  entityId: string,
  entityTitle: string,
  userId: string,
  userFullName: string
) {
  await prisma.activityLog.create({
    data: { action, entityType, entityId, entityTitle, userId, userFullName },
  });
}
