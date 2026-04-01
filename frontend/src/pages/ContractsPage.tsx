import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { contractsApi } from '../api/contracts'
import { Contract, Pagination } from '../types'
import StatusBadge from '../components/StatusBadge'

export default function ContractsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchContracts = () => {
    setLoading(true)
    contractsApi
      .list({ page, limit: 10, search: search || undefined, status: status || undefined })
      .then((res) => {
        setContracts(res.data.data.contracts)
        setPagination(res.data.data.pagination)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchContracts() }, [page, status])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchContracts()
  }

  const handleExportCSV = async () => {
    const res = await contractsApi.list({ page: 1, limit: 1000, search: search || undefined, status: status || undefined })
    const rows = res.data.data.contracts
    const headers = ['Title', 'Client', 'Email', 'Value', 'Currency', 'Status', 'Start Date', 'End Date', 'Created At']
    const csv = [
      headers.join(','),
      ...rows.map((c) =>
        [
          `"${c.title}"`,
          `"${c.clientName}"`,
          `"${c.clientEmail ?? ''}"`,
          c.value ?? '',
          c.currency,
          c.status,
          c.startDate ? new Date(c.startDate).toLocaleDateString() : '',
          c.endDate ? new Date(c.endDate).toLocaleDateString() : '',
          new Date(c.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contract?')) return
    await contractsApi.delete(id)
    fetchContracts()
  }

  const inputClass = 'px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contracts</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Export CSV
          </button>
          <Link
            to="/contracts/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Contract
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by title or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors">
            Search
          </button>
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className={inputClass}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No contracts found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    <Link to={`/contracts/${c.id}`} className="hover:text-blue-600 transition-colors">{c.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.clientName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {c.value != null ? `$${c.value.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/contracts/${c.id}/edit`)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {pagination.total} contracts · Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
