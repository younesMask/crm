import { useEffect, useState } from 'react'
import { usersApi, UserRecord } from '../api/users'

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

const emptyForm = { email: '', password: '', firstName: '', lastName: '', role: 'USER' }

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetTarget, setResetTarget] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const fetch = () => {
    setLoading(true)
    usersApi.list().then((res) => setUsers(res.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await usersApi.create(form)
      setShowForm(false)
      setForm(emptyForm)
      fetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (user: UserRecord, role: string) => {
    await usersApi.update(user.id, { role })
    fetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? Their contracts will also be deleted.')) return
    await usersApi.delete(id)
    fetch()
  }

  const handleResetPassword = async () => {
    if (!resetTarget || newPassword.length < 8) return
    await usersApi.resetPassword(resetTarget, newPassword)
    setResetTarget(null)
    setNewPassword('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New User
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">New User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input required value={form.firstName} onChange={set('firstName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input required value={form.lastName} onChange={set('lastName')} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" required value={form.email} onChange={set('email')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={set('password')} className={inputClass} />
            </div>
          </div>
          <div className="w-40">
            <label className={labelClass}>Role</label>
            <select value={form.role} onChange={set('role')} className={inputClass}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {formError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg">
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Contracts</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u._count.contracts}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => { setResetTarget(u.id); setNewPassword('') }}
                        className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        Reset pwd
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
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

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Reset Password</h2>
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleResetPassword}
                disabled={newPassword.length < 8}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
              >
                Reset
              </button>
              <button onClick={() => setResetTarget(null)} className="text-sm text-gray-500 px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
