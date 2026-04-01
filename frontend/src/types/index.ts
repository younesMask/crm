export type UserRole = 'ADMIN' | 'USER'
export type ContractStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
  updatedAt?: string
}

export interface Contract {
  id: string
  title: string
  description?: string
  clientName: string
  clientEmail?: string
  value?: number
  currency: string
  status: ContractStatus
  startDate?: string
  endDate?: string
  signedAt?: string
  notes?: string
  fileUrl?: string
  createdAt: string
  updatedAt: string
  createdBy: { id: string; firstName: string; lastName: string; email: string }
}

export interface ContractStats {
  total: number
  byStatus: Partial<Record<ContractStatus, number>>
  activeValue: number
  totalValue: number
  expiringSoon: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ContractsResponse {
  contracts: Contract[]
  pagination: Pagination
}
