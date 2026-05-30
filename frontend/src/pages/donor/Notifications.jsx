import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Bell, Calendar, Filter, Info, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { notificationApi } from '../../services/app.service'
import { CardShimmer, ConfirmModal, EmptyState, ErrorState } from '../../components/shared/DataStates'

const TYPE_CONFIG = {
  emergency: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
  campaign: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  system: { icon: Info, color: 'text-neutral-500', bg: 'bg-neutral-50', dot: 'bg-neutral-400' },
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'campaign', label: 'Campaigns' },
  { id: 'system', label: 'System' },
]

function formatTime(date) {
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  if (day < 7) return `${day}d ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function getWeekLabel(date) {
  const day = 86400000
  const diff = Date.now() - date.getTime()
  if (diff < day) return 'Today'
  if (diff < day * 2) return 'Yesterday'
  if (diff < day * 7) return 'This week'
  return 'Earlier'
}

function groupNotifications(notifications) {
  const groups = []
  const unread = notifications.filter(n => !n.read)
  if (unread.length) groups.push({ label: 'Unread', items: unread })
  const readMap = {}
  notifications.filter(n => n.read).forEach(n => {
    const label = getWeekLabel(n.date)
    readMap[label] = [...(readMap[label] || []), n]
  })
  Object.entries(readMap).forEach(([label, items]) => groups.push({ label, items }))
  return groups
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const userId = user?.id

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const data = await notificationApi.list(userId)
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    const timer = setTimeout(() => { load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)
  const groups = groupNotifications(filtered)

  const markAllRead = async () => {
    await notificationApi.markAllRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(count => Math.max(0, count - 1))
    notificationApi.markRead(id).catch(() => load())
  }

  const hideNotification = () => {
    setNotifications(prev => prev.filter(n => n.id !== deleteTarget?.id))
    setDeleteTarget(null)
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto space-y-3">{[0, 1, 2].map(i => <CardShimmer key={i} rows={2} />)}</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {error && <ErrorState message={error} onRetry={load} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {unreadCount > 0 ? <><span className="font-semibold text-blood-600">{unreadCount} unread</span> notification{unreadCount > 1 ? 's' : ''}</> : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-blood-600 hover:text-blood-800 transition-colors">Mark all read</button>}
      </div>

      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
        {FILTER_TABS.map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${filter === tab.id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications here" description="Emergency alerts, campaign updates, and system messages will appear in this same timeline." />
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">{group.label}</span>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>
              <div className="space-y-2">
                {group.items.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                  const Icon = cfg.icon
                  return (
                    <div key={notif.id} onClick={() => markRead(notif.id)} className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${notif.read ? 'border-neutral-100' : 'border-neutral-200 shadow-sm'}`}>
                      <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <Icon size={16} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold ${notif.read ? 'text-neutral-700' : 'text-neutral-900'}`}>{notif.title}</p>
                            {!notif.read && <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-1`} />}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{notif.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-neutral-400">{formatTime(notif.date)}</span>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(notif) }} className="p-1 rounded-lg text-neutral-300 hover:bg-red-50 hover:text-red-600 transition-colors" title="Hide notification">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center pb-4">
        <button className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1.5 mx-auto">
          <Filter size={12} />
          Manage notification preferences
        </button>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title="Hide this notification?"
        description="This only removes it from your current view. Important emergency updates can still come back if the hospital changes the request."
        confirmLabel="Hide it"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={hideNotification}
      />
    </div>
  )
}
