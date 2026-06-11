// src/components/layout/Navbar.jsx — v2 floating navbar
import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Bell, LogOut, User, Bot, ChevronDown,
  LayoutDashboard, BookOpen, Megaphone,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import NotificationPanel from '../shared/NotificationPanel'
import BloodTypeChat from '../shared/BloodTypeChat'
import ThemeToggle from '../shared/ThemeToggle'

export default function Navbar() {
  const { user, logout }          = useAuth()
  const { unreadCount }           = useNotifications()
  const navigate                  = useNavigate()
  const [showChat,  setShowChat]  = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [userOpen,  setUserOpen]  = useState(false)
  const bellRef                   = useRef(null)
  const exploreRef                = useRef(null)
  const userRef                   = useRef(null)
  const dropdownRef               = useRef(null)

  const handleLogout = () => { logout(); navigate('/'); setUserOpen(false) }
  const portalLink   = { donor: '/donor', hospital: '/hospital', admin: '/admin' }[user?.role]
  const accountType  = user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}` : ''

  // Close dropdowns on outside click
  useEffect(() => {
    if (!userOpen && !exploreOpen) return
    const handler = (e) => {
      if (
        exploreRef.current && !exploreRef.current.contains(e.target)
      ) setExploreOpen(false)
      if (
        userRef.current && !userRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userOpen, exploreOpen])

  return (
    <>
      {/* Floating bar — fixed, centered, max-width capped */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl">
        <nav className="
          flex items-center justify-between gap-4
          px-4 py-2 pe-2
          rounded-3xl
          bg-white/80 dark:bg-warm-900/80
          backdrop-blur-xl
          border border-warm-200/60 dark:border-white/10
          shadow-lg
        ">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img src="/favicon.svg" alt="BDEN" className="w-9 h-9 rounded-xl shadow-[0_2px_8px_rgba(229,17,17,0.28)]" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-sm text-warm-950 dark:text-white tracking-tight">
                BD<span className="text-blood-600">EN</span>
              </span>
              <span className="text-[9px] text-warm-800 dark:text-white/40 font-body tracking-tight leading-tight">
                Blood Donation Emergency Network
              </span>
            </div>
          </Link>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">

            {/* Explore dropdown — visitor only. Signed-in users get these in their profile menu. */}
            {!user && (
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setExploreOpen(v => !v)}
                className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl
                           border px-3 text-sm font-semibold transition-colors
                           ${exploreOpen
                             ? 'bg-blood-50 dark:bg-blood-900/40 border-blood-100 dark:border-blood-800 text-blood-600 dark:text-blood-400'
                             : 'bg-white/40 dark:bg-white/5 border-warm-200/70 dark:border-white/10 text-warm-700 dark:text-white/70 hover:bg-warm-100 dark:hover:bg-white/10 hover:text-warm-950 dark:hover:text-white'
                           }`}
              >
                <span className="hidden sm:inline">Explore</span>
                <BookOpen size={13} className="sm:hidden" />
                <ChevronDown size={13} className={`transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>

              {exploreOpen && (
                <div className="absolute right-0 top-full mt-2 w-56
                                bg-white/95 dark:bg-warm-900/95 backdrop-blur-xl
                                rounded-2xl border border-warm-200/70 dark:border-white/10
                                shadow-[0_8px_40px_rgba(0,0,0,0.15)]
                                overflow-hidden animate-fade-in-fast p-2">
                  <NavLink
                    to="/campaigns"
                    onClick={() => setExploreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
                       ${isActive
                         ? 'bg-blood-50 dark:bg-blood-900/40 text-blood-600 dark:text-blood-400 font-medium'
                         : 'text-warm-700 dark:text-white/70 hover:bg-warm-100 dark:hover:bg-white/8 hover:text-warm-900 dark:hover:text-white'
                       }`}
                  >
                    <Megaphone size={14} className="flex-shrink-0" />
                    Campaigns
                  </NavLink>
                  <NavLink
                    to="/myths"
                    onClick={() => setExploreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
                       ${isActive
                         ? 'bg-blood-50 dark:bg-blood-900/40 text-blood-600 dark:text-blood-400 font-medium'
                         : 'text-warm-700 dark:text-white/70 hover:bg-warm-100 dark:hover:bg-white/8 hover:text-warm-900 dark:hover:text-white'
                       }`}
                  >
                    <BookOpen size={14} className="flex-shrink-0" />
                    Myth debunking
                  </NavLink>
                  <button
                    onClick={() => { setShowChat(true); setExploreOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                               text-warm-700 dark:text-white/70 hover:bg-warm-100 dark:hover:bg-white/8
                               hover:text-warm-900 dark:hover:text-white transition-colors"
                  >
                    <Bot size={14} className="flex-shrink-0" />
                    Know your blood type?
                  </button>
                </div>
              )}
            </div>
            )}

            {user ? (
              <>
                {/* Notification bell */}
                <div className="relative">
                  <button
                    ref={bellRef}
                    onClick={() => setNotifOpen(v => !v)}
                    className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                      notifOpen
                        ? 'bg-blood-50 dark:bg-blood-900/40 text-blood-600'
                        : 'text-warm-500 dark:text-white/50 hover:bg-warm-100 dark:hover:bg-white/10 hover:text-warm-900 dark:hover:text-white'
                    }`}
                  >
                    <Bell size={17} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blood-600
                                       text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationPanel
                    isOpen={notifOpen}
                    onClose={() => setNotifOpen(false)}
                    anchorRef={bellRef}
                  />
                </div>

                {/* User dropdown */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className={`flex h-11 items-center gap-2 rounded-2xl pl-2 pr-3
                                border transition-colors
                                ${userOpen
                                  ? 'bg-warm-100 dark:bg-white/10 border-warm-200 dark:border-white/15'
                                  : 'border-transparent hover:bg-warm-100 dark:hover:bg-white/10 hover:border-warm-200 dark:hover:border-white/15'
                                }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blood-100 dark:bg-blood-900/60
                                    flex items-center justify-center flex-shrink-0">
                      <User size={13} className="text-blood-600 dark:text-blood-400" />
                    </div>
                    <span className="hidden sm:flex min-w-0 flex-col items-start leading-none">
                      <span className="max-w-[150px] truncate text-sm font-semibold text-warm-800 dark:text-white/90">
                        {user.name || user.email}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-warm-400 dark:text-white/35">
                        {accountType} account
                      </span>
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-warm-400 dark:text-white/40 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {userOpen && (
                    <div
                      ref={dropdownRef}
                      className="absolute right-0 top-full mt-2 w-56
                                 bg-white/95 dark:bg-warm-900/95 backdrop-blur-xl
                                 rounded-2xl border border-warm-200/70 dark:border-white/10
                                 shadow-[0_8px_40px_rgba(0,0,0,0.15)]
                                 overflow-hidden
                                 animate-fade-in-fast"
                    >
                      {/* Portal link — primary action */}
                      <div className="p-2 border-b border-warm-100 dark:border-white/8">
                        <Link
                          to={portalLink}
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                     bg-blood-600 hover:bg-blood-700 transition-colors
                                     text-white text-sm font-semibold"
                        >
                          <LayoutDashboard size={14} />
                          My portal
                        </Link>
                      </div>

                      {/* Nav links section */}
                      <div className="p-2 border-b border-warm-100 dark:border-white/8">
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest
                                      text-warm-400 dark:text-white/30 mb-1">
                          Explore
                        </p>
                        <NavLink
                          to="/campaigns"
                          onClick={() => setUserOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
                             ${isActive
                               ? 'bg-blood-50 dark:bg-blood-900/40 text-blood-600 dark:text-blood-400 font-medium'
                               : 'text-warm-700 dark:text-white/70 hover:bg-warm-100 dark:hover:bg-white/8 hover:text-warm-900 dark:hover:text-white'
                             }`}
                        >
                          <Megaphone size={14} className="flex-shrink-0" />
                          Campaigns
                        </NavLink>
                        <NavLink
                          to="/myths"
                          onClick={() => setUserOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
                             ${isActive
                               ? 'bg-blood-50 dark:bg-blood-900/40 text-blood-600 dark:text-blood-400 font-medium'
                               : 'text-warm-700 dark:text-white/70 hover:bg-warm-100 dark:hover:bg-white/8 hover:text-warm-900 dark:hover:text-white'
                             }`}
                        >
                          <BookOpen size={14} className="flex-shrink-0" />
                          Myth debunking
                        </NavLink>
                        <button
                          onClick={() => { setShowChat(true); setUserOpen(false) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                                     text-warm-700 dark:text-white/70 hover:bg-warm-100 dark:hover:bg-white/8
                                     hover:text-warm-900 dark:hover:text-white transition-colors"
                        >
                          <Bot size={14} className="flex-shrink-0" />
                          Know your blood type?
                        </button>
                      </div>

                      <div className="p-2 border-b border-warm-100 dark:border-white/8">
                        <ThemeToggle className="w-full justify-start border-transparent bg-transparent shadow-none hover:bg-warm-100 dark:bg-transparent dark:hover:bg-white/10" />
                      </div>

                      {/* Sign out */}
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm
                                     text-warm-600 dark:text-white/50 hover:bg-red-50 dark:hover:bg-red-900/20
                                     hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <LogOut size={14} className="flex-shrink-0" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Logged-out: explore + sign in + register */
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="h-11 px-4 rounded-2xl text-sm font-semibold
                                     text-warm-700 dark:text-white/70
                                     hover:bg-warm-100 dark:hover:bg-white/10
                                     hover:text-warm-900 dark:hover:text-white transition-colors">
                    Sign in
                  </button>
                </Link>
                <Link to="/register">
                  <button className="h-11 px-5 rounded-2xl text-sm font-semibold
                                     bg-blood-600 hover:bg-blood-700 text-white
                                     shadow-[0_2px_8px_rgba(229,17,17,0.30)]
                                     hover:shadow-[0_4px_16px_rgba(229,17,17,0.40)]
                                     transition-all duration-200">
                    Register as donor
                  </button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* AI chatbot */}
      {showChat && <BloodTypeChat onClose={() => setShowChat(false)} />}
    </>
  )
}
