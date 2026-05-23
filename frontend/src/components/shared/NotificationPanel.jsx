// src/components/shared/NotificationPanel.jsx
import { useNotifications } from '../../context/NotificationContext'
import { X, Bell, AlertCircle, CalendarDays, Info, CheckCheck, Trash2 } from 'lucide-react'

const TYPE_CONFIG = {
  emergency: { icon: AlertCircle,  bg: 'bg-blood-50',  border: 'border-blood-200',  icon_color: 'text-blood-600',  dot: 'bg-blood-500' },
  campaign:  { icon: CalendarDays, bg: 'bg-teal-50',   border: 'border-teal-200',   icon_color: 'text-teal-600',   dot: 'bg-teal-500'  },
  system:    { icon: Info,         bg: 'bg-blue-50',   border: 'border-blue-200',   icon_color: 'text-blue-600',   dot: 'bg-blue-500'  },
}

export default function NotificationPanel() {
  const { notifications, unreadCount, panelOpen, setPanelOpen, markAllRead, markRead, dismiss } = useNotifications()

  if (!panelOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
           onClick={() => setPanelOpen(false)} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 z-50 bg-white shadow-2xl
                      flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-warm-700" />
            <h2 className="font-display font-semibold text-warm-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blood-600 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs text-warm-500 hover:text-warm-800 transition-colors">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            <button onClick={() => setPanelOpen(false)}
              className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mb-3">
                <Bell size={24} className="text-warm-300" />
              </div>
              <p className="font-medium text-warm-600 text-sm">No notifications</p>
              <p className="text-xs text-warm-400 mt-1">You're all caught up!</p>
            </div>
          )}

          <div className="divide-y divide-warm-100">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
              return (
                <div key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-warm-50
                    ${!n.read ? 'bg-warm-50/80' : ''}`}>

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                                   border ${cfg.bg} ${cfg.border}`}>
                    <cfg.icon size={15} className={cfg.icon_color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-snug
                        ${!n.read ? 'text-warm-900' : 'text-warm-600'}`}>
                        {n.title}
                      </p>
                      <button
                        onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                        className="p-0.5 text-warm-300 hover:text-warm-500 flex-shrink-0 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-xs text-warm-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {!n.read && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                      <span className="text-xs text-warm-400">{n.time}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-warm-200 flex-shrink-0">
          <p className="text-xs text-warm-400 text-center">
            Emergency alerts are sent instantly when a compatible request is posted nearby.
          </p>
        </div>
      </div>
    </>
  )
}