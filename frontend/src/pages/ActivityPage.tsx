import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { activityApi, ActivityLog } from '../api/activity'

const ACTION_CONFIG = {
  CREATE: { label: 'Created', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' },
  UPDATE: { label: 'Updated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  DELETE: { label: 'Deleted', color: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' },
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    activityApi.list(100).then((res) => setLogs(res.data.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recent actions across contracts</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No activity yet</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => {
              const cfg = ACTION_CONFIG[log.action]
              return (
                <li key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{log.userFullName}</span>
                      {' '}
                      {cfg.label.toLowerCase()} {log.entityType.toLowerCase()}{' '}
                      {log.action !== 'DELETE' ? (
                        <Link
                          to={`/contracts/${log.entityId}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {log.entityTitle}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-500 line-through">{log.entityTitle}</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(log.createdAt)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
