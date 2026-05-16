// src/components/layout/Navbar.jsx
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Droplets, Bell, LogOut, User, Bot } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import NotificationPanel from '../shared/NotificationPanel'
import BloodTypeChat from '../shared/BloodTypeChat'

const NAV_LINKS = [
  { to: '/campaigns', label: 'Campaigns'      },
  { to: '/myths',     label: 'Myth debunking' },
]

export default function Navbar() {
  const { user, logout }                    = useAuth()
  const { unreadCount, setPanelOpen }       = useNotifications()
  const navigate                            = useNavigate()
  const [menuOpen,  setMenuOpen]            = useState(false)
  const [showChat,  setShowChat]            = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const portalLink = { donor: '/donor', hospital: '/hospital', admin: '/admin' }[user?.role]

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-warm-200">
        <nav className="page-container flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blood-600 flex items-center justify-center">
              <Droplets size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-warm-950 tracking-tight">
              BD<span className="text-blood-600">EN</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors
                   ${isActive ? 'bg-blood-50 text-blood-600' : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100'}`}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">

            {/* AI chatbot button — always visible */}
            <button onClick={() => setShowChat(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                         bg-blood-50 border border-blood-100 text-blood-600
                         hover:bg-blood-100 transition-colors text-xs font-semibold">
              <Bot size={14} /> Know your blood type?
            </button>

            {user ? (
              <>
                <Link to={portalLink}
                  className="text-sm font-medium text-warm-600 hover:text-warm-900
                             px-3 py-2 rounded-lg hover:bg-warm-100 transition-colors">
                  My portal
                </Link>

                {/* Notification bell */}
                <button onClick={() => setPanelOpen(true)}
                  className="relative p-2 rounded-lg text-warm-500 hover:bg-warm-100 hover:text-warm-900 transition-colors">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blood-600
                                     text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User */}
                <div className="flex items-center gap-2 pl-2 border-l border-warm-200">
                  <div className="w-8 h-8 rounded-full bg-blood-100 flex items-center justify-center">
                    <User size={14} className="text-blood-600" />
                  </div>
                  <span className="text-sm font-medium text-warm-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <button onClick={handleLogout}
                    className="p-1.5 rounded-lg text-warm-400 hover:text-blood-600 hover:bg-blood-50 transition-colors"
                    title="Sign out">
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="btn-ghost btn-sm">Sign in</button>
                </Link>
                <Link to="/register">
                  <button className="btn-primary btn-sm">Register as donor</button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg text-warm-600 hover:bg-warm-100 transition-colors"
            onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-warm-200 bg-white animate-fade-in-fast">
            <div className="page-container py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                     ${isActive ? 'bg-blood-50 text-blood-600' : 'text-warm-700 hover:bg-warm-100'}`}>
                  {label}
                </NavLink>
              ))}
              <button onClick={() => { setShowChat(true); setMenuOpen(false) }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blood-600 hover:bg-blood-50 rounded-xl">
                <Bot size={15} /> Know your blood type?
              </button>
              <div className="divider" />
              {user ? (
                <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-warm-600 hover:bg-warm-100 rounded-xl">
                  <LogOut size={15} /> Sign out
                </button>
              ) : (
                <div className="flex gap-2 px-2">
                  <Link to="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <button className="btn-secondary w-full">Sign in</button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
                    <button className="btn-primary w-full">Register</button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Notification panel */}
      <NotificationPanel />

      {/* AI chatbot */}
      {showChat && <BloodTypeChat onClose={() => setShowChat(false)} />}
    </>
  )
}