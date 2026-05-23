// src/pages/admin/PlatformHealth.jsx
import { Activity, Server, Users, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

const SERVICES = [
  { name: 'API Server',          status: 'operational', uptime: '99.98%', latency: '42ms' },
  { name: 'Database',            status: 'operational', uptime: '99.99%', latency: '8ms'  },
  { name: 'Notification Service',status: 'operational', uptime: '99.91%', latency: '120ms'},
  { name: 'SMS Gateway',         status: 'degraded',    uptime: '97.20%', latency: '380ms'},
  { name: 'Map Tile Service',    status: 'operational', uptime: '100%',   latency: '55ms' },
  { name: 'Auth Service',        status: 'operational', uptime: '99.99%', latency: '15ms' },
]

const WEEKLY_ACTIVITY = [
  { day: 'Mon', donors: 42, requests: 8, matches: 11 },
  { day: 'Tue', donors: 55, requests: 12, matches: 15 },
  { day: 'Wed', donors: 38, requests: 6, matches: 9  },
  { day: 'Thu', donors: 61, requests: 14, matches: 18 },
  { day: 'Fri', donors: 49, requests: 9, matches: 13 },
  { day: 'Sat', donors: 72, requests: 5, matches: 7  },
  { day: 'Sun', donors: 33, requests: 3, matches: 5  },
]

const maxDonors = Math.max(...WEEKLY_ACTIVITY.map(d => d.donors))

const STATUS_CFG = {
  operational: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Operational' },
  degraded:    { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'Degraded'    },
  down:        { dot: 'bg-red-400',     text: 'text-red-400',     label: 'Down'        },
}

const KPI = [
  { label: 'Total donors registered',   value: '1,284', trend: '+34',  up: true  },
  { label: 'Emergency requests (month)',value: '143',   trend: '+12',  up: true  },
  { label: 'Successful matches',        value: '67',    trend: '+8',   up: true  },
  { label: 'Avg response time',         value: '18 min',trend: '−3min',up: true  },
  { label: 'Donor churn rate',          value: '4.2%',  trend: '+0.3%',up: false },
  { label: 'Unresolved flags',          value: '4',     trend: '+2',   up: false },
]

export default function PlatformHealth() {
  const allOperational = SERVICES.every(s => s.status === 'operational')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Platform Health</h1>
        <p className="text-neutral-500 text-sm mt-1">Real-time system status and performance metrics</p>
      </div>

      {/* Overall status banner */}
      <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
        allOperational
          ? 'bg-emerald-900/20 border-emerald-700/30'
          : 'bg-amber-900/20 border-amber-700/30'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allOperational ? 'bg-emerald-900/40' : 'bg-amber-900/40'}`}>
          {allOperational
            ? <CheckCircle size={20} className="text-emerald-400" />
            : <AlertTriangle size={20} className="text-amber-400" />
          }
        </div>
        <div>
          <p className={`font-semibold ${allOperational ? 'text-emerald-400' : 'text-amber-400'}`}>
            {allOperational ? 'All systems operational' : 'Some services degraded'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">Last checked: just now · Next check in 60s</p>
        </div>
      </div>

      {/* Services */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
          <Server size={16} className="text-violet-400" />
          <h2 className="font-display font-bold text-white">Service Status</h2>
        </div>
        <div className="divide-y divide-white/5">
          {SERVICES.map(s => {
            const cfg = STATUS_CFG[s.status]
            return (
              <div key={s.name} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot} ${s.status !== 'operational' ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium text-white flex-1">{s.name}</span>
                <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                <span className="text-xs text-neutral-600 w-16 text-right">{s.latency}</span>
                <span className="text-xs text-neutral-500 w-16 text-right">{s.uptime}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly activity chart */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5">
          <Activity size={16} className="text-violet-400" />
          <h2 className="font-display font-bold text-white">Weekly Activity</h2>
          <div className="ml-auto flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Active donors</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Requests</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Matches</span>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-end gap-3 h-36">
            {WEEKLY_ACTIVITY.map(day => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5 h-28">
                  <div className="flex-1 bg-violet-600/70 rounded-t-sm" style={{ height: `${(day.donors / maxDonors) * 100}%` }} title={`${day.donors} donors`} />
                  <div className="flex-1 bg-red-500/70 rounded-t-sm" style={{ height: `${(day.requests / maxDonors) * 100}%` }} title={`${day.requests} requests`} />
                  <div className="flex-1 bg-emerald-500/70 rounded-t-sm" style={{ height: `${(day.matches / maxDonors) * 100}%` }} title={`${day.matches} matches`} />
                </div>
                <span className="text-[10px] text-neutral-600">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI.map(({ label, value, trend, up }) => (
          <div key={label} className="bg-neutral-900 border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-neutral-500 mb-2">{label}</p>
            <p className="text-xl font-display font-bold text-white">{value}</p>
            <span className={`text-xs font-semibold flex items-center gap-1 mt-1 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              <TrendingUp size={11} className={up ? '' : 'rotate-180'} />
              {trend} vs last week
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}