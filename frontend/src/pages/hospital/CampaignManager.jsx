// src/pages/hospital/CampaignManager.jsx
import { useState } from 'react'
import {
  Calendar, Plus, Users, MapPin, Clock, Edit,
  Trash2, ChevronRight, CheckCircle, Eye, Share2,
  TrendingUp, Droplets, X
} from 'lucide-react'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

const INITIAL_CAMPAIGNS = [
  {
    id: 1,
    title: 'World Blood Donor Day Drive',
    date: '2025-06-14',
    time: '08:00 – 16:00',
    location: 'CHU de Yaoundé – Main Hall',
    slots: 50,
    registered: 38,
    bloodTypes: ['O−', 'A+', 'B+'],
    status: 'active',
    description: 'Annual World Blood Donor Day campaign open to all compatible donors.',
    benefit: 'Free malaria test for all donors',
    responses: [
      { id: 1, donor: 'Donor #4821', bloodType: 'O−', status: 'confirmed', time: '2 hrs ago' },
      { id: 2, donor: 'Donor #3302', bloodType: 'A+', status: 'confirmed', time: '4 hrs ago' },
      { id: 3, donor: 'Donor #5517', bloodType: 'A+', status: 'pending',   time: '5 hrs ago' },
      { id: 4, donor: 'Donor #2241', bloodType: 'B+', status: 'confirmed', time: '6 hrs ago' },
    ],
  },
  {
    id: 2,
    title: 'Mvog-Mbi Community Drive',
    date: '2025-06-20',
    time: '09:00 – 14:00',
    location: 'Mvog-Mbi Community Center',
    slots: 30,
    registered: 12,
    bloodTypes: ['O−', 'O+'],
    status: 'active',
    description: 'Community outreach campaign targeting O− and O+ universal donors.',
    benefit: 'Medical checkup included',
    responses: [
      { id: 1, donor: 'Donor #1102', bloodType: 'O−', status: 'confirmed', time: '1 day ago' },
      { id: 2, donor: 'Donor #7743', bloodType: 'O+', status: 'pending',   time: '1 day ago' },
    ],
  },
  {
    id: 3,
    title: 'Bastos Quarterly Drive',
    date: '2025-04-05',
    time: '08:00 – 15:00',
    location: 'Clinique Bastos',
    slots: 40,
    registered: 40,
    bloodTypes: ['A+', 'B+', 'AB+'],
    status: 'completed',
    description: 'Quarterly planned drive — fully subscribed.',
    benefit: 'Certificate of recognition',
    responses: [],
  },
]

const EMPTY_FORM = {
  title: '', date: '', time: '', location: '',
  slots: 20, bloodTypes: [], description: '', benefit: '',
}

const STATUS_STYLES = {
  active:    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  completed: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-200' },
  cancelled: { bg: 'bg-red-100',     text: 'text-red-600',     border: 'border-red-200'     },
}

const RESPONSE_STYLES = {
  confirmed: 'text-emerald-600 bg-emerald-50',
  pending:   'text-amber-600 bg-amber-50',
  declined:  'text-red-500 bg-red-50',
}

