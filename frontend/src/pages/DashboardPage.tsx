import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contractsApi } from '../api/contracts'
import { ContractStats } from '../types'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ContractStats | null>(null)

  useEffect(() => {
    contractsApi.stats().then((res) => setStats(res.data.data))
  }, [])

  const statCards = [
    { label: 'Total Contracts', value: stats?.total ?? '—',             color: 'text-gray-900 dark:text-white' },
    { label: 'Active',          value: stats?.byStatus?.ACTIVE ?? 0,    color: 'text-green-600' },
    { label: 'Pending',         value: stats?.byStatus?.PENDING ?? 0,   color: 'text-yellow-600' },
    { label: 'Draft',           value: stats?.byStatus?.DRAFT ?? 0,     color: 'text-gray-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.firstName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's your CRM overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Contracts Value</p>
        <p className="text-3xl font-bold text-blue-600">
          ${stats?.activeValue?.toLocaleString() ?? '0'}
        </p>
      </div>

      <div className="mt-6">
        <Link
          to="/contracts"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          View All Contracts →
        </Link>
      </div>
    </div>
  )
}
