import { CheckCircle, Clock, Droplets, Search, Users } from 'lucide-react'
import { EmptyState, InfoTip } from '../../components/shared/DataStates'

const BLOOD_TYPES = ['All', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  }
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-warm-950/70">
      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl border ${colors[color]}`}>
        <Icon size={17} />
      </div>
      <p className="font-display text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
      {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
    </div>
  )
}

export default function DonorPool() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Donor Pool</h1>
          <InfoTip>Donor matching will be populated by donor-service nearby matching and request-service response data.</InfoTip>
        </div>
        <p className="mt-1 text-sm text-neutral-500">Search and monitor compatible donors once matching data becomes available.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Matched donors" value="0" sub="No matches yet" color="blue" />
        <StatCard icon={CheckCircle} label="Currently eligible" value="0" sub="From donor-service" color="green" />
        <StatCard icon={Droplets} label="Critical types" value="0" sub="Based on active requests" color="red" />
        <StatCard icon={Clock} label="Avg response time" value="--" sub="Starts after responses" color="amber" />
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-white/10 dark:bg-warm-950/70">
        <div className="border-b border-neutral-100 px-6 py-4 dark:border-white/10">
          <h2 className="mb-3 font-display font-bold text-neutral-900 dark:text-white">Donor Registry</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input disabled placeholder="Search will activate when donor matching is connected" className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-4 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5" />
            </div>
            <select disabled className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/5">
              <option>All statuses</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {BLOOD_TYPES.map(type => (
              <button key={type} disabled className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold font-mono text-neutral-400 dark:border-white/10 dark:bg-white/5">
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          <EmptyState
            icon={Users}
            title="No donor matches yet"
            description="When a request is published and compatible donors are found, they will appear here with eligibility and response details."
          />
        </div>
      </div>
    </div>
  )
}
