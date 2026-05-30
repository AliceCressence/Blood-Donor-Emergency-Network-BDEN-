import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle, Bell, CalendarDays, CheckCircle, ChevronLeft, ChevronRight,
  LayoutDashboard, LogOut, Menu, User, Users, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ConfirmModal, DashboardSplash } from '../shared/DataStates'
import ThemeToggle from '../shared/ThemeToggle'

const NAV = [
  { to: '/hospital/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/hospital/emergency', icon: AlertCircle, label: 'Emergency requests' },
  { to: '/hospital/campaigns', icon: CalendarDays, label: 'Campaign manager' },
  { to: '/hospital/donors', icon: Users, label: 'Donor pool' },
]

function HospitalSidebar({ collapsed, setCollapsed, mobile = false, user, onClose, onAskLogout }) {
  const [dropUpOpen, setDropUpOpen] = useState(false)
  const dropUpRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropUpRef.current && !dropUpRef.current.contains(event.target)) setDropUpOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const width = mobile ? 'w-full' : collapsed ? 'w-[76px]' : 'w-[264px]'
  const facility = user?.facilityName || user?.name || 'Hospital'

  return (
    <aside className={`flex flex-col border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-warm-950/90 ${mobile ? 'h-full' : 'fixed left-4 top-4 bottom-6 z-[600] rounded-[28px]'} ${width} transition-[width,transform,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}>
      <div className={`flex items-center px-3 py-4 border-b border-warm-100/80 dark:border-white/10 ${collapsed && !mobile ? 'justify-center' : 'justify-between'}`}>
        <Link to="/hospital/dashboard" onClick={onClose} className={`flex min-w-0 items-center gap-2 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <img src="/favicon.svg" alt="BDEN" className="h-10 w-10 rounded-2xl shadow-sm" />
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <span className="block font-display text-lg font-bold leading-tight text-blood-600">BDEN</span>
              <span className="block text-[10px] uppercase tracking-wide text-warm-400">Hospital portal</span>
            </div>
          )}
        </Link>
        {mobile ? (
          <button onClick={onClose} className="rounded-lg p-1.5 text-warm-500 hover:bg-warm-100"><X size={18} /></button>
        ) : !collapsed && (
          <button onClick={() => setCollapsed(true)} className="rounded-full p-2 text-warm-500 transition-colors hover:bg-warm-100 hover:text-blood-600" title="Collapse sidebar">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {collapsed && !mobile && (
        <button onClick={() => setCollapsed(false)} className="mx-auto mb-1 mt-3 rounded-full bg-warm-50 p-2 text-warm-500 transition-colors hover:bg-blood-50 hover:text-blood-600" title="Expand sidebar">
          <ChevronRight size={18} />
        </button>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            title={collapsed && !mobile ? label : ''}
            className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed && !mobile ? 'mx-auto h-12 w-12 justify-center px-0 py-0' : ''} ${isActive ? 'bg-blood-600 text-white font-semibold shadow-lg shadow-blood-600/20' : 'text-warm-700 hover:translate-x-0.5 hover:bg-blood-50 hover:text-blood-600 dark:text-warm-400 dark:hover:bg-white/10 dark:hover:text-white'}`}
          >
            <Icon size={20} />
            {(!collapsed || mobile) && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <div className={`flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-600/10 px-3 py-2.5 ${collapsed && !mobile ? 'justify-center px-2' : ''}`}>
          <CheckCircle size={14} className="shrink-0 text-teal-500" />
          {(!collapsed || mobile) && (
            <div>
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Verified facility</p>
              <p className="text-xs text-warm-500">Admin approved</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative border-t border-warm-100/80 p-3 dark:border-white/10" ref={dropUpRef}>
        {dropUpOpen && (
          <div className={`absolute bottom-full mb-3 overflow-hidden rounded-2xl border border-warm-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-warm-950/95 ${collapsed && !mobile ? 'left-[76px] ml-3 w-56' : 'left-3 right-3'}`}>
            <div className="px-4 py-3 border-b border-warm-100 dark:border-white/10">
              <p className="truncate text-sm font-semibold text-warm-900">{facility}</p>
              <p className="truncate text-xs text-warm-500">{user?.email || user?.city || 'Hospital account'}</p>
            </div>
            <Link to="/hospital/profile" onClick={() => { setDropUpOpen(false); onClose?.() }} className="flex items-center gap-3 px-4 py-3 text-sm text-warm-700 transition-colors hover:bg-blood-50 hover:text-blood-600 dark:text-warm-300 dark:hover:bg-white/10">
              <User size={16} /> <span className="font-medium">View profile</span>
            </Link>
            <button onClick={() => { setDropUpOpen(false); onAskLogout() }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-warm-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-warm-300 dark:hover:bg-red-950/40">
              <LogOut size={16} /> <span className="font-medium">Sign out</span>
            </button>
          </div>
        )}
        <button onClick={() => setDropUpOpen(v => !v)} className={`flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-warm-100 dark:hover:bg-white/10 ${collapsed && !mobile ? 'justify-center' : ''} ${dropUpOpen ? 'bg-warm-100 dark:bg-white/10' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blood-100">
            <span className="text-sm font-bold text-blood-600">{facility.charAt(0).toUpperCase()}</span>
          </div>
          {(!collapsed || mobile) && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-warm-800 dark:text-white">{facility}</p>
                <p className="truncate text-xs text-warm-500">{user?.city || 'Facility profile'}</p>
              </div>
              <ChevronLeft size={14} className={`shrink-0 text-warm-400 transition-transform ${dropUpOpen ? 'rotate-90' : '-rotate-90'}`} />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

export default function HospitalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [showSplash, setShowSplash] = useState(location.pathname.endsWith('/dashboard'))

  useEffect(() => {
    if (!location.pathname.endsWith('/dashboard')) return undefined
    const start = setTimeout(() => setShowSplash(true), 0)
    const timer = setTimeout(() => setShowSplash(false), 1150)
    return () => {
      clearTimeout(start)
      clearTimeout(timer)
    }
  }, [location.pathname])

  const handleLogout = () => {
    setShowLogout(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-[#15130f]">
      <DashboardSplash show={showSplash} />
      <div className="hidden lg:block">
        <HospitalSidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} onAskLogout={() => setShowLogout(true)} />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-[900] flex lg:hidden">
          <div className="w-[280px] p-4"><HospitalSidebar mobile user={user} onClose={() => setSidebarOpen(false)} onAskLogout={() => setShowLogout(true)} /></div>
          <button className="flex-1 bg-black/45" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />
        </div>
      )}
      <main className={`min-h-screen transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? 'lg:pl-[108px]' : 'lg:pl-[296px]'}`}>
        <header className="sticky top-4 z-40 mx-4 flex h-16 items-center justify-between rounded-[24px] border border-white/70 bg-white/85 px-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-warm-950/80 lg:mr-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-warm-500 hover:bg-warm-100 lg:hidden"><Menu size={20} /></button>
          <div className="hidden items-center gap-2 lg:flex">
            <img src="/favicon.svg" alt="BDEN" className="h-7 w-7 rounded-lg" />
            <span className="text-xs font-semibold uppercase tracking-widest text-warm-500">Hospital workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <button className="relative rounded-lg p-2 text-warm-500 transition-colors hover:bg-warm-100 dark:hover:bg-white/10">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-teal-500" />
            </button>
          </div>
        </header>
        <div className="p-4 pt-8 lg:p-8"><Outlet /></div>
      </main>
      <ConfirmModal
        open={showLogout}
        title="Heading out?"
        description="Just checking before we sign you out of the hospital workspace. Your current data will stay right where it is."
        confirmLabel="Yes, sign out"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  )
}
