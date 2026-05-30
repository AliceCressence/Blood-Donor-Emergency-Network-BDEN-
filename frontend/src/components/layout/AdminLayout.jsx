import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity, ChevronLeft, ChevronRight, Flag, LayoutDashboard,
  LogOut, Menu, Shield, ShieldCheck, User, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ConfirmModal } from '../shared/DataStates'
import ThemeToggle from '../shared/ThemeToggle'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/verification', icon: ShieldCheck, label: 'Facility Verification' },
  { to: '/admin/moderation', icon: Flag, label: 'Content Moderation' },
  { to: '/admin/health', icon: Activity, label: 'Platform Health' },
]

function Sidebar({ collapsed, setCollapsed, mobile = false, onClose, user, onAskLogout }) {
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
  return (
    <aside className={`flex flex-col border border-white/70 bg-white/90 text-warm-900 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95 dark:text-white ${mobile ? 'h-full' : 'fixed left-4 top-4 bottom-6 z-[600] rounded-[28px]'} ${width} transition-[width,transform,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}>
      <div className={`flex items-center border-b border-warm-100/80 px-3 py-4 dark:border-white/10 ${collapsed && !mobile ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex min-w-0 items-center gap-2 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <img src="/favicon.svg" alt="BDEN" className="h-10 w-10 rounded-2xl shadow-sm" />
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <span className="block font-display text-lg font-bold leading-tight text-blood-600">BDEN</span>
              <span className="block text-[10px] uppercase tracking-wide text-warm-400 dark:text-white/35">Admin panel</span>
            </div>
          )}
        </div>
        {mobile ? (
          <button className="rounded-lg p-1.5 text-warm-500 hover:bg-warm-100 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white" onClick={onClose}><X size={18} /></button>
        ) : !collapsed && (
          <button onClick={() => setCollapsed(true)} className="rounded-full p-2 text-warm-500 transition-colors hover:bg-warm-100 hover:text-blood-600 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white" title="Collapse sidebar">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {collapsed && !mobile && (
        <button onClick={() => setCollapsed(false)} className="mx-auto mb-1 mt-3 rounded-full bg-warm-50 p-2 text-warm-500 transition-colors hover:bg-blood-50 hover:text-blood-600 dark:bg-white/5 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white" title="Expand sidebar">
          <ChevronRight size={18} />
        </button>
      )}

      <div className={`border-b border-warm-100/80 px-3 py-4 dark:border-white/10 ${collapsed && !mobile ? 'text-center' : ''}`}>
        <div className={`flex items-center gap-3 rounded-2xl bg-warm-50 p-3 dark:bg-white/5 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blood-400/30 bg-blood-600/20">
            <Shield size={15} className="text-blood-300" />
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-warm-900 dark:text-white">{user?.name || user?.email || 'Admin'}</p>
              <p className="text-xs text-warm-500 dark:text-white/35">Platform administrator</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            title={collapsed && !mobile ? label : ''}
            className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed && !mobile ? 'mx-auto h-12 w-12 justify-center px-0 py-0' : ''} ${isActive ? 'bg-blood-600 text-white shadow-lg shadow-blood-600/20' : 'text-warm-700 hover:translate-x-0.5 hover:bg-blood-50 hover:text-blood-600 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white'}`}
          >
            <Icon size={20} />
            {(!collapsed || mobile) && <span className="flex-1">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="relative border-t border-warm-100/80 p-3 dark:border-white/10" ref={dropUpRef}>
        {dropUpOpen && (
          <div className={`absolute bottom-full mb-3 overflow-hidden rounded-2xl border border-warm-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95 ${collapsed && !mobile ? 'left-[76px] ml-3 w-60' : 'left-3 right-3'}`}>
            <div className="px-4 py-3 border-b border-warm-100 dark:border-white/10">
              <p className="truncate text-sm font-semibold text-warm-900 dark:text-white">{user?.name || 'BDEN admin'}</p>
              <p className="truncate text-xs text-warm-500">{user?.email || 'Platform account'}</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-warm-700 dark:text-warm-300">
              <User size={16} /> <span className="font-medium">Platform administrator</span>
            </div>
            <button onClick={() => { setDropUpOpen(false); onAskLogout() }} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-warm-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-warm-300 dark:hover:bg-red-950/40">
              <LogOut size={16} /> <span className="font-medium">Sign out</span>
            </button>
          </div>
        )}
        <button onClick={() => setDropUpOpen(v => !v)} className={`flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-warm-100 dark:hover:bg-white/10 ${collapsed && !mobile ? 'justify-center' : ''} ${dropUpOpen ? 'bg-warm-100 dark:bg-white/10' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blood-100">
            <Shield size={15} className="text-blood-600" />
          </div>
          {(!collapsed || mobile) && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-warm-800 dark:text-white">{user?.name || 'Admin'}</p>
                <p className="truncate text-xs text-warm-500">{user?.email || 'Account options'}</p>
              </div>
              <ChevronLeft size={14} className={`shrink-0 text-warm-400 transition-transform ${dropUpOpen ? 'rotate-90' : '-rotate-90'}`} />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    setShowLogout(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-warm-50 text-warm-950 dark:bg-neutral-950 dark:text-white">
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} onAskLogout={() => setShowLogout(true)} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[900] flex lg:hidden">
          <div className="w-[280px] p-4"><Sidebar mobile user={user} onClose={() => setSidebarOpen(false)} onAskLogout={() => setShowLogout(true)} /></div>
          <button className="flex-1 bg-black/70" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />
        </div>
      )}

      <main className={`min-h-screen transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? 'lg:pl-[108px]' : 'lg:pl-[296px]'}`}>
        <header className="sticky top-4 z-40 mx-4 flex h-16 items-center gap-4 rounded-[24px] border border-white/70 bg-white/85 px-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/85 lg:mr-4 lg:px-8">
          <button className="rounded-lg p-2 text-warm-500 hover:bg-warm-100 dark:text-white/55 dark:hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <ThemeToggle compact />
          <span className="text-xs font-mono text-warm-400 dark:text-white/35">BDEN Admin v1.0</span>
        </header>
        <div className="p-4 pt-8 lg:p-8">
          <Outlet />
        </div>
      </main>

      <ConfirmModal
        open={showLogout}
        title="Sign out of admin?"
        description="You will leave the admin panel and need to sign in again before reviewing facilities or platform health."
        confirmLabel="Yes, sign out"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  )
}
