// src/pages/donor/Notifications.jsx
import { useState } from 'react'
import { Bell, AlertTriangle, Calendar, CheckCircle, Info, Trash2, Filter } from 'lucide-react'

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'emergency',
    title: 'Emergency Request Near You',
    message: 'Hôpital Central Yaoundé urgently needs O− blood. You are 2.1 km away and eligible.',
    time: '12 minutes ago',
    read: false,
    action: 'View request',
  },
  {
    id: 2,
    type: 'emergency',
    title: 'Critical Blood Request',
    message: 'Clinique de la Cité Verte needs O− blood for post-operative care. 2 units required.',
    time: '1 hour ago',
    read: false,
    action: 'View request',
  },
  {
    id: 3,
    type: 'eligible',
    title: 'You Can Donate Again!',
    message: 'It has been 56 days since your last donation. You are now eligible to donate again.',
    time: '2 days ago',
    read: true,
    action: 'Find campaign',
  },
  {
    id: 4,
    type: 'campaign',
    title: 'New Campaign in Your Area',
    message: 'World Blood Donor Day campaign is happening at CHU Yaoundé on June 14. Register now.',
    time: '3 days ago',
    read: true,
    action: 'View campaign',
  },
  {
    id: 5,
    type: 'system',
    title: 'Donation Verified',
    message: 'Your donation on March 15 at Hôpital Central Yaoundé has been verified and recorded.',
    time: '1 week ago',
    read: true,
  },
  {
    id: 6,
    type: 'system',
    title: 'Profile Updated',
    message: 'Your blood type (O−) has been confirmed by the hospital lab. Your donor card is now fully active.',
    time: '2 weeks ago',
    read: true,
  },
  {
    id: 7,
    type: 'campaign',
    title: 'Campaign Reminder',
    message: 'The Mvog-Mbi blood drive is tomorrow at 9 AM. You registered interest for this event.',
    time: '3 weeks ago',
    read: true,
    action: 'View campaign',
  },
]

const TYPE_CONFIG = {
  emergency: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    dot: 'bg-red-500',
  },
  eligible: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    dot: 'bg-emerald-500',
  },
  campaign: {
    icon: Calendar,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    dot: 'bg-blue-500',
  },
  system: {
    icon: Info,
    color: 'text-neutral-500',
    bg: 'bg-neutral-50',
    border: 'border-neutral-100',
    dot: 'bg-neutral-400',
  },
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'campaign', label: 'Campaigns' },
  { id: 'system', label: 'System' },
]

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter)

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {unreadCount > 0
              ? <><span className="font-semibold text-blood-600">{unreadCount} unread</span> notifications</>
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

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-neutral-400">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications here.</p>
          </div>
        )}
        {filtered.map(notif => {
          const cfg = TYPE_CONFIG[notif.type]
          const Icon = cfg.icon
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              className={`
                relative bg-white rounded-2xl border p-4 cursor-pointer
                hover:shadow-md transition-all duration-150 group
                ${notif.read ? 'border-neutral-100' : `border-l-4 ${cfg.border} border-l-${notif.type === 'emergency' ? 'red' : notif.type === 'eligible' ? 'emerald' : notif.type === 'campaign' ? 'blue' : 'neutral'}-500`}
              `}
              style={!notif.read ? { borderLeftColor: notif.type === 'emergency' ? '#ef4444' : notif.type === 'eligible' ? '#10b981' : notif.type === 'campaign' ? '#3b82f6' : '#9ca3af' } : {}}
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
                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.read && (
                        <span className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-300 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-neutral-400">{notif.time}</span>
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

      {/* Notification settings link */}
      <div className="text-center">
        <button className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex items-center gap-1.5 mx-auto">
          <Filter size={12} />
          Manage notification preferences
        </button>
      </div>
    </div>
  )
}
