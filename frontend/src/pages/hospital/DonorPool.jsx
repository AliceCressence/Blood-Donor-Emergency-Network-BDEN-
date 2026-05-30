// src/pages/hospital/DonorPool.jsx
import { useState } from 'react'
import {
  Users, Droplets, MapPin, CheckCircle,
  Search, TrendingUp, Clock
} from 'lucide-react'

const BLOOD_TYPES = ['All', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

const POOL_STATS = [
  { type: 'O−', total: 34,  eligible: 3,  unavailable: 12, unverified: 19, pct: 30,  critical: true  },
  { type: 'O+', total: 201, eligible: 28, unavailable: 88, unverified: 85, pct: 80,  critical: false },
  { type: 'A+', total: 178, eligible: 22, unavailable: 74, unverified: 82, pct: 65,  critical: false },
  { type: 'A−', total: 41,  eligible: 4,  unavailable: 17, unverified: 20, pct: 20,  critical: true  },
  { type: 'B+', total: 112, eligible: 14, unavailable: 49, unverified: 49, pct: 50,  critical: false },
  { type: 'B−', total: 22,  eligible: 1,  unavailable: 9,  unverified: 12, pct: 10,  critical: true  },
  { type: 'AB+',total: 89,  eligible: 11, unavailable: 38, unverified: 40, pct: 42,  critical: false },
  { type: 'AB−',total: 17,  eligible: 1,  unavailable: 7,  unverified: 9,  pct: 10,  critical: true  },
]

const MOCK_DONORS = [
  { id: 'BDEN-YDE-00412', name: 'Donor A', bloodType: 'O−', city: 'Yaoundé', distance: '2.1 km', status: 'eligible',     donations: 4, lastDonation: 'Mar 15, 2025' },
  { id: 'BDEN-YDE-00287', name: 'Donor B', bloodType: 'O−', city: 'Yaoundé', distance: '3.4 km', status: 'eligible',     donations: 2, lastDonation: 'Feb 2, 2025'  },
  { id: 'BDEN-YDE-00534', name: 'Donor C', bloodType: 'A+', city: 'Yaoundé', distance: '1.8 km', status: 'eligible',     donations: 7, lastDonation: 'Jan 20, 2025' },
  { id: 'BDEN-DLA-00102', name: 'Donor D', bloodType: 'A+', city: 'Douala',  distance: '245 km', status: 'unavailable',  donations: 3, lastDonation: 'Apr 1, 2025'  },
  { id: 'BDEN-YDE-00089', name: 'Donor E', bloodType: 'B+', city: 'Yaoundé', distance: '5.7 km', status: 'eligible',     donations: 1, lastDonation: 'Nov 12, 2024' },
  { id: 'BDEN-YDE-00743', name: 'Donor F', bloodType: 'B+', city: 'Yaoundé', distance: '4.1 km', status: 'unavailable',  donations: 5, lastDonation: 'May 1, 2025'  },
  { id: 'BDEN-YDE-00921', name: 'Donor G', bloodType: 'AB+',city: 'Yaoundé', distance: '6.2 km', status: 'eligible',     donations: 2, lastDonation: 'Dec 8, 2024'  },
  { id: 'BDEN-YDE-00311', name: 'Donor H', bloodType: 'O+', city: 'Yaoundé', distance: '3.0 km', status: 'eligible',     donations: 9, lastDonation: 'Feb 28, 2025' },
  { id: 'BDEN-BAF-00044', name: 'Donor I', bloodType: 'A−', city: 'Bafoussam', distance: '182 km', status: 'eligible',   donations: 3, lastDonation: 'Jan 5, 2025'  },
  { id: 'BDEN-YDE-00622', name: 'Donor J', bloodType: 'B−', city: 'Yaoundé', distance: '7.4 km', status: 'unverified',   donations: 0, lastDonation: '—'             },
]

const STATUS_CFG = {
  eligible:    { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Eligible'    },
  unavailable: { bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'Unavailable' },
  unverified:  { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Unverified'  },
}

export default function DonorPool() {
  const [search, setSearch] = useState('')
  const [bloodFilter, setBloodFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')

  const totalDonors = POOL_STATS.reduce((a, s) => a + s.total, 0)
  const totalEligible = POOL_STATS.reduce((a, s) => a + s.eligible, 0)
  const criticalTypes = POOL_STATS.filter(s => s.critical)

  const visibleDonors = MOCK_DONORS.filter(d => {
    const matchBlood = bloodFilter === 'All' || d.bloodType === bloodFilter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchSearch = d.id.toLowerCase().includes(search.toLowerCase()) ||
                        d.city.toLowerCase().includes(search.toLowerCase()) ||
                        d.bloodType.toLowerCase().includes(search.toLowerCase())
    return matchBlood && matchStatus && matchSearch
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Donor Pool</h1>
        <p className="text-neutral-500 text-sm mt-1">Overview of registered donors available near your facility</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered Donors', value: totalDonors.toLocaleString(), icon: Users,      color: 'blue'  },
          { label: 'Currently Eligible',      value: totalEligible,                icon: CheckCircle,color: 'green' },
          { label: 'Critical Blood Types',    value: criticalTypes.length,         icon: Droplets,   color: 'red'   },
          { label: 'Avg Response Time',       value: '18 min',                     icon: Clock,      color: 'amber' },
        ].map(({ label, value, icon: Icon, color }) => {
          const c = { blue: 'bg-blue-50 text-blue-600 border-blue-100', green: 'bg-emerald-50 text-emerald-600 border-emerald-100', red: 'bg-red-50 text-red-600 border-red-100', amber: 'bg-amber-50 text-amber-600 border-amber-100' }
          return (
            <div key={label} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-4 ${c[color]}`}>
                <Icon size={17} />
              </div>
              <p className="text-2xl font-display font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-500 mt-1">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Blood type breakdown */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-100">
          <Droplets size={16} className="text-blood-600" />
          <h2 className="font-display font-bold text-neutral-900">Eligible Donors by Blood Type</h2>
          <span className="ml-auto text-xs text-neutral-400">Within 10 km · Updated live</span>
        </div>

        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POOL_STATS.map(({ type, total, eligible, unavailable, unverified, pct, critical }) => (
            <div key={type} className={`rounded-2xl border p-4 ${critical ? 'border-red-200 bg-red-50' : 'border-neutral-100 bg-neutral-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`font-mono text-xl font-black ${critical ? 'text-red-600' : 'text-neutral-900'}`}>{type}</span>
                {critical && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full">LOW</span>
                )}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-500">Eligible</span>
                  <span className="font-bold text-neutral-700">{eligible}</span>
                </div>
                <div className="bg-neutral-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-neutral-500">
                  <span>Total registered</span><span className="font-semibold text-neutral-700">{total}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Unavailable</span><span>{unavailable}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Unverified</span><span className="text-amber-600">{unverified}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Critical alert */}
        {criticalTypes.length > 0 && (
          <div className="mx-6 mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <TrendingUp size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">Critical shortage:</span>{' '}
              {criticalTypes.map(t => t.type).join(', ')} blood types have fewer than 5 eligible donors.
              Consider posting an emergency request or launching a targeted campaign.
            </p>
          </div>
        )}
      </div>

      {/* Donor table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="font-display font-bold text-neutral-900 mb-3">Donor Registry</h2>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID, city, or blood type..."
                className="w-full border border-neutral-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blood-500 placeholder:text-neutral-400"
              />
            </div>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blood-500 bg-white"
            >
              <option value="all">All statuses</option>
              <option value="eligible">Eligible only</option>
              <option value="unavailable">Unavailable</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Blood type filter pills */}
          <div className="flex gap-1.5 flex-wrap mt-3">
            {BLOOD_TYPES.map(bt => (
              <button key={bt} onClick={() => setBloodFilter(bt)}
                className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border transition-all ${
                  bloodFilter === bt
                    ? 'bg-blood-600 text-white border-blood-600'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-blood-300'
                }`}>
                {bt}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                {['Donor ID', 'Blood Type', 'City', 'Distance', 'Status', 'Donations', 'Last Donation'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visibleDonors.map(donor => {
                const cfg = STATUS_CFG[donor.status]
                return (
                  <tr key={donor.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{donor.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-bold text-blood-600 bg-blood-50 px-2 py-0.5 rounded-md">{donor.bloodType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 flex items-center gap-1">
                      <MapPin size={11} className="text-neutral-400" /> {donor.city}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{donor.distance}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 font-semibold">{donor.donations}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{donor.lastDonation}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {visibleDonors.length === 0 && (
            <div className="text-center py-12 text-neutral-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No donors match your filters.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-neutral-100 text-xs text-neutral-400">
          Showing {visibleDonors.length} of {MOCK_DONORS.length} donors · Donor identities are anonymized to protect privacy
        </div>
      </div>
    </div>
  )
}
