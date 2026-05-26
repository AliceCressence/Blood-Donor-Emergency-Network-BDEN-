// src/components/shared/NotificationPanel.jsx
// Used by the Navbar bell icon — shows recent notifications as a dropdown popup.
// It stays open on click and closes on outside click or the X button.

import { useRef, useEffect } from 'react'
import { Bell, AlertTriangle, Calendar, CheckCircle, Info, X, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'

const TYPE_CONFIG = {
  emergency: { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50'     },
  eligible:  { icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  campaign:  { icon: Calendar,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
  system:    { icon: Info,          color: 'text-neutral-500', bg: 'bg-neutral-50' },
}

export default function NotificationPanel({ isOpen, onClose, anchorRef }) {
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications()
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e) {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  // Show only the 5 most recent
  const recent = [...(notifications || [])].slice(0, 5)

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-neutral-500" />
          <span className="text-sm font-bold text-neutral-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blood-600 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-blood-600 hover:text-blood-800 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notification items */}
      <div className="divide-y divide-neutral-50 max-h-[360px] overflow-y-auto">
        {recent.length === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            <Bell size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">You're all caught up!</p>
          </div>
        ) : (
          recent.map(notif => {
            const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
            const Icon = cfg.icon
            return (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors ${
                  !notif.read ? 'bg-blood-50/30' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={14} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1">
                    <p className={`text-xs font-semibold leading-snug flex-1 ${
                      notif.read ? 'text-neutral-700' : 'text-neutral-900'
                    }`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blood-500 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer — link to full notifications page */}
      <div className="border-t border-neutral-100 px-4 py-2.5">
        <Link
          to="/donor/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blood-600 hover:text-blood-800 transition-colors"
        >
          View all notifications
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}