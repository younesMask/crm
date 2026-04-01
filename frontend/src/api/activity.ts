import client from './client'

export interface ActivityLog {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: string
  entityId: string
  entityTitle: string
  userId: string
  userFullName: string
  createdAt: string
}

export const activityApi = {
  list: (limit?: number) =>
    client.get<{ data: ActivityLog[] }>('/activity', { params: { limit } }),
}
