// src/components/layout/AdminLayout.jsx
import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, ShieldCheck, Flag,
  Activity, LogOut, Menu, X, ChevronRight, Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/verification', icon: ShieldCheck,     label: 'Facility Verification' },
  { to: '/admin/moderation',   icon: Flag,            label: 'Content Moderation' },
  { to: '/admin/health',       icon: Activity,        label: 'Platform Health' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-neutral-900 border-r border-white/5 z-30 flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <span className="font-display text-white font-bold text-sm block">BDEN</span>
            <span className="text-white/30 text-[10px] tracking-widest uppercase">Admin Panel</span>
          </div>
          <button className="ml-auto lg:hidden text-white/40 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Shield size={14} className="text-violet-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user?.name || 'Admin'}</p>
              <p className="text-white/30 text-xs">Super Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                ${isActive ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}
              `}>
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={13} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-neutral-900 border-b border-white/5 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-white/50" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-white/30 font-mono">BDEN Admin v1.0</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto bg-neutral-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}