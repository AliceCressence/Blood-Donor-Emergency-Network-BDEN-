// src/pages/admin/AdminDashboard.jsx
import { Link } from 'react-router-dom'
import { Users, Building2, Droplets, Activity, ShieldCheck, Flag, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

const STATS = [
  { label: 'Registered Donors',    value: '1,284', delta: '+34 this week',  icon: Users,      color: 'violet' },
  { label: 'Partner Hospitals',    value: '18',    delta: '3 pending review', icon: Building2,  color: 'blue'   },
  { label: 'Active Campaigns',     value: '7',     delta: '2 ending soon',   icon: Droplets,   color: 'green'  },
  { label: 'Emergency Requests',   value: '143',   delta: 'This month',      icon: AlertTriangle, color: 'red' },
]

const PENDING_FACILITIES = [
  { id: 1, name: 'Clinique Saint-Martin',   city: 'Douala',   type: 'Private clinic', submitted: '2 days ago', docs: 3 },
  { id: 2, name: 'Hôpital de District Mfou', city: 'Mfou',   type: 'District hospital', submitted: '5 days ago', docs: 4 },
  { id: 3, name: 'Polyclinique du Lac',     city: 'Yaoundé',  type: 'Private clinic', submitted: '1 week ago', docs: 2 },
]

const FLAGGED_CONTENT = [
  { id: 1, type: 'Emergency request', detail: 'Unusual blood type combination flagged', severity: 'medium', time: '1 hr ago' },
  { id: 2, type: 'User report',       detail: 'Duplicate donor account detected',        severity: 'low',    time: '3 hrs ago' },
  { id: 3, type: 'Campaign',          detail: 'Unverified facility posted a campaign',   severity: 'high',   time: '5 hrs ago' },
]

const PLATFORM_METRICS = [
  { label: 'Avg response time to emergency', value: '18 min', good: true },
  { label: 'Donor verification rate',        value: '84%',    good: true },
  { label: 'Unverified facilities',          value: '3',      good: false },
  { label: 'Open content flags',             value: '3',      good: false },
  { label: 'Daily active donors',            value: '212',    good: true },
  { label: 'Successful matches this month',  value: '67',     good: true },
]

const colorMap = {
  violet: 'bg-violet-900/40 text-violet-400 border-violet-700/40',
  blue:   'bg-blue-900/40 text-blue-400 border-blue-700/40',
  green:  'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  red:    'bg-red-900/40 text-red-400 border-red-700/40',
}

const severityStyle = {
  high:   'bg-red-900/40 text-red-400 border-red-700/30',
  medium: 'bg-amber-900/40 text-amber-400 border-amber-700/30',
  low:    'bg-neutral-800 text-neutral-400 border-neutral-700',
}

export default function AdminDashboard() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-1">BDEN platform overview — all regions</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-700/30 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Platform live
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, delta, icon: Icon, color }) => (
          <div key={label} className="bg-neutral-900 border border-white/5 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-4 ${colorMap[color]}`}>
              <Icon size={17} />
            </div>
            <p className="text-2xl font-display font-bold text-white">{value}</p>
            <p className="text-sm font-medium text-neutral-400 mt-0.5">{label}</p>
            <p className="text-xs text-neutral-600 mt-1">{delta}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Pending verifications */}
        <div className="lg:col-span-3 bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-violet-400" />
              <h2 className="font-display font-bold text-white">Pending Facility Verifications</h2>
            </div>
            <Link to="/admin/verification" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {PENDING_FACILITIES.map(f => (
              <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-900/30 border border-blue-700/30 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={15} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.name}</p>
                    <p className="text-xs text-neutral-500">{f.type} · {f.city} · {f.docs} docs submitted · {f.submitted}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-900/30 border border-emerald-700/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <CheckCircle size={11} /> Approve
                  </button>
                  <button className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-900/30 border border-red-700/30 px-3 py-1.5 rounded-lg transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform health */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
              <Activity size={15} className="text-violet-400" />
              <h2 className="font-display font-bold text-white text-sm">Platform Health</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {PLATFORM_METRICS.map(({ label, value, good }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500 flex-1">{label}</span>
                  <span className={`text-xs font-bold ${good ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flagged content */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Flag size={15} className="text-amber-400" />
                <h2 className="font-display font-bold text-white text-sm">Flagged Content</h2>
              </div>
              <Link to="/admin/moderation" className="text-xs text-violet-400 hover:text-violet-300">View all →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {FLAGGED_CONTENT.map(item => (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-neutral-300">{item.type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityStyle[item.severity]}`}>
                      {item.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{item.detail}</p>
                  <p className="text-[10px] text-neutral-600 mt-0.5">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}