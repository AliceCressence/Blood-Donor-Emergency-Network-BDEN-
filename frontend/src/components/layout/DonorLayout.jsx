// frontend/src/components/layout/DonorLayout.jsx
import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  MapPin,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { DashboardSplash } from '../shared/DataStates'
import ThemeToggle from '../shared/ThemeToggle'

const navItems = [
  { path: '/donor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/donor/card',      icon: CreditCard,      label: 'My Card'   },
  { path: '/donor/map',       icon: MapPin,           label: 'Nearby Needs'},
  { path: '/donor/notifications', icon: Bell,         label: 'Notifications' },
]

// ─── Sign-out confirmation modal ─────────────────────────────────────────────
function SignOutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-scale-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <LogOut size={24} className="text-red-500" />
        </div>

        <h2 className="font-display text-xl font-bold text-neutral-900 text-center mb-2">
          Heading out already?
        </h2>
        <p className="text-sm text-neutral-500 text-center leading-relaxed mb-7">
          No worries if it was an accident — happens to the best of us.
          Just checking before we log you out!
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Stay in
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            Yes, sign out
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export default function DonorLayout() {
  const [collapsed, setCollapsed]       = useState(false)
  const [dropUpOpen, setDropUpOpen]     = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const dropUpRef                       = useRef(null)
  const { user, logout }                = useAuth()
  const navigate                        = useNavigate()
  const location                        = useLocation()
  const isMapView                       = location.pathname === '/donor/map'
  const isDashboard                     = location.pathname.endsWith('/dashboard')
  const [showSplash, setShowSplash]     = useState(isDashboard)

  // Close drop-up on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropUpRef.current && !dropUpRef.current.contains(e.target)) {
        setDropUpOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isDashboard) return
    const start = setTimeout(() => setShowSplash(true), 0)
    const timer = setTimeout(() => setShowSplash(false), 1150)
    return () => {
      clearTimeout(start)
      clearTimeout(timer)
    }
  }, [isDashboard])

  const handleLogoutConfirmed = () => {
    setShowSignOutModal(false)
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <div className="min-h-screen bg-warm-50">

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div
          className={`
            fixed left-4 top-4 bottom-4 bg-white/90 border border-white/70 shadow-2xl
            backdrop-blur-xl transition-[width,transform,border-radius,box-shadow] duration-500
            ease-[cubic-bezier(0.22,1,0.36,1)] z-[600] flex flex-col rounded-[28px]
            ${collapsed
              ? 'w-[76px]'
              : 'w-[264px]'
            }
          `}
        >
          {/* Logo + collapse toggle */}
          <div className={`flex items-center px-3 py-4 border-b border-warm-100/80 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <Link to="/donor/dashboard" className={`flex items-center gap-2 min-w-0 ${collapsed ? 'justify-center' : ''}`}>
              <img src="/favicon.svg" alt="BDEN" className="w-10 h-10 rounded-2xl shadow-sm" />
              {!collapsed && (
                <div className="min-w-0">
                  <span className="block font-display font-bold text-lg leading-tight text-blood-600">BDEN</span>
                  <span className="block text-[10px] uppercase tracking-wide text-warm-400">Donor portal</span>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-2 rounded-full hover:bg-warm-100 hover:text-blood-600 transition-colors text-warm-500 cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>

          {/* Expand button when collapsed — sits at the top of nav area */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="mx-auto mt-3 mb-1 p-2 rounded-full bg-warm-50 hover:bg-blood-50 hover:text-blood-600 transition-colors text-warm-500 cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {/* Nav items */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : ''}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-2xl
                  transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group
                  ${collapsed ? 'justify-center w-12 h-12 mx-auto px-0 py-0' : ''}
                  ${isActive(item.path)
                    ? 'bg-blood-600 text-white font-semibold shadow-lg shadow-blood-600/20'
                    : 'text-warm-700 hover:bg-blood-50 hover:text-blood-600 hover:translate-x-0.5'
                  }
                `}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </nav>

          {/* ── Drop-up: user info + profile + sign out ─────────────────── */}
          <div className="border-t border-warm-100/80 p-3 flex-shrink-0 relative" ref={dropUpRef}>
            {/* Drop-up menu — appears above the trigger */}
            {dropUpOpen && (
              <div
                className={`
                  absolute bottom-full mb-3 bg-white/95 border border-warm-200 rounded-2xl
                  shadow-2xl overflow-hidden transition-all duration-300 backdrop-blur-xl
                  ${collapsed ? 'left-[76px] ml-3 w-52' : 'left-3 right-3'}
                `}
              >
                <Link
                  to="/donor/profile"
                  onClick={() => setDropUpOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-warm-700 hover:bg-blood-50 hover:text-blood-600 transition-colors"
                >
                  <User size={16} className="flex-shrink-0" />
                  <span className="font-medium">View profile</span>
                </Link>
                <div className="h-px bg-warm-100 mx-3" />
                <button
                  onClick={() => { setDropUpOpen(false); setShowSignOutModal(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-warm-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={16} className="flex-shrink-0" />
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            )}

            {/* Trigger button — user avatar + info */}
            <button
              onClick={() => setDropUpOpen(v => !v)}
              className={`
                w-full flex items-center gap-2 p-2 rounded-xl
                hover:bg-warm-100 transition-all duration-300 cursor-pointer
                ${collapsed ? 'justify-center' : ''}
                ${dropUpOpen ? 'bg-warm-100' : ''}
              `}
              title={collapsed ? (user?.name || 'Account') : ''}
            >
              <div className="w-8 h-8 rounded-full bg-blood-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blood-600 font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'D'}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-warm-800 truncate">
                    {user?.name || user?.email?.split('@')[0] || 'Donor'}
                  </p>
                  <p className="text-xs text-warm-500 truncate">
                    {user?.bloodType || 'Blood type not set'}
                  </p>
                </div>
              )}
              {!collapsed && (
                <ChevronLeft
                  size={14}
                  className={`text-warm-400 transition-transform duration-200 flex-shrink-0 ${
                    dropUpOpen ? 'rotate-90' : '-rotate-90'
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main
          className={`min-h-screen overflow-auto transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isMapView ? '' : collapsed ? 'pl-[108px]' : 'pl-[296px]'
          }`}
        >
          <div className={isMapView ? 'h-full' : 'p-6 h-full'}>
            {!isMapView && <div className="mb-4 flex justify-end"><ThemeToggle /></div>}
            <Outlet context={{ collapsed }} />
          </div>
        </main>
      </div>

      {/* Sign-out modal */}
      <DashboardSplash show={showSplash} />
      {showSignOutModal && (
        <SignOutModal
          onConfirm={handleLogoutConfirmed}
          onCancel={() => setShowSignOutModal(false)}
        />
      )}
    </>
  )
}
