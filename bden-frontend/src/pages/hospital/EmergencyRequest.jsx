// src/pages/hospital/EmergencyRequest.jsx
import { useState } from 'react'
import {
  AlertCircle, Plus, Clock, Users, CheckCircle,
  XCircle, Droplets, ChevronDown, X
} from 'lucide-react'

const BLOOD_TYPES  = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
const URGENCY_LEVELS = [
  { value: 'critical', label: 'Critical',  desc: 'Life-threatening — patient in surgery or ICU',    color: 'blood' },
  { value: 'urgent',   label: 'Urgent',    desc: 'Needed within 2–4 hours',                          color: 'amber' },
  { value: 'standard', label: 'Standard',  desc: 'Needed within 24 hours — planned procedure',       color: 'blue'  },
]

const MOCK_REQUESTS = [
  { id: 1, bloodType: 'O−', urgency: 'critical', units: 2, status: 'active',    donors: 3, time: '4 min ago',  notes: 'Surgical emergency — maternity ward' },
  { id: 2, bloodType: 'A+', urgency: 'urgent',   units: 1, status: 'matched',   donors: 1, time: '2 hrs ago',  notes: '' },
  { id: 3, bloodType: 'B+', urgency: 'standard', units: 3, status: 'fulfilled', donors: 3, time: 'Yesterday',  notes: 'Scheduled surgery' },
  { id: 4, bloodType: 'AB−',urgency: 'urgent',   units: 1, status: 'expired',   donors: 0, time: '3 days ago', notes: '' },
]

const STATUS_CONFIG = {
  active:    { bg: 'bg-blood-50',  text: 'text-blood-700',  border: 'border-blood-200',  dot: 'bg-blood-500 animate-pulse', label: 'Active'    },
  matched:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500',               label: 'Matched'   },
  fulfilled: { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-500',                label: 'Fulfilled' },
  expired:   { bg: 'bg-warm-100',  text: 'text-warm-500',   border: 'border-warm-200',   dot: 'bg-warm-400',                label: 'Expired'   },
}

const URGENCY_COLORS = {
  critical: 'text-blood-700 bg-blood-50 border-blood-200',
  urgent:   'text-amber-700 bg-amber-50 border-amber-200',
  standard: 'text-blue-700  bg-blue-50  border-blue-200',
}

export default function EmergencyRequest() {
  const [showForm, setShowForm]     = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [requests, setRequests]     = useState(MOCK_REQUESTS)
  const [filter, setFilter]         = useState('all')

  const [form, setForm] = useState({
    bloodType: '', urgency: '', units: 1, notes: '',
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.bloodType || !form.urgency) return
    const newReq = {
      id: Date.now(), bloodType: form.bloodType, urgency: form.urgency,
      units: form.units, status: 'active', donors: 0,
      time: 'Just now', notes: form.notes,
    }
    setRequests(r => [newReq, ...r])
    setForm({ bloodType: '', urgency: '', units: 1, notes: '' })
    setShowForm(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-warm-950">Emergency requests</h1>
          <p className="text-warm-500 text-sm mt-1">
            Post urgent blood requests — matched donors are notified instantly.
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="btn-emergency px-5 py-3 text-sm">
          <Plus size={16} /> New request
        </button>
      </div>

      {/* Success toast */}
      {submitted && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-50 border border-teal-200 animate-fade-in">
          <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
          <p className="text-sm text-teal-800 font-medium">
            Request posted — compatible donors within range are being notified now.
          </p>
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-blood-200 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-blood-600" />
              <h2 className="font-display font-semibold text-warm-900">Post emergency request</h2>
            </div>
            <button onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* Blood type */}
            <div>
              <label className="label">Blood type needed</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {BLOOD_TYPES.map(t => (
                  <button key={t} onClick={() => update('bloodType', t)}
                    className={`py-3 rounded-xl border-2 font-mono font-bold text-sm transition-all duration-150
                      ${form.bloodType === t
                        ? 'border-blood-500 bg-blood-50 text-blood-700'
                        : 'border-warm-200 bg-white text-warm-600 hover:border-blood-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="label">Urgency level</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {URGENCY_LEVELS.map(u => (
                  <button key={u.value} onClick={() => update('urgency', u.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-150
                      ${form.urgency === u.value
                        ? u.value === 'critical' ? 'border-blood-500 bg-blood-50'
                          : u.value === 'urgent' ? 'border-amber-400 bg-amber-50'
                          : 'border-blue-400 bg-blue-50'
                        : 'border-warm-200 bg-white hover:border-warm-300'}`}>
                    <p className={`font-semibold text-sm mb-1
                      ${form.urgency === u.value
                        ? u.value === 'critical' ? 'text-blood-700'
                          : u.value === 'urgent' ? 'text-amber-700' : 'text-blue-700'
                        : 'text-warm-800'}`}>
                      {u.label}
                    </p>
                    <p className="text-xs text-warm-500 leading-relaxed">{u.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Units + notes */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Units needed</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => update('units', Math.max(1, form.units - 1))}
                    className="w-10 h-10 rounded-xl border border-warm-300 bg-white text-warm-700
                               flex items-center justify-center text-lg font-bold hover:bg-warm-50 transition-colors">
                    −
                  </button>
                  <span className="w-12 text-center font-display font-bold text-xl text-warm-950">
                    {form.units}
                  </span>
                  <button onClick={() => update('units', Math.min(10, form.units + 1))}
                    className="w-10 h-10 rounded-xl border border-warm-300 bg-white text-warm-700
                               flex items-center justify-center text-lg font-bold hover:bg-warm-50 transition-colors">
                    +
                  </button>
                  <span className="text-sm text-warm-500">unit{form.units > 1 ? 's' : ''} (350ml each)</span>
                </div>
              </div>
              <div>
                <label className="label">Notes <span className="text-warm-400 font-normal">(optional)</span></label>
                <input value={form.notes} onChange={e => update('notes', e.target.value)}
                  placeholder="e.g. Maternity ward, post-op patient"
                  className="input" />
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <Droplets size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Compatible donors within your configured radius will receive an instant notification.
                Donor identities remain private — only responses are shared with you.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit}
                disabled={!form.bloodType || !form.urgency}
                className="btn-primary px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <AlertCircle size={15} /> Post request now
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary px-6 py-3">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'matched', 'fulfilled', 'expired'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filter === f
                ? 'bg-warm-950 text-white'
                : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                {requests.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-warm-200 py-16 text-center">
            <p className="text-warm-400 text-sm">No {filter} requests found.</p>
          </div>
        )}
        {filtered.map((r) => {
          const s = STATUS_CONFIG[r.status]
          const u = URGENCY_COLORS[r.urgency]
          return (
            <div key={r.id}
              className={`bg-white rounded-2xl border shadow-card p-5
                ${r.status === 'active' ? 'border-blood-200' : 'border-warm-200'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blood-50 border-2 border-blood-200
                                  flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-blood-700 text-sm">{r.bloodType}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${u}`}>
                        {r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)}
                      </span>
                      <span className="text-sm text-warm-500">{r.units} unit{r.units > 1 ? 's' : ''} needed</span>
                    </div>
                    {r.notes && <p className="text-xs text-warm-500 mt-1 italic">"{r.notes}"</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-warm-400">
                        <Users size={10} /> {r.donors} donors notified
                      </span>
                      <span className="flex items-center gap-1 text-xs text-warm-400">
                        <Clock size={10} /> {r.time}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                 border text-xs font-semibold flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
