// src/components/layout/DonorLayout.jsx
import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, Bell, MapPin,
  User, LogOut, Menu, X, Droplets, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/donor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/donor/card',      icon: CreditCard,       label: 'Donor Card' },
  { to: '/donor/notifications', icon: Bell,          label: 'Notifications' },
  { to: '/donor/map',       icon: MapPin,            label: 'Map View' },
  { to: '/donor/profile',   icon: User,              label: 'Profile' },
]

export default function DonorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-neutral-900 z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-blood-600 rounded-lg flex items-center justify-center">
            <Droplets size={20} className="text-white" />
          </div>
          <span className="font-display text-white font-bold text-lg tracking-tight">BDEN</span>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blood-600/20 border border-blood-500/30 flex items-center justify-center">
              <span className="text-blood-400 font-bold text-sm font-mono">
                {user?.bloodType || 'A+'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{user?.name || 'Alice'}</p>
              <p className="text-white/40 text-xs truncate">Verified Donor</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${isActive
                  ? 'bg-blood-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 text-neutral-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <NavLink to="/donor/notifications" className="relative p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blood-500 rounded-full" />
          </NavLink>
          <div className="w-8 h-8 rounded-full bg-blood-100 flex items-center justify-center">
            <span className="text-blood-600 font-bold text-xs font-mono">{user?.bloodType || 'A+'}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
