// src/pages/hospital/CampaignManager.jsx
import { useState } from 'react'
import {
  Plus, CalendarDays, Users, Award, MapPin,
  CheckCircle, Clock, X, TrendingUp, Edit3
} from 'lucide-react'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'All types']

const MOCK_CAMPAIGNS = [
  {
    id: 1, name: 'May Donation Drive 2026',
    types: ['O+', 'A+'], target: 120, current: 74,
    date: 'May 20, 2026', location: 'Main hall, ground floor',
    benefit: 'Free malaria screening for all donors',
    status: 'active', verified: true,
  },
  {
    id: 2, name: 'World Blood Donor Day',
    types: ['All types'], target: 200, current: 31,
    date: 'Jun 14, 2026', location: 'Outpatient building',
    benefit: 'Priority consultation access for 3 months',
    status: 'upcoming', verified: true,
  },
  {
    id: 3, name: 'Emergency Stock Replenishment',
    types: ['O−', 'B−', 'AB−'], target: 60, current: 60,
    date: 'Mar 15, 2026', location: 'Blood bank unit',
    benefit: 'BDEN loyalty card + free blood typing',
    status: 'completed', verified: true,
  },
]

const STATUS_CONFIG = {
  active:    { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-500 animate-pulse', label: 'Active'    },
  upcoming:  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400',               label: 'Upcoming'  },
  completed: { bg: 'bg-warm-100',  text: 'text-warm-600',   border: 'border-warm-200',   dot: 'bg-warm-400',               label: 'Completed' },
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500',              label: 'Pending'   },
}

export default function CampaignManager() {
  const [showForm,   setShowForm]   = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [campaigns,  setCampaigns]  = useState(MOCK_CAMPAIGNS)
  const [filter,     setFilter]     = useState('all')

  const [form, setForm] = useState({
    name: '', date: '', location: '', benefit: '',
    target: 50, types: [],
  })

  const toggleType = (t) => {
    setForm(f => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
    }))
  }

  const handleSubmit = () => {
    if (!form.name || !form.date || form.types.length === 0) return
    const newCampaign = {
      id: Date.now(), ...form, current: 0,
      status: 'pending', verified: false,
    }
    setCampaigns(c => [newCampaign, ...c])
    setForm({ name: '', date: '', location: '', benefit: '', target: 50, types: [] })
    setShowForm(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-warm-950">Campaign manager</h1>
          <p className="text-warm-500 text-sm mt-1">
            Plan donation drives, set targets, and offer donor benefits.
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl
                     bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm
                     transition-all duration-200 shadow-sm hover:-translate-y-0.5">
          <Plus size={16} /> New campaign
        </button>
      </div>

      {/* Success notice */}
      {submitted && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 animate-fade-in">
          <Clock size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            Campaign submitted for admin review. It will go live once verified — usually within 24 hours.
          </p>
        </div>
      )}

      {/* Create campaign form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-teal-600" />
              <h2 className="font-display font-semibold text-warm-900">Create new campaign</h2>
            </div>
            <button onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Campaign name */}
            <div>
              <label className="label">Campaign name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. World Blood Donor Day Drive" className="input" />
            </div>

            {/* Blood types */}
            <div>
              <label className="label">Blood types needed</label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(t => (
                  <button key={t} onClick={() => toggleType(t)}
                    className={`px-3 py-2 rounded-xl border-2 font-mono font-semibold text-sm transition-all
                      ${form.types.includes(t)
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-warm-200 bg-white text-warm-600 hover:border-teal-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Location */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Campaign date</label>
                <input type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">Collection location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                  <input value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Main hall, ground floor" className="input pl-10" />
                </div>
              </div>
            </div>

            {/* Target + Benefit */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Donor target</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setForm(f => ({ ...f, target: Math.max(10, f.target - 10) }))}
                    className="w-10 h-10 rounded-xl border border-warm-300 bg-white text-warm-700
                               flex items-center justify-center text-lg font-bold hover:bg-warm-50">
                    −
                  </button>
                  <span className="w-12 text-center font-display font-bold text-xl text-warm-950">{form.target}</span>
                  <button onClick={() => setForm(f => ({ ...f, target: f.target + 10 }))}
                    className="w-10 h-10 rounded-xl border border-warm-300 bg-white text-warm-700
                               flex items-center justify-center text-lg font-bold hover:bg-warm-50">
                    +
                  </button>
                  <span className="text-sm text-warm-500">donors</span>
                </div>
              </div>
              <div>
                <label className="label">Donor benefit <span className="text-warm-400 font-normal">(incentive)</span></label>
                <div className="relative">
                  <Award size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                  <input value={form.benefit}
                    onChange={e => setForm(f => ({ ...f, benefit: e.target.value }))}
                    placeholder="e.g. Free malaria screening" className="input pl-10" />
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <Clock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                All campaigns require admin verification before going live. This ensures only legitimate,
                licensed facilities can organize donation drives on BDEN.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit}
                disabled={!form.name || !form.date || form.types.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl
                           bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <CalendarDays size={15} /> Submit for review
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary px-6 py-3">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'upcoming', 'pending', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${filter === f
                ? 'bg-warm-950 text-white'
                : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaign cards */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-warm-200 py-16 text-center">
            <p className="text-warm-400 text-sm">No {filter} campaigns found.</p>
          </div>
        )}
        {filtered.map((c) => {
          const s = STATUS_CONFIG[c.status]
          const pct = Math.round((c.current / c.target) * 100)
          return (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-card p-6
              ${c.status === 'active' ? 'border-teal-200' : 'border-warm-200'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display font-semibold text-warm-900 text-lg">{c.name}</h3>
                    {c.verified && (
                      <CheckCircle size={15} className="text-teal-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-warm-400 flex-wrap">
                    <span className="flex items-center gap-1"><CalendarDays size={10} /> {c.date}</span>
                    {c.location && <span className="flex items-center gap-1"><MapPin size={10} /> {c.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                   border text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>
              </div>

              {/* Blood types */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.types.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-blood-50 border border-blood-100
                                           text-xs font-mono font-semibold text-blood-700">
                    {t}
                  </span>
                ))}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-warm-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {c.current} donors registered
                  </span>
                  <span>Goal: {c.target}</span>
                </div>
                <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="text-xs text-warm-400 mt-1">{pct}% of goal reached</p>
              </div>

              {/* Benefit */}
              {c.benefit && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <Award size={13} className="text-teal-600 flex-shrink-0" />
                  <span className="text-xs text-teal-700 font-medium">{c.benefit}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
