// src/pages/admin/PlatformHealth.jsx
import { Activity, Server, TrendingUp } from 'lucide-react'
import { EmptyState } from '../../components/shared/DataStates'

export default function PlatformHealth() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Platform Health</h1>
        <p className="text-neutral-500 text-sm mt-1">Live service status and analytics will show here once the monitoring API is connected.</p>
      </div>

      <div className="rounded-2xl border border-warm-200 bg-white p-5 flex items-center gap-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-900/40">
          <Activity size={20} className="text-violet-400" />
        </div>
        <div>
          <p className="font-semibold text-warm-950 dark:text-white">Monitoring is ready for data</p>
          <p className="text-xs text-neutral-500 mt-0.5">Prometheus/Grafana status can be surfaced here when the frontend API contract is added.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-white/5">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-warm-100 dark:border-white/5">
            <Server size={16} className="text-violet-400" />
            <h2 className="font-display font-bold text-warm-950 dark:text-white">Service Status</h2>
          </div>
          <div className="p-5">
            <EmptyState
              icon={Server}
              title="No live checks yet"
              description="Service uptime, latency, and incident status will appear here from real monitoring data."
            />
          </div>
        </div>

        <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-white/5">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-warm-100 dark:border-white/5">
            <TrendingUp size={16} className="text-violet-400" />
            <h2 className="font-display font-bold text-warm-950 dark:text-white">Platform Metrics</h2>
          </div>
          <div className="p-5">
            <EmptyState
              icon={TrendingUp}
              title="Analytics not connected"
              description="Real donor, request, match, and response-time metrics will replace this empty state."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
