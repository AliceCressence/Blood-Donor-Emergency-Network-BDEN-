// src/pages/admin/ContentModeration.jsx
import { useState } from 'react'
import { Flag, AlertTriangle, CheckCircle, XCircle, Eye, Filter } from 'lucide-react'

const FLAGS = [
  { id: 1, type: 'Emergency request', content: 'Request for rare blood type combination (AB− + O−) simultaneously — unusual', severity: 'medium', reporter: 'System auto-flag', time: '1 hr ago', status: 'open' },
  { id: 2, type: 'User report',       content: 'Possible duplicate account for donor ID BDEN-YDE-00302 and BDEN-YDE-00287', severity: 'low',    reporter: 'Donor #2241',    time: '3 hrs ago', status: 'open' },
  { id: 3, type: 'Campaign',          content: 'Campaign posted by facility that has not yet completed verification (Polyclinique du Lac)', severity: 'high', reporter: 'System auto-flag', time: '5 hrs ago', status: 'open' },
  { id: 4, type: 'User report',       content: 'Donor claims hospital demanded payment before accepting blood donation', severity: 'high', reporter: 'Donor #5134', time: '1 day ago', status: 'open' },
  { id: 5, type: 'Profile',           content: 'Profile with incomplete blood type verification offering to sell blood', severity: 'high', reporter: 'System auto-flag', time: '2 days ago', status: 'resolved' },
  { id: 6, type: 'Emergency request', content: 'Closed request not removed from live feed after 48h', severity: 'low', reporter: 'System auto-flag', time: '3 days ago', status: 'resolved' },
]

const SEVERITY_CFG = {
  high:   { bg: 'bg-red-900/30',    text: 'text-red-400',    border: 'border-red-700/30' },
  medium: { bg: 'bg-amber-900/30',  text: 'text-amber-400',  border: 'border-amber-700/30' },
  low:    { bg: 'bg-neutral-800',   text: 'text-neutral-400',border: 'border-neutral-700' },
}

export default function ContentModeration() {
  const [flags, setFlags] = useState(FLAGS)
  const [filter, setFilter] = useState('open')

  const resolve = (id) => setFlags(f => f.map(x => x.id === id ? { ...x, status: 'resolved' } : x))
  const dismiss = (id) => setFlags(f => f.filter(x => x.id !== id))

  const visible = filter === 'all' ? flags : flags.filter(f => f.status === filter)
  const openCount = flags.filter(f => f.status === 'open').length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Content Moderation</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {openCount > 0
              ? <span className="text-red-400 font-semibold">{openCount} open flags</span>
              : 'All clear — no open flags'
            } requiring review
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { id: 'open', label: `Open (${flags.filter(f => f.status === 'open').length})` },
          { id: 'resolved', label: `Resolved (${flags.filter(f => f.status === 'resolved').length})` },
          { id: 'all', label: 'All' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              filter === tab.id
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Flag list */}
      <div className="space-y-3">
        {visible.map(item => {
          const sev = SEVERITY_CFG[item.severity]
          return (
            <div key={item.id} className={`bg-neutral-900 border rounded-2xl p-5 ${item.status === 'resolved' ? 'border-white/5 opacity-60' : 'border-white/10'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Flag size={14} className={sev.text} />
                  <span className="text-sm font-semibold text-white">{item.type}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.bg} ${sev.text} ${sev.border}`}>
                    {item.severity.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-600">{item.time}</span>
              </div>
              <p className="text-sm text-neutral-400 mb-3 leading-relaxed">{item.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600">Reported by: {item.reporter}</span>
                {item.status === 'open' ? (
                  <div className="flex gap-2">
                    <button onClick={() => resolve(item.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-900/30 border border-emerald-700/30 px-3 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-colors">
                      <CheckCircle size={11} /> Resolve
                    </button>
                    <button onClick={() => dismiss(item.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors">
                      <XCircle size={11} /> Dismiss
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <CheckCircle size={11} /> Resolved
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {visible.length === 0 && (
          <div className="text-center py-16 text-neutral-600">
            <Flag size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No flags in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}