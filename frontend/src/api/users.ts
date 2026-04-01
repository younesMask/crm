import client from './client'

export interface UserRecord {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'USER'
  createdAt: string
  _count: { contracts: number }
}

export const usersApi = {
  list: () => client.get<{ data: UserRecord[] }>('/users'),
  create: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    client.post<{ data: UserRecord }>('/users', data),
  update: (id: string, data: { firstName?: string; lastName?: string; role?: string }) =>
    client.put<{ data: UserRecord }>(`/users/${id}`, data),
  delete: (id: string) => client.delete(`/users/${id}`),
  resetPassword: (id: string, newPassword: string) =>
    client.put(`/users/${id}/reset-password`, { newPassword }),
}
