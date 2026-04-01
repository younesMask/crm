import client from './client'
import { Contract, ContractStats, ContractsResponse, ContractStatus } from '../types'

export interface ContractPayload {
  title: string
  description?: string
  clientName: string
  clientEmail?: string
  value?: number
  currency?: string
  status?: ContractStatus
  startDate?: string
  endDate?: string
  notes?: string
}

export const contractsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    client.get<{ data: ContractsResponse }>('/contracts', { params }),

  get: (id: string) =>
    client.get<{ data: Contract }>(`/contracts/${id}`),

  create: (data: ContractPayload) =>
    client.post<{ data: Contract }>('/contracts', data),

  update: (id: string, data: Partial<ContractPayload> & { signedAt?: string }) =>
    client.put<{ data: Contract }>(`/contracts/${id}`, data),

  delete: (id: string) =>
    client.delete(`/contracts/${id}`),

  stats: () =>
    client.get<{ data: ContractStats }>('/contracts/stats'),
}
