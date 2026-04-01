import client from './client'
import { User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ data: { user: User; token: string } }>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    client.post<{ data: { user: User; token: string } }>('/auth/register', data),

  me: () => client.get<{ data: User }>('/auth/me'),

  updateProfile: (data: { firstName: string; lastName: string }) =>
    client.put<{ data: User }>('/auth/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    client.put('/auth/me/password', { currentPassword, newPassword }),
}
