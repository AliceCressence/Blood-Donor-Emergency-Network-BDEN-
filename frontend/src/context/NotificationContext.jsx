// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificationContext = createContext(null)

const INITIAL_NOTIFICATIONS = [
  {
    id: 1, type: 'emergency', read: false,
    title: 'Emergency nearby — O− needed',
    body: 'Hôpital Central de Yaoundé needs O− blood urgently. 3.2 km from you.',
    time: '2 min ago', timestamp: Date.now() - 120000,
  },
  {
    id: 2, type: 'campaign', read: false,
    title: 'New campaign: CHU de Yaoundé',
    body: 'A donation drive on May 20 is looking for O+ and A+ donors. Free malaria screening offered.',
    time: '1 hr ago', timestamp: Date.now() - 3600000,
  },
  {
    id: 3, type: 'system', read: true,
    title: 'Donation verified ✓',
    body: 'Your Feb 10 donation at Hôpital Central has been verified and added to your donor card.',
    time: '2 days ago', timestamp: Date.now() - 172800000,
  },
  {
    id: 4, type: 'campaign', read: true,
    title: 'Campaign reminder: Fondation Chantal Biya',
    body: 'The donation drive you saved is tomorrow — May 25. Don\'t forget your ID.',
    time: '3 days ago', timestamp: Date.now() - 259200000,
  },
]

// Simulated incoming emergency alerts
const SIMULATED_ALERTS = [
  {
    type: 'emergency',
    title: 'New emergency — A+ needed',
    body: 'Centre Hospitalier Universitaire urgently needs A+ blood. 5.1 km from you.',
  },
  {
    type: 'campaign',
    title: 'Campaign starting soon',
    body: 'Hôpital Général de Yaoundé opens registration for their June drive today.',
  },
]

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [panelOpen,     setPanelOpen]     = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const dismiss = useCallback((id) => {
    setNotifications(ns => ns.filter(n => n.id !== id))
  }, [])

  // Simulate incoming notification after 30s for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      const alert = SIMULATED_ALERTS[Math.floor(Math.random() * SIMULATED_ALERTS.length)]
      setNotifications(ns => [{
        id: Date.now(),
        ...alert,
        read: false,
        time: 'Just now',
        timestamp: Date.now(),
      }, ...ns])
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      panelOpen, setPanelOpen,
      markAllRead, markRead, dismiss,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}