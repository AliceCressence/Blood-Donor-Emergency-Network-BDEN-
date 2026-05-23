// src/pages/donor/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Droplets, Calendar, Award, AlertTriangle,
  MapPin, Clock, ChevronRight, TrendingUp,
  Heart, Users, CheckCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const MOCK_STATS = {
  totalDonations: 4,
  livesImpacted: 12,
  nextEligible: '2025-07-15',
  daysUntilEligible: 34,
  bloodType: 'O−',
  donorSince: '2023-02-10',
  streak: 3,
}

const MOCK_EMERGENCY_REQUESTS = [
  {
    id: 1,
    hospital: 'Hôpital Central Yaoundé',
    bloodType: 'O−',
    urgency: 'critical',
    distance: '2.1 km',
    postedAgo: '12 min ago',
    unitsNeeded: 3,
    reason: 'Emergency surgery',
  },
  {
    id: 2,
    hospital: 'Clinique de la Cité Verte',
    bloodType: 'O−',
    urgency: 'high',
    distance: '5.4 km',
    postedAgo: '1 hr ago',
    unitsNeeded: 2,
    reason: 'Post-operative care',
  },
]

const MOCK_HISTORY = [
  { id: 1, date: 'Mar 15, 2025', hospital: 'Hôpital Central Yaoundé', type: 'Whole Blood', status: 'verified' },
  { id: 2, date: 'Nov 22, 2024', hospital: 'CHU de Yaoundé', type: 'Whole Blood', status: 'verified' },
  { id: 3, date: 'Jul 8, 2024', hospital: 'Clinique de la Cité Verte', type: 'Whole Blood', status: 'verified' },
  { id: 4, date: 'Feb 10, 2024', hospital: 'Hôpital Central Yaoundé', type: 'Whole Blood', status: 'verified' },
]

function StatCard({ icon: Icon, label, value, sub, color = 'blood' }) {
  const colors = {
    blood: 'bg-blood-50 text-blood-600 border-blood-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-display font-bold text-neutral-900">{value}</p>
      <p className="text-sm font-medium text-neutral-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  )
}

function UrgencyBadge({ level }) {
  const styles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[level]}`}>
      {level.toUpperCase()}
    </span>
  )
}

export default function DonorDashboard() {
  const { user } = useAuth()
  const stats = MOCK_STATS
  const name = user?.name?.split(' ')[0] || 'Alice'

  const canDonate = stats.daysUntilEligible <= 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">
            Good morning, {name} 
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Your donations have impacted <span className="font-semibold text-blood-600">{stats.livesImpacted} lives</span> so far.
          </p>
        </div>
        <Link
          to="/donor/map"
          className="inline-flex items-center gap-2 bg-blood-600 hover:bg-blood-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Droplets size={16} />
          Find a campaign
        </Link>
      </div>

      {/* Eligibility banner */}
      {canDonate ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">You are eligible to donate!</p>
            <p className="text-sm text-emerald-600">You can donate at any nearby hospital or campaign today.</p>
          </div>
          <Link to="/donor/map" className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
            Find campaign <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Calendar size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Next donation in {stats.daysUntilEligible} days</p>
            <p className="text-sm text-amber-600">Eligible from {new Date(stats.nextEligible).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <Link to="/donor/card" className="text-sm font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1">
            View card <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="Total Donations" value={stats.totalDonations} sub="Since Feb 2024" color="blood" />
        <StatCard icon={Heart} label="Lives Impacted" value={stats.livesImpacted} sub="Est. 3 per donation" color="green" />
        <StatCard icon={Award} label="Donor Streak" value={`${stats.streak}×`} sub="Consecutive donations" color="amber" />
        <StatCard icon={Users} label="Blood Type" value={stats.bloodType} sub="Universal donor" color="blue" />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Emergency requests */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-blood-600" />
              <h2 className="font-display font-bold text-neutral-900">Nearby Emergency Requests</h2>
            </div>
            <Link to="/donor/map" className="text-xs font-semibold text-blood-600 hover:text-blood-700 flex items-center gap-1">
              View map <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {MOCK_EMERGENCY_REQUESTS.map(req => (
              <div key={req.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-blood-600 bg-blood-50 px-2 py-0.5 rounded-md">
                        {req.bloodType}
                      </span>
                      <UrgencyBadge level={req.urgency} />
                    </div>
                    <p className="font-medium text-neutral-900 text-sm truncate">{req.hospital}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{req.reason} · {req.unitsNeeded} units needed</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-neutral-400 justify-end">
                      <MapPin size={11} /> {req.distance}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-400 justify-end mt-0.5">
                      <Clock size={11} /> {req.postedAgo}
                    </div>
                    <button className="mt-2 text-xs font-semibold text-blood-600 hover:text-blood-800 transition-colors">
                      Respond →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {MOCK_EMERGENCY_REQUESTS.length === 0 && (
            <div className="px-6 py-10 text-center text-neutral-400 text-sm">
              No active requests near you right now.
            </div>
          )}
        </div>

        {/* Quick actions + Donation history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
            <h2 className="font-display font-bold text-neutral-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to: '/donor/card', icon: CreditCard2, label: 'View donor card', color: 'text-blood-600' },
                { to: '/donor/map', icon: MapPin, label: 'Find campaign near me', color: 'text-blue-600' },
                { to: '/donor/notifications', icon: Bell2, label: 'Check notifications', color: 'text-amber-600' },
                { to: '/donor/profile', icon: User2, label: 'Edit profile', color: 'text-neutral-600' },
              ].map(({ to, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                >
                  <TrendingUp size={16} className={color} />
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 flex-1">{label}</span>
                  <ChevronRight size={14} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Donation history preview */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="font-display font-bold text-neutral-900 text-sm">Recent Donations</h2>
              <span className="text-xs text-neutral-400">{stats.totalDonations} total</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {MOCK_HISTORY.slice(0, 3).map(item => (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-neutral-800">{item.date}</p>
                      <p className="text-xs text-neutral-500 truncate max-w-[140px]">{item.hospital}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle size={11} /> Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline icon aliases to avoid import issues
function CreditCard2(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
function Bell2(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function User2(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
