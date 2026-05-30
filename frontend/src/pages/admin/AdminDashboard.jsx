// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Building2, Droplets, Flag, ShieldCheck, Users } from 'lucide-react'
import { authService } from '../../services/auth.service'
import { CardShimmer, EmptyState, ErrorState } from '../../components/shared/DataStates'

const stats = (pendingCount) => [
  { label: 'Registered Donors', value: '--', detail: 'Connect donor analytics to show this', icon: Users, color: 'violet' },
  { label: 'Partner Hospitals', value: pendingCount, detail: pendingCount === 1 ? '1 waiting for review' : `${pendingCount} waiting for review`, icon: Building2, color: 'blue' },
  { label: 'Active Campaigns', value: '--', detail: 'Campaign analytics pending', icon: Droplets, color: 'green' },
  { label: 'Emergency Requests', value: '--', detail: 'Request analytics pending', icon: AlertTriangle, color: 'red' },
]

const colorMap = {
  violet: 'bg-violet-900/40 text-violet-400 border-violet-700/40',
  blue: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
  green: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  red: 'bg-red-900/40 text-red-400 border-red-700/40',
}

export default function AdminDashboard() {
  const [pendingHospitals, setPendingHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    authService.listPendingHospitals()
      .then(data => {
        if (!mounted) return
        setPendingHospitals(data)
        setError('')
      })
      .catch(err => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Admin Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-1">BDEN platform overview</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-700/30 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Admin workspace
        </span>
      </div>

      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats(pendingHospitals.length).map(({ label, value, detail, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-warm-200 rounded-2xl p-5 shadow-sm dark:bg-neutral-900 dark:border-white/5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-4 ${colorMap[color]}`}>
              <Icon size={17} />
            </div>
            <p className="text-2xl font-display font-bold text-warm-950 dark:text-white">{value}</p>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mt-0.5">{label}</p>
            <p className="text-xs text-neutral-600 mt-1">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-white/5">
          <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-violet-400" />
              <h2 className="font-display font-bold text-warm-950 dark:text-white">Pending Facility Verifications</h2>
            </div>
            <Link to="/admin/verification" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
              Review queue
            </Link>
          </div>
          {loading ? (
            <div className="p-5"><CardShimmer rows={3} /></div>
          ) : pendingHospitals.length > 0 ? (
            <div className="divide-y divide-warm-100 dark:divide-white/5">
              {pendingHospitals.slice(0, 4).map(facility => (
                <div key={facility.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-warm-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-blue-900/30 border border-blue-700/30 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 size={15} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-warm-950 dark:text-white truncate">{facility.facility_name}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {facility.facility_type} · {facility.city || 'City not provided'} · {facility.user_email}
                      </p>
                    </div>
                  </div>
                  <Link to="/admin/verification" className="text-xs font-semibold text-violet-400 hover:text-violet-300 shrink-0">
                    Open
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={ShieldCheck}
                title="No hospitals waiting right now"
                description="When a facility applies to join BDEN, it will appear here for review."
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-white/5">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-warm-100 dark:border-white/5">
              <Activity size={15} className="text-violet-400" />
              <h2 className="font-display font-bold text-warm-950 dark:text-white text-sm">Platform Health</h2>
            </div>
            <div className="p-5">
              <EmptyState
                icon={Activity}
                title="Health checks coming next"
                description="Live service metrics will show here once the monitoring API is connected."
              />
            </div>
          </div>

          <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-white/5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Flag size={15} className="text-amber-400" />
                <h2 className="font-display font-bold text-warm-950 dark:text-white text-sm">Flagged Content</h2>
              </div>
              <Link to="/admin/moderation" className="text-xs text-violet-400 hover:text-violet-300">Open</Link>
            </div>
            <div className="p-5">
              <EmptyState
                icon={Flag}
                title="Nothing needs moderation"
                description="Reports and automated flags will appear here when they exist."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
