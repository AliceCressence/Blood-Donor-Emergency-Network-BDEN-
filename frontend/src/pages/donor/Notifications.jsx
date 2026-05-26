// src/pages/donor/Notifications.jsx
import { useState } from 'react'
import { Bell, AlertTriangle, Calendar, CheckCircle, Info, Filter } from 'lucide-react'

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'emergency',
    title: 'Emergency Request Near You',
    message: 'Hôpital Central Yaoundé urgently needs O⁻ blood. You are 2.1 km away and eligible.',
    date: new Date(Date.now() - 1000 * 60 * 12), // 12 min ago
    read: false,
    action: 'View request',
  },
  {
    id: 2,
    type: 'emergency',
    title: 'Critical Blood Request',
    message: 'Clinique de la Cité Verte needs O⁻ blood for post-operative care. 2 units required.',
    date: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: false,
    action: 'View request',
  },
  {
    id: 3,
    type: 'eligible',
    title: 'You Can Donate Again!',
    message: 'It has been 56 days since your last donation. You are now eligible to donate again.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    action: 'Find campaign',
  },
  {
    id: 4,
    type: 'campaign',
    title: 'New Campaign in Your Area',
    message: 'World Blood Donor Day campaign is happening at CHU Yaoundé on June 14. Register now.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    read: true,
    action: 'View campaign',
  },
  {
    id: 5,
    type: 'system',
    title: 'Donation Verified',
    message: 'Your donation on March 15 at Hôpital Central Yaoundé has been verified and recorded.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 days ago
    read: true,
  },
  {
    id: 6,
    type: 'system',
    title: 'Profile Updated',
    message: 'Your blood type (O⁻) has been confirmed by the hospital lab. Your donor card is now fully active.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
    read: true,
  },
  {
    id: 7,
    type: 'campaign',
    title: 'Campaign Reminder',
    message: 'The Mvog-Mbi blood drive is tomorrow at 9 AM. You registered interest for this event.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 3 weeks ago
    read: true,
    action: 'View campaign',
  },
]

const TYPE_CONFIG = {
  emergency: { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50',     dot: 'bg-red-500'     },
  eligible:  { icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  campaign:  { icon: Calendar,      color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-500'    },
  system:    { icon: Info,          color: 'text-neutral-500', bg: 'bg-neutral-50', dot: 'bg-neutral-400' },
}

const FILTER_TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'emergency', label: 'Emergency' },
  { id: 'campaign',  label: 'Campaigns' },
  { id: 'system',    label: 'System'    },
]

// ─── Week grouping helpers ────────────────────────────────────────────────────
function getWeekLabel(date) {
  const now   = new Date()
  const day   = 1000 * 60 * 60 * 24
  const week  = day * 7
  const diff  = now - date

  if (diff < day)       return 'Today'
  if (diff < day * 2)   return 'Yesterday'
  if (diff < week)      return 'This week'
  if (diff < week * 2)  return 'Last week'

  // Older: show "Week of Mon DD MMM"
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay() + 1) // Monday
  return `Week of ${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
}

function groupNotifications(notifications) {
  // Unread always at top as their own group
  const unread = notifications.filter(n => !n.read)
  const read   = notifications.filter(n =>  n.read)

  const groups = []

  if (unread.length) {
    groups.push({ label: 'Unread', items: unread })
  }

  // Group the read ones by week label, preserving order
  const weekMap = {}
  const weekOrder = []
  for (const n of read) {
    const label = getWeekLabel(n.date)
    if (!weekMap[label]) {
      weekMap[label] = []
      weekOrder.push(label)
    }
    weekMap[label].push(n)
  }
  for (const label of weekOrder) {
    groups.push({ label, items: weekMap[label] })
  }

  return groups
}

function formatTime(date) {
  const diff = Date.now() - date
  const min  = Math.floor(diff / 60000)
  const hr   = Math.floor(diff / 3600000)
  const day  = Math.floor(diff / 86400000)

  if (min < 1)   return 'Just now'
  if (min < 60)  return `${min}m ago`
  if (hr  < 24)  return `${hr}h ago`
  if (day < 7)   return `${day}d ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [filter, setFilter]               = useState('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter)

  const groups = groupNotifications(filtered)

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const markRead = (id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {unreadCount > 0
              ? <><span className="font-semibold text-blood-600">{unreadCount} unread</span> notification{unreadCount > 1 ? 's' : ''}</>
              : 'All caught up!'
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-blood-600 hover:text-blood-800 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              filter === tab.id
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grouped notification list */}
      {groups.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Bell size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No notifications here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              {/* Week group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {group.items.map(notif => {
                  const cfg  = TYPE_CONFIG[notif.type]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      className={`
                        bg-white rounded-2xl border p-4 cursor-pointer
                        hover:shadow-md transition-all duration-150
                        ${notif.read ? 'border-neutral-100' : 'border-neutral-200 shadow-sm'}
                      `}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                          <Icon size={16} className={cfg.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold ${notif.read ? 'text-neutral-700' : 'text-neutral-900'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0 mt-1`} />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-neutral-400">
                              {formatTime(notif.date)}
                            </span>
                            {notif.action && (
                              <button className={`text-xs font-semibold ${cfg.color} hover:opacity-80 transition-opacity`}>
                                {notif.action} →
                              </button>
                            )}
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

      {/* Footer */}
      <div className="text-center pb-4">
        <button className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1.5 mx-auto">
          <Filter size={12} />
          Manage notification preferences
        </button>
      </div>
    </div>
  )
}