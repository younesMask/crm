import { useEffect, useState, FormEvent } from 'react'
import { clientsApi, ClientRecord, ClientPayload } from '../api/clients'

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
const emptyForm: ClientPayload = { name: '', email: '', phone: '', company: '', notes: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | ClientRecord | null>(null)
  const [form, setForm] = useState<ClientPayload>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchClients = (q?: string) => {
    setLoading(true)
    clientsApi.list(q).then((res) => setClients(res.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchClients() }, [])

  const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create') }
  const openEdit = (c: ClientRecord) => {
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', company: c.company ?? '', notes: c.notes ?? '' })
    setFormError('')
    setModal(c)
  }

  const set = (field: keyof ClientPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...form, email: form.email || undefined, phone: form.phone || undefined, company: form.company || undefined, notes: form.notes || undefined }
      if (modal === 'create') {
        await clientsApi.create(payload)
      } else {
        await clientsApi.update((modal as ClientRecord).id, payload)
      }
      setModal(null)
      fetchClients(search || undefined)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client?')) return
    await clientsApi.delete(id)
    fetchClients(search || undefined)
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    fetchClients(search || undefined)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Client
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name, email or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`flex-1 ${inputClass}`}
        />
        <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No clients found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {c.email ? <a href={`mailto:${c.email}`} className="text-blue-500 hover:underline">{c.email}</a> : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {modal === 'create' ? 'New Client' : 'Edit Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Name *</label>
                <input required value={form.name} onChange={set('name')} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={set('email')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input value={form.phone} onChange={set('phone')} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Company</label>
                <input value={form.company} onChange={set('company')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inputClass} resize-none`} />
              </div>
              {formError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">
                  {saving ? 'Saving...' : modal === 'create' ? 'Create' : 'Save'}
                </button>
                <button type="button" onClick={() => setModal(null)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
