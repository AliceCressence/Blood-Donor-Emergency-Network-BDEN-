import { useCallback, useEffect, useState } from 'react'
import { Calendar, CheckCircle, Loader2, MapPin, Megaphone, X, XCircle } from 'lucide-react'
import { campaignApi } from '../../services/app.service'
import { CardShimmer, EmptyState, ErrorState } from '../../components/shared/DataStates'

export default function CampaignReview() {
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = filter === 'PENDING' ? await campaignApi.pending() : await campaignApi.adminList({ status: filter })
      setCampaigns(data)
      setSelected(current => current ? data.find(item => item.id === current.id) || null : null)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    const timer = setTimeout(() => { load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const submit = async () => {
    if (!selected || !action) return
    if (action === 'reject' && !reason.trim()) return
    setSaving(true)
    try {
      await campaignApi.review(selected.id, action, reason.trim())
      setCampaigns(items => items.filter(item => item.id !== selected.id))
      setSelected(null)
      setAction(null)
      setReason('')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Campaign Review</h1>
          <p className="mt-1 text-sm text-neutral-500">Review new campaigns and keep a clear history of previous decisions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'].map(item => (
            <button key={item} onClick={() => { setFilter(item); setSelected(null) }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === item ? 'border-violet-600 bg-violet-600 text-white' : 'border-warm-200 bg-white text-warm-600 hover:border-violet-200 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300'}`}>
              {item.toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2"><CardShimmer rows={4} /></div>
          <div className="lg:col-span-3"><CardShimmer rows={7} /></div>
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns here" description={filter === 'PENDING' ? 'When hospitals submit new campaigns, they will appear here for review.' : 'Nothing matches this history filter yet.'} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            {campaigns.map(campaign => (
              <button key={campaign.id} onClick={() => setSelected(campaign)}
                className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all dark:bg-neutral-900 ${selected?.id === campaign.id ? 'border-violet-500' : 'border-warm-200 dark:border-white/10'}`}>
                <p className="font-display text-sm font-bold text-warm-950 dark:text-white">{campaign.title}</p>
                <p className="mt-1 text-xs text-neutral-500">{campaign.hospitalName}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-neutral-500"><MapPin size={11} /> {campaign.city || 'No city added'}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-3">
            {selected ? (
              <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">{selected.hospitalName}</p>
                    <h2 className="mt-1 font-display text-xl font-bold text-warm-950 dark:text-white">{selected.title}</h2>
                  </div>
                  <span className="rounded-full border border-amber-700/30 bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-400">{selected.rawStatus}</span>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-neutral-500">{selected.description}</p>
                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-warm-50 p-3 dark:bg-white/5">
                    <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-400"><Calendar size={11} /> Date</p>
                    <p className="text-xs font-semibold text-warm-950 dark:text-white">{new Date(selected.startDate).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-warm-50 p-3 dark:bg-white/5">
                    <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-400"><MapPin size={11} /> Location</p>
                    <p className="text-xs font-semibold text-warm-950 dark:text-white">{[selected.address, selected.city].filter(Boolean).join(', ') || 'Not added'}</p>
                  </div>
                </div>
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {(selected.bloodTypes.length ? selected.bloodTypes : ['All types']).map(type => <span key={type} className="rounded-lg bg-blood-50 px-2.5 py-1 font-mono text-xs font-bold text-blood-700">{type}</span>)}
                </div>
                {selected.status === 'pending' ? <div className="flex gap-3">
                  <button onClick={() => setAction('approve')} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"><CheckCircle size={15} /> Approve</button>
                  <button onClick={() => setAction('reject')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-600/30 bg-red-600/10 py-3 text-sm font-semibold text-red-500 hover:bg-red-600/20"><XCircle size={15} /> Reject</button>
                </div> : <p className="rounded-xl bg-warm-50 p-3 text-sm text-neutral-500 dark:bg-white/5">This campaign is in history mode. No review action is needed right now.</p>}
              </div>
            ) : (
              <EmptyState icon={Megaphone} title="Select a campaign" description="Review the hospital, location, dates, blood types, and donor incentive before deciding." />
            )}
          </div>
        </div>
      )}

      {action && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAction(null)} aria-label="Close" />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
            <button onClick={() => setAction(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-white/40 hover:bg-white/10"><X size={16} /></button>
            <h2 className="font-display text-xl font-bold text-white">{action === 'approve' ? 'Approve this campaign?' : 'Reject this campaign?'}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              {action === 'approve' ? 'Donors will be able to discover this campaign publicly.' : 'The hospital will need to fix the submission before donors see it.'}
            </p>
            {action === 'reject' && <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} className="mt-4 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white" placeholder="Reason for rejection..." />}
            <div className="mt-6 flex gap-3">
              <button onClick={() => setAction(null)} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/10">Cancel</button>
              <button onClick={submit} disabled={saving || (action === 'reject' && !reason.trim())} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {saving && <Loader2 size={14} className="mr-1 inline animate-spin" />}
                {action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
