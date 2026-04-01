import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { contractsApi, ContractPayload } from '../api/contracts'
import { ContractStatus } from '../types'

const STATUSES: ContractStatus[] = ['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export default function ContractFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<ContractPayload>({
    title: '',
    clientName: '',
    clientEmail: '',
    description: '',
    value: undefined,
    currency: 'USD',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (!id) return
    contractsApi.get(id).then((res) => {
      const c = res.data.data
      setForm({
        title: c.title,
        clientName: c.clientName,
        clientEmail: c.clientEmail ?? '',
        description: c.description ?? '',
        value: c.value ?? undefined,
        currency: c.currency,
        status: c.status,
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
        endDate: c.endDate ? c.endDate.slice(0, 10) : '',
        notes: c.notes ?? '',
      })
      setFetching(false)
    })
  }, [id])

  const set = (field: keyof ContractPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        value: form.value ? Number(form.value) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        clientEmail: form.clientEmail || undefined,
        description: form.description || undefined,
        notes: form.notes || undefined,
      }
      if (isEdit) {
        await contractsApi.update(id!, payload)
      } else {
        await contractsApi.create(payload)
      }
      navigate('/contracts')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/contracts')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Contract' : 'New Contract'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input type="text" required value={form.title} onChange={set('title')} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client Name *</label>
            <input type="text" required value={form.clientName} onChange={set('clientName')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Client Email</label>
            <input type="email" value={form.clientEmail} onChange={set('clientEmail')} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Value</label>
            <input type="number" min="0" step="0.01" value={form.value ?? ''} onChange={set('value')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select value={form.currency} onChange={set('currency')} className={inputClass}>
              {['USD', 'EUR', 'GBP', 'MAD'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={set('status')} className={inputClass}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input type="date" value={form.startDate} onChange={set('startDate')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input type="date" value={form.endDate} onChange={set('endDate')} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3} className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inputClass} resize-none`} />
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Contract'}
          </button>
          <button
            type="button" onClick={() => navigate('/contracts')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
