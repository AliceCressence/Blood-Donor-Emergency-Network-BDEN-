// src/pages/admin/FacilityVerification.jsx
import { useState } from 'react'
import { Building2, CheckCircle, XCircle, FileText, MapPin, Phone, Clock, Search } from 'lucide-react'

const FACILITIES = [
  {
    id: 1, name: 'Clinique Saint-Martin', city: 'Douala', region: 'Littoral',
    type: 'Private clinic', license: 'CM-DOI-2024-0441', phone: '+237 233 XX XX XX',
    submitted: '2 days ago', status: 'pending', docs: ['Business registration', 'Medical license', 'Ministry approval'],
    notes: 'All documents appear authentic. License number verified with Ministry database.',
  },
  {
    id: 2, name: 'Hôpital de District Mfou', city: 'Mfou', region: 'Centre',
    type: 'District hospital', license: 'CM-DSH-2023-0182', phone: '+237 222 XX XX XX',
    submitted: '5 days ago', status: 'pending', docs: ['Government affiliation letter', 'Medical license', 'Lab certification', 'Director ID'],
    notes: 'Government hospital — affiliation letter verified.',
  },
  {
    id: 3, name: 'Polyclinique du Lac', city: 'Yaoundé', region: 'Centre',
    type: 'Private clinic', license: 'CM-YDE-2024-0312', phone: '+237 699 XX XX XX',
    submitted: '1 week ago', status: 'pending', docs: ['Business registration', 'Medical license'],
    notes: 'Missing lab certification — requested from facility.',
  },
  {
    id: 4, name: 'CHU de Yaoundé', city: 'Yaoundé', region: 'Centre',
    type: 'Teaching hospital', license: 'CM-CHU-2020-0001', phone: '+237 222 XX XX XX',
    submitted: '3 months ago', status: 'approved', docs: ['Full documentation package'],
    notes: 'Flagship partner hospital.',
  },
  {
    id: 5, name: 'Clinique Privée Espoir', city: 'Bafoussam', region: 'Ouest',
    type: 'Private clinic', license: 'CM-BAF-2023-0088', phone: '+237 697 XX XX XX',
    submitted: '2 months ago', status: 'rejected', docs: ['Business registration'],
    notes: 'Medical license could not be verified. Application rejected.',
  },
]

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/30' },
  approved: { label: 'Approved',       bg: 'bg-emerald-900/30', text: 'text-emerald-400', border: 'border-emerald-700/30' },
  rejected: { label: 'Rejected',       bg: 'bg-red-900/30',   text: 'text-red-400',   border: 'border-red-700/30' },
}

export default function FacilityVerification() {
  const [facilities, setFacilities] = useState(FACILITIES)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('pending')

  const updateStatus = (id, status) => {
    setFacilities(f => f.map(x => x.id === id ? { ...x, status } : x))
    setSelected(null)
  }

  const visible = facilities
    .filter(f => filter === 'all' || f.status === filter)
    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.city.toLowerCase().includes(search.toLowerCase()))

  const counts = {
    pending: facilities.filter(f => f.status === 'pending').length,
    approved: facilities.filter(f => f.status === 'approved').length,
    rejected: facilities.filter(f => f.status === 'rejected').length,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Facility Verification</h1>
        <p className="text-neutral-500 text-sm mt-1">Review and approve hospitals and clinics applying to join BDEN</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'pending', label: `Pending (${counts.pending})` },
          { id: 'approved', label: `Approved (${counts.approved})` },
          { id: 'rejected', label: `Rejected (${counts.rejected})` },
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

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or city..."
          className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {visible.map(f => {
            const cfg = STATUS_CONFIG[f.status]
            return (
              <button key={f.id} onClick={() => setSelected(f)}
                className={`w-full text-left bg-neutral-900 border rounded-2xl p-4 transition-all hover:border-white/20 ${
                  selected?.id === f.id ? 'border-violet-500' : 'border-white/5'
                }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-white leading-snug">{f.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{f.type} · {f.city}, {f.region}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
                  <span className="flex items-center gap-1"><Clock size={10} /> {f.submitted}</span>
                  <span className="flex items-center gap-1"><FileText size={10} /> {f.docs.length} docs</span>
                </div>
              </button>
            )
          })}
          {visible.length === 0 && (
            <div className="text-center py-10 text-neutral-600 text-sm">No facilities found.</div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden sticky top-24">
              <div className="px-6 py-5 border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold text-white text-lg">{selected.name}</h2>
                    <p className="text-neutral-500 text-sm">{selected.type}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].text} ${STATUS_CONFIG[selected.status].border}`}>
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { icon: MapPin, label: 'Location', value: `${selected.city}, ${selected.region}` },
                    { icon: Phone, label: 'Phone', value: selected.phone },
                    { icon: FileText, label: 'License No.', value: selected.license },
                    { icon: Clock, label: 'Submitted', value: selected.submitted },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-neutral-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} className="text-neutral-500" />
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</span>
                      </div>
                      <p className="text-xs font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Documents */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Submitted Documents</p>
                  <div className="space-y-1.5">
                    {selected.docs.map(doc => (
                      <div key={doc} className="flex items-center gap-2 bg-neutral-800/50 rounded-lg px-3 py-2">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                        <span className="text-xs text-neutral-300">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviewer notes */}
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Reviewer Notes</p>
                  <p className="text-xs text-neutral-400 bg-neutral-800/50 rounded-xl p-3 leading-relaxed">{selected.notes}</p>
                </div>

                {/* Actions */}
                {selected.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => updateStatus(selected.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                      <CheckCircle size={15} /> Approve Facility
                    </button>
                    <button onClick={() => updateStatus(selected.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 text-sm font-semibold py-3 rounded-xl transition-colors">
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
                {selected.status !== 'pending' && (
                  <button onClick={() => updateStatus(selected.id, 'pending')}
                    className="w-full text-xs font-semibold text-neutral-400 hover:text-white border border-white/10 hover:border-white/20 py-2.5 rounded-xl transition-colors">
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-white/5 rounded-2xl h-64 flex items-center justify-center">
              <div className="text-center">
                <Building2 size={28} className="text-neutral-700 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">Select a facility to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}