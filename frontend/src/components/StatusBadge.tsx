import { ContractStatus } from '../types'

const config: Record<ContractStatus, { label: string; className: string }> = {
  DRAFT:     { label: 'Draft',     className: 'bg-gray-100 text-gray-600' },
  PENDING:   { label: 'Pending',   className: 'bg-yellow-100 text-yellow-700' },
  ACTIVE:    { label: 'Active',    className: 'bg-green-100 text-green-700' },
  EXPIRED:   { label: 'Expired',   className: 'bg-red-100 text-red-600' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
}

export default function StatusBadge({ status }: { status: ContractStatus }) {
  const { label, className } = config[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
