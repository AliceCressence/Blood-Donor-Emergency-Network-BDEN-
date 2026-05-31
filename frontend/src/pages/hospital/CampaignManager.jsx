import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar, CheckCircle, Clock, Edit3, Eye, Loader2, LocateFixed, MapPin,
  Plus, Save, Search, Send, Tag, Users, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { campaignApi } from '../../services/app.service'
import { CardShimmer, ConfirmModal, EmptyState, ErrorState } from '../../components/shared/DataStates'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

const EMPTY_FORM = {
  title: '',
  startDate: '',
  endDate: '',
  startTime: '08:00',
  endTime: '16:00',
  city: '',
  address: '',
  latitude: '3.8667',
  longitude: '11.5167',
  targetDonors: 20,
  targetVolumeMl: 9000,
  bloodTypes: [],
  description: '',
  incentiveInput: '',
  incentives: [],
}

const statusStyle = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ongoing: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  rejected: 'bg-red-100 text-red-600 border-red-200',
  cancelled: 'bg-red-50 text-red-500 border-red-100',
}

function ProgressBar({ value, target }) {
  const pct = target ? Math.min(Math.round((value / target) * 100), 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-neutral-500">{value} / {target || 'no target'} donors</span>
        <span className="font-semibold text-blood-600">{target ? `${pct}%` : 'Open goal'}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100">
        <div className="h-2 rounded-full bg-blood-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function toForm(campaign) {
  const start = campaign?.startDate ? new Date(campaign.startDate) : null
  const end = campaign?.endDate ? new Date(campaign.endDate) : null
  const incentives = (campaign?.incentives || '').split(',').map(item => item.trim()).filter(Boolean)
  return {
    title: campaign?.title || '',
    startDate: start ? start.toISOString().slice(0, 10) : '',
    endDate: end ? end.toISOString().slice(0, 10) : '',
    startTime: start ? start.toTimeString().slice(0, 5) : '08:00',
    endTime: end ? end.toTimeString().slice(0, 5) : '16:00',
    city: campaign?.city || '',
    address: campaign?.address || '',
    latitude: campaign?.latitude || '3.8667',
    longitude: campaign?.longitude || '11.5167',
    targetDonors: campaign?.targetDonors || 20,
    targetVolumeMl: campaign?.targetVolumeMl || 9000,
    bloodTypes: campaign?.bloodTypes || [],
    description: campaign?.description || '',
    incentiveInput: '',
    incentives,
  }
}

function CampaignDetail({ campaign, progress, setProgress, savingProgress, onProgress, onCancelAsk, onEdit }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm dark:border-white/10 dark:bg-warm-950/70">
      <div className="border-b border-neutral-100 px-6 py-5 dark:border-white/10">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle[campaign.status] || statusStyle.pending}`}>
            {campaign.rawStatus}
          </span>
          {campaign.status === 'rejected' && <span className="text-xs text-red-500">{campaign.rejectionReason}</span>}
        </div>
        <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">{campaign.title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{campaign.description || 'No description added yet.'}</p>
      </div>

      <div className="space-y-6 px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, label: 'Starts', value: new Date(campaign.startDate).toLocaleString() },
            { icon: Clock, label: 'Ends', value: new Date(campaign.endDate).toLocaleString() },
            { icon: MapPin, label: 'Location', value: [campaign.address, campaign.city].filter(Boolean).join(', ') || 'Not provided' },
            { icon: Users, label: 'Interest', value: `${campaign.interestedCount} donor${campaign.interestedCount === 1 ? '' : 's'}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="mb-1 flex items-center gap-1.5">
                <Icon size={12} className="text-neutral-400" />
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</span>
              </div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Blood types welcome</p>
          <div className="flex flex-wrap gap-1.5">
            {(campaign.bloodTypes.length ? campaign.bloodTypes : ['All']).map(bt => (
              <span key={bt} className="rounded-lg border border-blood-100 bg-blood-50 px-3 py-1 font-mono text-sm font-bold text-blood-600">{bt}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Reported progress</p>
          <ProgressBar value={campaign.actualDonors} target={campaign.targetDonors} />
          <p className="mt-2 text-xs text-neutral-400">Reported by facility. Keep this updated after collection days.</p>
        </div>

        {campaign.status !== 'pending' && campaign.status !== 'rejected' && campaign.status !== 'cancelled' && (
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Update campaign progress</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" type="number" min="0" value={progress.actualDonors} onChange={e => setProgress(p => ({ ...p, actualDonors: e.target.value }))} placeholder="Actual donors" />
              <input className="input" type="number" min="0" value={progress.actualVolumeMl} onChange={e => setProgress(p => ({ ...p, actualVolumeMl: e.target.value }))} placeholder="Actual volume ml" />
            </div>
            <button onClick={onProgress} disabled={savingProgress} className="btn-primary mt-3">
              {savingProgress ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save progress
            </button>
          </div>
        )}

        {(campaign.status === 'pending' || campaign.status === 'rejected') && (
          <div className="flex flex-wrap gap-2">
            <button onClick={onEdit} className="rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50">
              <Edit3 size={14} className="mr-1 inline" /> Edit campaign
            </button>
            <button onClick={onCancelAsk} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
              Cancel submission
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CampaignManager() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [savingProgress, setSavingProgress] = useState(false)
  const [progress, setProgress] = useState({ actualDonors: 0, actualVolumeMl: 0 })
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await campaignApi.mine()
      setCampaigns(data)
      setSelected(current => current ? data.find(item => item.id === current.id) || null : null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const selectCampaign = (campaign) => {
    setSelected(campaign)
    setProgress({ actualDonors: campaign.actualDonors || 0, actualVolumeMl: campaign.actualVolumeMl || 0 })
    setShowForm(false)
  }

  const visible = useMemo(() => filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter), [campaigns, filter])
  const counts = useMemo(() => ({
    all: campaigns.length,
    pending: campaigns.filter(c => c.status === 'pending').length,
    approved: campaigns.filter(c => ['approved', 'ongoing'].includes(c.status)).length,
    completed: campaigns.filter(c => c.status === 'completed').length,
  }), [campaigns])

  const totalTarget = campaigns.reduce((sum, item) => sum + (item.targetDonors || 0), 0)
  const totalReported = campaigns.reduce((sum, item) => sum + (item.actualDonors || 0), 0)

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const toggleBloodType = bt => setForm(current => ({
    ...current,
    bloodTypes: current.bloodTypes.includes(bt) ? current.bloodTypes.filter(item => item !== bt) : [...current.bloodTypes, bt],
  }))
  const addIncentive = () => {
    const value = form.incentiveInput.trim()
    if (!value || form.incentives.includes(value)) return
    setForm(current => ({ ...current, incentives: [...current.incentives, value], incentiveInput: '' }))
  }
  const removeIncentive = value => setForm(current => ({ ...current, incentives: current.incentives.filter(item => item !== value) }))

  const useCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => setForm(current => ({ ...current, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })),
      () => setError('We could not read your current location. You can still type the coordinates manually.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const startEdit = campaign => {
    setEditingId(campaign.id)
    setForm(toForm(campaign))
    setShowForm(true)
    setSelected(null)
  }

  const createCampaign = async () => {
    if (!form.title || !form.startDate || !form.endDate || !form.city) return
    setCreating(true)
    try {
      const payload = { ...form, incentives: form.incentives.join(', ') }
      const saved = editingId ? await campaignApi.edit(editingId, payload, user) : await campaignApi.create(payload, user)
      setCampaigns(current => editingId ? current.map(item => item.id === saved.id ? saved : item) : [saved, ...current])
      setSelected(saved)
      setEditingId(null)
      setForm(EMPTY_FORM)
      setShowForm(false)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const saveProgress = async () => {
    if (!selected) return
    setSavingProgress(true)
    try {
      const updated = await campaignApi.updateProgress(selected.id, progress)
      setCampaigns(current => current.map(item => item.id === updated.id ? updated : item))
      setSelected(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingProgress(false)
    }
  }

  const cancelCampaign = async () => {
    if (!selected) return
    try {
      const updated = await campaignApi.cancel(selected.id, 'Cancelled by hospital before review.')
      setCampaigns(current => current.map(item => item.id === updated.id ? updated : item))
      setSelected(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelOpen(false)
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl space-y-4">{[0, 1, 2].map(i => <CardShimmer key={i} rows={4} />)}</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Campaign Manager</h1>
          <p className="mt-1 text-sm text-neutral-500">Plan donation drives, send them for review, and keep progress visible.</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setSelected(null) }} className="btn-primary">
          <Plus size={16} /> New campaign
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total campaigns', value: campaigns.length, icon: Calendar, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Awaiting review', value: counts.pending, icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Target donors', value: totalTarget, icon: Users, color: 'bg-violet-50 text-violet-600 border-violet-100' },
          { label: 'Reported donors', value: totalReported, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-warm-950/70">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl border ${color}`}><Icon size={17} /></div>
            <p className="font-display text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
            <p className="text-xs text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-warm-950/70">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display font-bold text-neutral-900 dark:text-white">{editingId ? 'Edit campaign' : 'New campaign'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"><X size={16} /></button>
          </div>
          <div className="space-y-6">
            <fieldset className="grid gap-4 rounded-2xl border border-neutral-100 p-4 sm:grid-cols-2 dark:border-white/10">
              <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-warm-300">Campaign story</legend>
              <input className="input sm:col-span-2" placeholder="Campaign title" value={form.title} onChange={e => set('title', e.target.value)} />
              <textarea className="input min-h-24 sm:col-span-2" placeholder="Tell donors what this campaign is about" value={form.description} onChange={e => set('description', e.target.value)} />
            </fieldset>

            <fieldset className="grid gap-4 rounded-2xl border border-neutral-100 p-4 sm:grid-cols-2 dark:border-white/10">
              <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-warm-300">Schedule</legend>
              <label className="text-xs font-semibold text-neutral-500">Start date<input className="input mt-1" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></label>
              <label className="text-xs font-semibold text-neutral-500">Start time<input className="input mt-1" type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} /></label>
              <label className="text-xs font-semibold text-neutral-500">End date<input className="input mt-1" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></label>
              <label className="text-xs font-semibold text-neutral-500">End time<input className="input mt-1" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} /></label>
            </fieldset>

            <fieldset className="grid gap-4 rounded-2xl border border-neutral-100 p-4 sm:grid-cols-2 dark:border-white/10">
              <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-warm-300">Location</legend>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input className="input pl-9" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <input className="input" placeholder="Venue / address" value={form.address} onChange={e => set('address', e.target.value)} />
              <input className="input" placeholder="Latitude" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
              <input className="input" placeholder="Longitude" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
              <button type="button" onClick={useCurrentLocation} className="btn-secondary sm:col-span-2"><LocateFixed size={15} /> Use current location</button>
            </fieldset>

            <fieldset className="grid gap-4 rounded-2xl border border-neutral-100 p-4 sm:grid-cols-2 dark:border-white/10">
              <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-warm-300">Goals and donor perks</legend>
              <input className="input" type="number" min="1" placeholder="Target donors" value={form.targetDonors} onChange={e => set('targetDonors', e.target.value)} />
              <input className="input" type="number" min="350" placeholder="Target volume ml" value={form.targetVolumeMl} onChange={e => set('targetVolumeMl', e.target.value)} />
              <div className="sm:col-span-2">
                <div className="flex gap-2">
                  <input className="input" placeholder="Add incentive, e.g. Free screening" value={form.incentiveInput} onChange={e => set('incentiveInput', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIncentive() } }} />
                  <button type="button" onClick={addIncentive} className="btn-secondary"><Tag size={15} /> Add</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.incentives.map(item => <button key={item} type="button" onClick={() => removeIncentive(item)} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-red-50 hover:text-red-600">{item} ×</button>)}
                </div>
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-neutral-100 p-4 dark:border-white/10">
              <legend className="px-2 text-sm font-semibold text-neutral-700 dark:text-warm-300">Blood compatibility</legend>
              <p className="mb-2 text-sm font-semibold text-neutral-700 dark:text-warm-300">Blood types needed</p>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(bt => (
                  <button key={bt} type="button" onClick={() => toggleBloodType(bt)}
                    className={`rounded-xl border px-3 py-1.5 font-mono text-sm font-bold transition-all ${form.bloodTypes.includes(bt) ? 'border-blood-600 bg-blood-600 text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-blood-300 dark:border-white/10 dark:bg-white/5 dark:text-warm-300'}`}>
                    {bt}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-400">Leave empty if all blood types are welcome.</p>
            </fieldset>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={createCampaign} disabled={creating || !form.title || !form.startDate || !form.endDate || !form.city} className="btn-primary flex-1">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {editingId ? 'Save and resend' : 'Submit for review'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'pending', label: `Pending (${counts.pending})` },
          { id: 'approved', label: `Approved (${counts.approved})` },
          { id: 'completed', label: `Completed (${counts.completed})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${filter === tab.id ? 'border-neutral-900 bg-neutral-900 text-white dark:border-blood-600 dark:bg-blood-600' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-white/10 dark:bg-warm-950/70 dark:text-warm-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {visible.length === 0 ? (
            <EmptyState icon={Calendar} title="No campaigns here yet" description="Your campaign queue will appear here as soon as you submit one." />
          ) : visible.map(campaign => (
            <button key={campaign.id} onClick={() => selectCampaign(campaign)}
              className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md dark:bg-warm-950/70 ${selected?.id === campaign.id ? 'border-blood-500' : 'border-neutral-100 dark:border-white/10'}`}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-bold leading-snug text-neutral-900 dark:text-white">{campaign.title}</h3>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle[campaign.status] || statusStyle.pending}`}>{campaign.rawStatus}</span>
              </div>
              <p className="mb-1 flex items-center gap-1.5 text-xs text-neutral-500"><Calendar size={11} /> {new Date(campaign.startDate).toLocaleDateString()}</p>
              <p className="mb-3 flex items-center gap-1.5 text-xs text-neutral-500"><MapPin size={11} /> {campaign.city || 'Location not set'}</p>
              <ProgressBar value={campaign.actualDonors} target={campaign.targetDonors} />
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <CampaignDetail campaign={selected} progress={progress} setProgress={setProgress} savingProgress={savingProgress} onProgress={saveProgress} onCancelAsk={() => setCancelOpen(true)} onEdit={() => startEdit(selected)} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-neutral-100 bg-white dark:border-white/10 dark:bg-warm-950/70">
              <div className="text-center text-neutral-400">
                <Eye size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a campaign to see details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={cancelOpen}
        title="Cancel this campaign?"
        description="This will stop the campaign submission. Donors will not see it, and your team can create a clearer one later."
        confirmLabel="Cancel campaign"
        danger
        onConfirm={cancelCampaign}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  )
}
