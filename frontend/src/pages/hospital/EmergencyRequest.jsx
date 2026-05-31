import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Droplets, Edit3, Info, LocateFixed, MapPin, Plus, Search, Users, X, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { requestApi } from '../../services/app.service'
import { CardShimmer, ConfirmModal, EmptyState, ErrorState, InfoTip } from '../../components/shared/DataStates'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
const URGENCY_LEVELS = [
  { value: 'critical', label: 'Critical', desc: 'Life-threatening: patient in surgery or ICU' },
  { value: 'urgent', label: 'Urgent', desc: 'Needed within 2-4 hours' },
  { value: 'standard', label: 'Standard', desc: 'Needed within 24 hours' },
]
const STATUS_CONFIG = {
  active: { bg: 'bg-blood-50', text: 'text-blood-700', border: 'border-blood-200', dot: 'bg-blood-500 animate-pulse', label: 'Active' },
  matched: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Matched' },
  fulfilled: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', label: 'Fulfilled' },
  expired: { bg: 'bg-warm-100', text: 'text-warm-500', border: 'border-warm-200', dot: 'bg-warm-400', label: 'Expired' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Cancelled' },
}
const URGENCY_COLORS = {
  critical: 'text-blood-700 bg-blood-50 border-blood-200',
  urgent: 'text-amber-700 bg-amber-50 border-amber-200',
  standard: 'text-blue-700 bg-blue-50 border-blue-200',
}

export default function EmergencyRequest() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [closeTarget, setCloseTarget] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ bloodType: '', urgency: '', units: 1, city: user?.city || '', latitude: '', longitude: '', notes: '' })
  const [locationMessage, setLocationMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRequests(await requestApi.list({ status: filter === 'all' ? undefined : filter.toUpperCase() }))
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

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.bloodType || !form.urgency) return
    setSaving(true)
    setError('')
    try {
      const saved = editingId ? await requestApi.edit(editingId, form, user) : await requestApi.create(form, user)
      setRequests(prev => editingId ? prev.map(item => item.id === saved.id ? saved : item) : [saved, ...prev])
      setForm({ bloodType: '', urgency: '', units: 1, city: user?.city || '', latitude: '', longitude: '', notes: '' })
      setEditingId(null)
      setShowForm(false)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const closeRequest = async () => {
    const target = closeTarget
    setCloseTarget(null)
    try {
      const updated = await requestApi.close(target.id, 'CANCELLED')
      setRequests(prev => prev.map(r => r.id === target.id ? updated : r))
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = request => {
    setEditingId(request.id)
    setForm({
      bloodType: request.bloodType || '',
      urgency: request.urgency || '',
      units: request.units || 1,
      city: request.city || user?.city || '',
      latitude: request.latitude || '',
      longitude: request.longitude || '',
      notes: request.notes || '',
    })
    setShowForm(true)
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('This browser cannot share location. You can still type the city and coordinates.')
      return
    }
    setLocationMessage('Finding your facility location...')
    navigator.geolocation.getCurrentPosition(
      position => {
        update('latitude', position.coords.latitude.toFixed(6))
        update('longitude', position.coords.longitude.toFixed(6))
        setLocationMessage('Location added. Please keep the city name readable for donors.')
      },
      () => setLocationMessage('We could not read your location. You can enter the city and coordinates manually.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold text-warm-950">Emergency requests</h1>
            <InfoTip>Requests listed here come from the request service. Closing a request changes what donors see.</InfoTip>
          </div>
          <p className="text-warm-500 text-sm mt-1">Post urgent blood requests and track donor responses from one place.</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ bloodType: '', urgency: '', units: 1, city: user?.city || '', latitude: '', longitude: '', notes: '' }); setShowForm(true) }} className="btn-emergency px-5 py-3 text-sm"><Plus size={16} /> New request</button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {submitted && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50 border border-teal-200 animate-fade-in">
          <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
          <p className="text-sm text-teal-800 font-medium">Request posted. Compatible donors can now see it from the request service.</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-blood-200 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
            <div className="flex items-center gap-2"><AlertCircle size={18} className="text-blood-600" /><h2 className="font-display font-semibold text-warm-900">{editingId ? 'Edit emergency request' : 'Post emergency request'}</h2></div>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors"><X size={16} /></button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="label">Blood type needed</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_TYPES.map(t => <button key={t} onClick={() => update('bloodType', t)} className={`py-3 rounded-xl border-2 font-mono font-bold text-sm transition-all duration-150 ${form.bloodType === t ? 'border-blood-500 bg-blood-50 text-blood-700' : 'border-warm-200 bg-white text-warm-600 hover:border-blood-300'}`}>{t}</button>)}
              </div>
            </div>
            <div>
              <label className="label">Urgency level</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {URGENCY_LEVELS.map(u => <button key={u.value} onClick={() => update('urgency', u.value)} className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${form.urgency === u.value ? 'border-blood-500 bg-blood-50' : 'border-warm-200 bg-white hover:border-warm-300'}`}><p className="font-semibold text-sm mb-1 text-warm-800">{u.label}</p><p className="text-xs text-warm-500 leading-relaxed">{u.desc}</p></button>)}
              </div>
            </div>
            <fieldset className="rounded-2xl border border-warm-200 bg-warm-50/60 p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-warm-500">Where donors should go</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label flex items-center gap-2"><Search size={13} /> City</span>
                  <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="e.g. Yaounde" className="input bg-white" />
                </label>
                <div>
                  <span className="label flex items-center gap-2"><MapPin size={13} /> Coordinates</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.latitude} onChange={e => update('latitude', e.target.value)} placeholder="Latitude" className="input bg-white" />
                    <input value={form.longitude} onChange={e => update('longitude', e.target.value)} placeholder="Longitude" className="input bg-white" />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onClick={useCurrentLocation} className="inline-flex items-center gap-2 rounded-xl border border-blood-200 bg-white px-4 py-2 text-sm font-semibold text-blood-700 transition-colors hover:bg-blood-50">
                  <LocateFixed size={15} /> Use current location
                </button>
                <a className="text-xs font-semibold text-blue-600 hover:text-blue-700" href="https://www.google.com/maps" target="_blank" rel="noreferrer">
                  Open Google Maps for coordinates
                </a>
                {locationMessage && <p className="text-xs text-warm-500">{locationMessage}</p>}
              </div>
            </fieldset>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Units needed</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => update('units', Math.max(1, form.units - 1))} className="w-10 h-10 rounded-xl border border-warm-300 bg-white text-warm-700 flex items-center justify-center text-lg font-bold hover:bg-warm-50">-</button>
                  <span className="w-12 text-center font-display font-bold text-xl text-warm-950">{form.units}</span>
                  <button onClick={() => update('units', Math.min(20, form.units + 1))} className="w-10 h-10 rounded-xl border border-warm-300 bg-white text-warm-700 flex items-center justify-center text-lg font-bold hover:bg-warm-50">+</button>
                </div>
              </div>
              <div>
                <label className="label">Notes <span className="text-warm-400 font-normal">(optional)</span></label>
                <input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="e.g. Maternity ward, post-op patient" className="input" />
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">Use the smallest clear description. Donors only need enough context to decide quickly and safely.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={!form.bloodType || !form.urgency || saving} className="btn-primary px-6 py-3 disabled:opacity-40"><AlertCircle size={15} /> {saving ? 'Saving...' : editingId ? 'Save changes' : 'Post request now'}</button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary px-6 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'matched', 'fulfilled', 'expired', 'cancelled'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-warm-950 text-white' : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}
      </div>

      <div className="space-y-3">
        {loading && [0, 1, 2].map(i => <CardShimmer key={i} rows={2} />)}
        {!loading && filtered.length === 0 && <EmptyState icon={Droplets} title={`No ${filter === 'all' ? '' : filter} requests yet`} description="When requests exist, they will appear here with status, urgency, donor response count, and follow-up actions." />}
        {!loading && filtered.map(r => {
          const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.active
          const u = URGENCY_COLORS[r.urgency] || URGENCY_COLORS.standard
          return (
            <div key={r.id} className={`bg-white rounded-2xl border shadow-card p-5 ${r.status === 'active' ? 'border-blood-200' : 'border-warm-200'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blood-50 border-2 border-blood-200 flex items-center justify-center flex-shrink-0"><span className="font-mono font-bold text-blood-700 text-sm">{r.bloodType}</span></div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${u}`}>{r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)}</span>
                      <span className="text-sm text-warm-500">{r.units} unit{r.units > 1 ? 's' : ''} needed</span>
                    </div>
                    {r.notes && <p className="text-xs text-warm-500 mt-1 italic">"{r.notes}"</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-warm-400"><Users size={10} /> {r.donors} donor responses</span>
                      <span className="flex items-center gap-1 text-xs text-warm-400"><Clock size={10} /> {r.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'active' && <button onClick={() => startEdit(r)} className="p-2 rounded-xl text-warm-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit request"><Edit3 size={16} /></button>}
                  {r.status === 'active' && <button onClick={() => setCloseTarget(r)} className="p-2 rounded-xl text-warm-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Cancel request"><XCircle size={16} /></button>}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />{s.label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={Boolean(closeTarget)}
        danger
        title="Cancel this emergency request?"
        description="Donors will stop seeing this request as active. Only cancel it if the need has passed, changed, or was posted by mistake."
        confirmLabel="Cancel request"
        onCancel={() => setCloseTarget(null)}
        onConfirm={closeRequest}
      />
    </div>
  )
}
