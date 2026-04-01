import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { contractsApi } from '../api/contracts'
import { ContractStats, ContractStatus } from '../types'
import { useAuth } from '../context/AuthContext'

const STATUS_CONFIG: Record<ContractStatus, { color: string; label: string }> = {
  ACTIVE:    { color: '#16a34a', label: 'Active' },
  PENDING:   { color: '#ca8a04', label: 'Pending' },
  DRAFT:     { color: '#9ca3af', label: 'Draft' },
  EXPIRED:   { color: '#dc2626', label: 'Expired' },
  CANCELLED: { color: '#6b7280', label: 'Cancelled' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [monthly, setMonthly] = useState<{ month: string; count: number; value: number }[]>([])

  useEffect(() => {
    contractsApi.stats().then((res) => setStats(res.data.data))
    contractsApi.monthlyStats().then((res) => setMonthly(res.data.data))
  }, [])

  const statCards = [
    { label: 'Total',     value: stats?.total ?? '—',                  color: 'text-gray-900 dark:text-white', to: '/contracts' },
    { label: 'Active',    value: stats?.byStatus?.ACTIVE ?? 0,         color: 'text-green-600',                to: '/contracts?status=ACTIVE' },
    { label: 'Pending',   value: stats?.byStatus?.PENDING ?? 0,        color: 'text-yellow-600',               to: '/contracts?status=PENDING' },
    { label: 'Draft',     value: stats?.byStatus?.DRAFT ?? 0,          color: 'text-gray-500',                 to: '/contracts?status=DRAFT' },
    { label: 'Expired',   value: stats?.byStatus?.EXPIRED ?? 0,        color: 'text-red-500',                  to: '/contracts?status=EXPIRED' },
    { label: 'Cancelled', value: stats?.byStatus?.CANCELLED ?? 0,      color: 'text-gray-400',                 to: '/contracts?status=CANCELLED' },
  ]

  const chartData = (Object.keys(STATUS_CONFIG) as ContractStatus[])
    .map((s) => ({ status: s, value: stats?.byStatus?.[s] ?? 0, ...STATUS_CONFIG[s] }))
    .filter((d) => d.value > 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.firstName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's your Universal Trades overview</p>
      </div>

      {stats && stats.expiringSoon > 0 && (
        <Link
          to="/contracts?status=ACTIVE"
          className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3 mb-6 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
        >
          <span className="text-amber-500 text-lg">⚠️</span>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {stats.expiringSoon} active contract{stats.expiringSoon > 1 ? 's' : ''} expiring within 30 days
          </p>
          <span className="ml-auto text-xs text-amber-600 dark:text-amber-400">View →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all group"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color} group-hover:scale-105 transition-transform`}>{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Donut chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Contracts by Status</p>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) => { const s = (entry as unknown as { status?: ContractStatus }).status; if (s) navigate(`/contracts?status=${s}`) }}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) =>
                      [`${value} contracts`, (props.payload as { label?: string } | undefined)?.label]
                    }
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-col gap-2 min-w-[110px]">
                {chartData.map((entry) => (
                  <button
                    key={entry.status}
                    onClick={() => navigate(`/contracts?status=${entry.status}`)}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span>{entry.label}</span>
                    <span className="ml-auto font-semibold text-gray-800 dark:text-gray-200">{entry.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active value */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Contracts Value</p>
            <p className="text-2xl font-bold text-blue-600">
              ${stats?.activeValue?.toLocaleString() ?? '0'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats?.totalValue?.toLocaleString() ?? '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mt-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Monthly Contracts — {new Date().getFullYear()}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [
                name === 'value' ? `$${Number(value).toLocaleString()}` : value,
                name === 'value' ? 'Value' : 'Contracts',
              ]}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="count" />
          </BarChart>
        </ResponsiveContainer>
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
