import client from './client'

export interface ClientRecord {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  createdAt: string
  createdBy: { id: string; firstName: string; lastName: string }
}

export interface ClientPayload {
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}

export const clientsApi = {
  list: (search?: string) =>
    client.get<{ data: ClientRecord[] }>('/clients', { params: search ? { search } : {} }),
  get: (id: string) =>
    client.get<{ data: ClientRecord }>(`/clients/${id}`),
  create: (data: ClientPayload) =>
    client.post<{ data: ClientRecord }>('/clients', data),
  update: (id: string, data: Partial<ClientPayload>) =>
    client.put<{ data: ClientRecord }>(`/clients/${id}`, data),
  delete: (id: string) =>
    client.delete(`/clients/${id}`),
}
