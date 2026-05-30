// src/pages/hospital/HospitalDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, CalendarDays, Users, TrendingUp,
  Clock, CheckCircle, ChevronRight,
  MapPin, Plus, Activity
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { requestApi } from '../../services/app.service'
import { CardShimmer, EmptyState } from '../../components/shared/DataStates'

const MOCK_CAMPAIGNS = [
  { name: 'May Drive 2026',  types: ['O+','A+'], target: 120, current: 74, date: 'May 20' },
  { name: 'World Blood Day', types: ['All'],     target: 200, current: 31, date: 'Jun 14' },
]

const STATUS_STYLES = {
  active:    { bg: 'bg-blood-50',  text: 'text-blood-700',  border: 'border-blood-200',  dot: 'bg-blood-500 animate-pulse', label: 'Active'    },
  matched:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500',               label: 'Matched'   },
  fulfilled: { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-500',                label: 'Fulfilled' },
  expired:   { bg: 'bg-warm-100',  text: 'text-warm-500',   border: 'border-warm-200',   dot: 'bg-warm-400',                label: 'Expired'   },
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blood: 'bg-blood-50 border-blood-100 text-blood-600',
    teal:  'bg-teal-50  border-teal-100  text-teal-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    blue:  'bg-blue-50  border-blue-100  text-blue-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-5">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-warm-500 font-medium mb-1">{label}</p>
      <p className="font-display font-bold text-2xl text-warm-950">{value}</p>
      {sub && <p className="text-xs text-warm-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function HospitalDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const facilityName = user?.facilityName || 'Your facility'

  useEffect(() => {
    requestApi.list({ status: 'ACTIVE' })
      .then(data => setRequests(data.slice(0, 4)))
      .catch(() => setRequests([]))
      .finally(() => setLoadingRequests(false))
  }, [])

  const activeCount = requests.filter(r => r.status === 'active').length
  const criticalCount = requests.filter(r => r.urgency === 'critical').length

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-warm-500 mb-1">Hospital portal</p>
          <h1 className="font-display text-3xl font-bold text-warm-950">{facilityName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                             bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700">
              <CheckCircle size={11} /> Verified facility
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                             bg-warm-100 border border-warm-200 text-xs text-warm-600">
              <MapPin size={11} /> {user?.city || 'Yaoundé'}
            </span>
          </div>
        </div>
        <Link to="/hospital/emergency"
          className="btn-emergency px-5 py-3 text-sm">
          <Plus size={16} /> Post emergency request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertCircle}  label="Active requests"    value={activeCount}    sub={`${criticalCount} critical right now`}     color="blood" />
        <StatCard icon={CalendarDays} label="Running campaigns"  value="2"    sub="351 total donors targeted" color="teal"  />
        <StatCard icon={Users}        label="Donors in radius"   value="847"  sub="Within 10 km"              color="blue"  />
        <StatCard icon={TrendingUp}   label="Donations received" value="142"  sub="This year"                 color="amber" />
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Emergency requests */}
        <div className="bg-white rounded-2xl border border-warm-200 shadow-card">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-warm-100">
            <h2 className="font-display font-semibold text-warm-900">Recent requests</h2>
            <Link to="/hospital/emergency"
              className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1">
              Manage all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-warm-100">
            {loadingRequests && [0, 1, 2].map(i => <div key={i} className="p-4"><CardShimmer rows={1} /></div>)}
            {!loadingRequests && requests.length === 0 && (
              <div className="p-5">
                <EmptyState icon={AlertCircle} title="No active requests yet" description="Once your team posts requests, the most recent ones will appear here." />
              </div>
            )}
            {!loadingRequests && requests.map((r) => {
              const s = STATUS_STYLES[r.status]
              return (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-xl bg-blood-50 border border-blood-100
                                  flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-blood-700 text-xs">{r.bloodType}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-900">{r.urgency}</p>
                      <span className="text-xs text-warm-400">· {r.units} unit{r.units > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Users size={10} className="text-warm-400" />
                      <span className="text-xs text-warm-400">{r.donors} donors notified</span>
                      <span className="text-warm-300">·</span>
                      <Clock size={10} className="text-warm-400" />
                      <span className="text-xs text-warm-400">{r.time}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                   border text-xs font-semibold flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Campaigns */}
        <div className="bg-white rounded-2xl border border-warm-200 shadow-card">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-warm-100">
            <h2 className="font-display font-semibold text-warm-900">Active campaigns</h2>
            <Link to="/hospital/campaigns"
              className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1">
              Manage <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-warm-100">
            {MOCK_CAMPAIGNS.map((c, i) => {
              const pct = Math.round((c.current / c.target) * 100)
              return (
                <div key={i} className="px-6 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-warm-900">{c.name}</p>
                    <span className="flex items-center gap-1 text-xs text-warm-400">
                      <CalendarDays size={10} /> {c.date}
                    </span>
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    {c.types.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-lg bg-blood-50 text-blood-700
                                               text-xs font-mono font-semibold border border-blood-100">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-warm-500 mb-1.5">
                    <span>{c.current} donors registered</span>
                    <span>Goal: {c.target}</span>
                  </div>
                  <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-warm-400 mt-1">{pct}% of goal reached</p>
                </div>
              )
            })}
          </div>
          <div className="px-6 pb-5">
            <Link to="/hospital/campaigns"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                         bg-teal-50 border border-teal-200 text-sm font-semibold text-teal-700
                         hover:bg-teal-100 transition-colors">
              <Plus size={14} /> Create new campaign
            </Link>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-2xl border border-warm-200 shadow-card">
        <div className="px-6 pt-5 pb-4 border-b border-warm-100">
          <h2 className="font-display font-semibold text-warm-900">Recent activity</h2>
        </div>
        <div className="divide-y divide-warm-100">
          {[
            { icon: CheckCircle, color: 'text-teal-500',  bg: 'bg-teal-50',  text: 'Donor responded to O− request',         time: '4 min ago'  },
            { icon: Activity,    color: 'text-blood-500', bg: 'bg-blood-50', text: 'Emergency request posted for O− blood',  time: '8 min ago'  },
            { icon: Users,       color: 'text-blue-500',  bg: 'bg-blue-50',  text: '3 new donors registered for May Drive',  time: '1 hr ago'   },
            { icon: CalendarDays,color: 'text-amber-500', bg: 'bg-amber-50', text: 'World Blood Day campaign published',      time: '2 hrs ago'  },
            { icon: CheckCircle, color: 'text-teal-500',  bg: 'bg-teal-50',  text: 'B+ emergency request fulfilled',         time: 'Yesterday'  },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5">
              <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={14} className={item.color} />
              </div>
              <p className="text-sm text-warm-700 flex-1">{item.text}</p>
              <span className="text-xs text-warm-400 flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
