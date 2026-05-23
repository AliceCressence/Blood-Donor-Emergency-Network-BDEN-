// src/components/layout/HospitalLayout.jsx
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Droplets, LayoutDashboard, AlertCircle,
  CalendarDays, Users, LogOut, Bell, Menu, X, CheckCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/hospital',           icon: LayoutDashboard, label: 'Dashboard',         end: true },
  { to: '/hospital/emergency', icon: AlertCircle,     label: 'Emergency requests' },
  { to: '/hospital/campaigns', icon: CalendarDays,    label: 'Campaign manager'   },
  { to: '/hospital/donors',    icon: Users,           label: 'Donor pool'         },
]

export default function HospitalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const handleLogout = () => { logout(); navigate('/') }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`flex flex-col h-full bg-warm-950 text-white
      ${mobile ? 'w-full' : 'w-[260px] min-h-screen fixed left-0 top-0 z-40'}`}>

      <div className="flex items-center justify-between px-6 h-16 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blood-600 flex items-center justify-center">
            <Droplets size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg">BD<span className="text-blood-500">EN</span></span>
        </div>
        {mobile && <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10"><X size={18} /></button>}
      </div>

      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <span className="text-xs font-mono font-semibold text-teal-400 uppercase tracking-widest">Hospital portal</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive ? 'bg-teal-600 text-white' : 'text-warm-400 hover:bg-white/8 hover:text-white'}`}>
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-teal-600/15 border border-teal-500/20">
          <CheckCircle size={14} className="text-teal-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-teal-300">Verified facility</p>
            <p className="text-xs text-warm-500">Admin approved</p>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-teal-600/30 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-teal-300 text-xs font-bold">{user?.name?.charAt(0) || 'H'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.facilityName || user?.name || 'Hospital'}</p>
            <p className="text-xs text-warm-500 truncate">{user?.city || 'Yaoundé'}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-warm-500 hover:text-blood-400 hover:bg-white/10 transition-colors flex-shrink-0">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-warm-50">
      <div className="hidden lg:block w-[260px] flex-shrink-0"><Sidebar /></div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px]"><Sidebar mobile /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-warm-200 flex items-center justify-between px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-warm-500 hover:bg-warm-100"><Menu size={20} /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-warm-500 hover:bg-warm-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 border-2 border-white" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-100">
              <CheckCircle size={13} className="text-teal-500" />
              <span className="text-sm font-medium text-teal-700">Verified</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