function ProgressBar({ registered, slots }) {
  const pct = Math.min(Math.round((registered / slots) * 100), 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-neutral-500">{registered} / {slots} registered</span>
        <span className={`font-semibold ${pct >= 100 ? 'text-emerald-600' : pct > 60 ? 'text-blue-600' : 'text-amber-600'}`}>{pct}%</span>
      </div>
      <div className="bg-neutral-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct > 60 ? 'bg-blue-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CampaignDetail({ c, onClose, onDelete }) {
  const pct = Math.min(Math.round((c.registered / c.slots) * 100), 100)
  const confirmed = c.responses.filter(r => r.status === 'confirmed').length
  const pending = c.responses.filter(r => r.status === 'pending').length

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[c.status].bg} ${STATUS_STYLES[c.status].text} ${STATUS_STYLES[c.status].border}`}>
              {c.status.toUpperCase()}
            </span>
          </div>
          <h2 className="font-display font-bold text-neutral-900 text-lg">{c.title}</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{c.description}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400">
          <X size={16} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, label: 'Date', value: new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { icon: Clock,    label: 'Time', value: c.time },
            { icon: MapPin,   label: 'Location', value: c.location },
            { icon: Droplets, label: 'Donor benefit', value: c.benefit || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-neutral-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} className="text-neutral-400" />
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-xs font-semibold text-neutral-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Blood types */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Blood Types Needed</p>
          <div className="flex flex-wrap gap-1.5">
            {c.bloodTypes.map(bt => (
              <span key={bt} className="font-mono text-sm font-bold bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-lg">{bt}</span>
            ))}
          </div>
        </div>

        {/* Registration progress */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Registration Progress</p>
          <ProgressBar registered={c.registered} slots={c.slots} />
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Total slots', value: c.slots, color: 'text-neutral-700' },
              { label: 'Confirmed', value: confirmed, color: 'text-emerald-600' },
              { label: 'Pending', value: pending, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center bg-neutral-50 rounded-xl py-3">
                <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donor responses */}
        {c.responses.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Donor Responses</p>
            <div className="space-y-2">
              {c.responses.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-200 px-1.5 py-0.5 rounded">{r.bloodType}</span>
                    <span className="text-sm text-neutral-700">{r.donor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-400">{r.time}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${RESPONSE_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            <Share2 size={14} /> Share Campaign
          </button>
          {c.status === 'active' && (
            <button
              onClick={() => onDelete(c.id)}
              className="flex items-center justify-center gap-2 text-red-500 border border-red-200 hover:bg-red-50 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleBloodType = (bt) => {
    setForm(f => ({
      ...f,
      bloodTypes: f.bloodTypes.includes(bt)
        ? f.bloodTypes.filter(t => t !== bt)
        : [...f.bloodTypes, bt],
    }))
  }

  const handleCreate = () => {
    if (!form.title || !form.date) return
    const newCampaign = { ...form, id: Date.now(), registered: 0, status: 'active', responses: [] }
    setCampaigns(c => [newCampaign, ...c])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setCampaigns(c => c.filter(x => x.id !== id))
    setSelected(null)
  }

  const visible = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)
  const totalSlots = campaigns.reduce((a, c) => a + c.slots, 0)
  const totalRegistered = campaigns.reduce((a, c) => a + c.registered, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Campaign Manager</h1>
          <p className="text-neutral-500 text-sm mt-1">Create and track your blood donation campaigns</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setSelected(null) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: campaigns.length, icon: Calendar, color: 'blue' },
          { label: 'Active Now', value: campaigns.filter(c => c.status === 'active').length, icon: TrendingUp, color: 'green' },
          { label: 'Total Slots', value: totalSlots, icon: Users, color: 'amber' },
          { label: 'Total Registered', value: totalRegistered, icon: CheckCircle, color: 'violet' },
        ].map(({ label, value, icon: Icon, color }) => {
          const c = { blue: 'bg-blue-50 text-blue-600 border-blue-100', green: 'bg-emerald-50 text-emerald-600 border-emerald-100', amber: 'bg-amber-50 text-amber-600 border-amber-100', violet: 'bg-violet-50 text-violet-600 border-violet-100' }
          return (
            <div key={label} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-3 ${c[color]}`}>
                <Icon size={17} />
              </div>
              <p className="text-2xl font-display font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-neutral-900">New Campaign</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Campaign Title *</label>
              <input className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400"
                placeholder="e.g. World Blood Donor Day Drive"
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Date *</label>
              <input type="date" className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Time</label>
              <input className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400"
                placeholder="e.g. 08:00 – 16:00" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Location</label>
              <input className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400"
                placeholder="Venue name and address" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Donor Slots</label>
              <input type="number" min={1} className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.slots} onChange={e => set('slots', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Donor Benefit</label>
              <input className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400"
                placeholder="e.g. Free malaria test" value={form.benefit} onChange={e => set('benefit', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Blood Types Needed</label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(bt => (
                  <button key={bt} onClick={() => toggleBloodType(bt)}
                    className={`text-sm font-bold font-mono px-3 py-1.5 rounded-xl border transition-all ${
                      form.bloodTypes.includes(bt)
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-red-300'
                    }`}>
                    {bt}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Description</label>
              <textarea rows={2} className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400 resize-none"
                placeholder="Brief description of the campaign"
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={!form.title || !form.date}
              className={`flex-1 text-sm font-semibold py-3 rounded-xl transition-colors ${
                form.title && form.date
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}>
              Create Campaign
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold py-3 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: `All (${campaigns.length})` },
          { id: 'active', label: `Active (${campaigns.filter(c => c.status === 'active').length})` },
          { id: 'completed', label: `Completed (${campaigns.filter(c => c.status === 'completed').length})` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              filter === f.id
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid: cards + detail */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Campaign cards */}
        <div className="lg:col-span-2 space-y-3">
          {visible.map(c => (
            <button key={c.id} onClick={() => { setSelected(c); setShowForm(false) }}
              className={`w-full text-left bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${
                selected?.id === c.id ? 'border-blue-500' : 'border-neutral-100'
              }`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-display font-bold text-neutral-900 text-sm leading-snug">{c.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[c.status].bg} ${STATUS_STYLES[c.status].text} ${STATUS_STYLES[c.status].border}`}>
                  {c.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-1.5 mb-3">
                <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <Calendar size={11} className="text-neutral-400" />
                  {new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <MapPin size={11} className="text-neutral-400" />
                  {c.location}
                </p>
              </div>
              <ProgressBar registered={c.registered} slots={c.slots} />
              <div className="flex flex-wrap gap-1 mt-3">
                {c.bloodTypes.map(bt => (
                  <span key={bt} className="font-mono text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">{bt}</span>
                ))}
              </div>
            </button>
          ))}
          {visible.length === 0 && (
            <div className="text-center py-12 text-neutral-400">
              <Calendar size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No campaigns here.</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <CampaignDetail
              c={selected}
              onClose={() => setSelected(null)}
              onDelete={handleDelete}
            />
          ) : (
            <div className="bg-white border border-neutral-100 rounded-2xl h-64 flex items-center justify-center">
              <div className="text-center text-neutral-400">
                <Eye size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a campaign to see details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}