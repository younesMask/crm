import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { contractsApi } from '../api/contracts'
import { Contract } from '../types'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const field = (label: string, value: React.ReactNode) => (
  <div>
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm text-gray-900 dark:text-white">{value || <span className="text-gray-400">—</span>}</p>
  </div>
)

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const apiBase = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    if (!id) return
    contractsApi.get(id)
      .then((res) => setContract(res.data.data))
      .catch(() => navigate('/contracts'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !contract) return
    setUploading(true)
    try {
      await contractsApi.uploadFile(contract.id, file)
      const res = await contractsApi.get(contract.id)
      setContract(res.data.data)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!contract || !confirm('Delete this contract?')) return
    setDeleting(true)
    await contractsApi.delete(contract.id)
    navigate('/contracts')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!contract) return null

  const canEdit = user?.role === 'ADMIN' || contract.createdBy.id === user?.id

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/contracts')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm">
          ← Back
        </button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{contract.title}</h1>
          <StatusBadge status={contract.status} />
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              to={`/contracts/${contract.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Client & Value */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Client</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white">{contract.clientName}</p>
          {contract.clientEmail && (
            <a href={`mailto:${contract.clientEmail}`} className="text-xs text-blue-500 hover:underline mt-0.5 block">
              {contract.clientEmail}
            </a>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Contract Value</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {contract.value != null
              ? `${contract.currency} ${contract.value.toLocaleString()}`
              : <span className="text-gray-400">—</span>}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created By</p>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {contract.createdBy.firstName} {contract.createdBy.lastName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(contract.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {field('Start Date', contract.startDate ? new Date(contract.startDate).toLocaleDateString() : null)}
          {field('End Date', contract.endDate ? new Date(contract.endDate).toLocaleDateString() : null)}
          {field('Signed At', contract.signedAt ? new Date(contract.signedAt).toLocaleDateString() : null)}
        </div>

        <hr className="border-gray-100 dark:border-gray-800" />

        {field('Description', contract.description)}

        {contract.notes && (
          <>
            <hr className="border-gray-100 dark:border-gray-800" />
            {field('Notes', contract.notes)}
          </>
        )}

        <hr className="border-gray-100 dark:border-gray-800" />
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Attachment</p>
          {contract.fileUrl ? (
            <div className="flex items-center gap-3">
              <a
                href={`${apiBase}${contract.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                📎 View File
              </a>
              {canEdit && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Replace'}
                </button>
              )}
            </div>
          ) : canEdit ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : '📎 Attach File'}
            </button>
          ) : (
            <p className="text-sm text-gray-400">No attachment</p>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>
    </div>
  )
}
