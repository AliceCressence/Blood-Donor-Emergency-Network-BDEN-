// src/pages/donor/DonorDashboard.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, Clock, Award, AlertCircle, MapPin,
  ChevronRight, CheckCircle, Calendar, Droplets,
  TrendingUp, ArrowRight, Building2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ── Mock data (replaced by API in Phase 5) ────────────────────
const MOCK_DONATIONS = [
  { id: 1, hospital: 'Hôpital Central de Yaoundé',   date: 'Feb 10, 2026', type: 'O+', units: 1, verified: true  },
  { id: 2, hospital: 'Centre Hospitalier Universitaire', date: 'Oct 22, 2025', type: 'O+', units: 1, verified: true  },
  { id: 3, hospital: 'Fondation Chantal Biya',        date: 'Jul 5, 2025',  type: 'O+', units: 1, verified: true  },
]

const MOCK_EMERGENCY = {
  hospital: 'Hôpital Central de Yaoundé',
  bloodType: 'O−',
  urgency: 'Surgical emergency',
  units: 2,
  distance: '3.2 km',
  timeAgo: '4 min ago',
}

const MOCK_CAMPAIGNS = [
  {
    hospital: 'CHU de Yaoundé',
    date: 'May 20, 2026',
    types: ['O+', 'A+'],
    benefit: 'Free malaria screening',
    distance: '1.8 km',
  },
  {
    hospital: 'Fondation Chantal Biya',
    date: 'May 25, 2026',
    types: ['A−', 'B−'],
    benefit: 'BDEN loyalty card',
    distance: '4.1 km',
  },
]

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'blood', highlight = false }) {
  const colorMap = {
    blood:  { bg: 'bg-blood-50',  border: 'border-blood-100',  icon: 'text-blood-600',  text: 'text-blood-700'  },
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-100',   icon: 'text-teal-600',   text: 'text-teal-700'   },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-100',  icon: 'text-amber-600',  text: 'text-amber-700'  },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'text-blue-600',   text: 'text-blue-700'   },
  }
  const c = colorMap[color]
  return (
    <div className={`bg-white rounded-2xl border ${highlight ? 'border-blood-200 shadow-emergency/10' : 'border-warm-200'} shadow-card p-5`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
        <Icon size={18} className={c.icon} />
      </div>
      <p className="text-xs text-warm-500 font-medium mb-1">{label}</p>
      <p className={`font-display font-bold text-2xl ${highlight ? c.text : 'text-warm-950'}`}>{value}</p>
      {sub && <p className="text-xs text-warm-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function DonorDashboard() {
  const { user } = useAuth()
  const [respondedToEmergency, setRespondedToEmergency] = useState(false)

  const nextEligible = 'May 10, 2026'
  const daysUntilEligible = 0 // 0 = eligible now

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

      {/* ── Welcome header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-warm-500 mb-1"></p>
          <h1 className="font-display text-3xl font-bold text-warm-950">
            Welcome back, Alice
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                             bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700">
              <CheckCircle size={11} /> Verified donor
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                             bg-blood-50 border border-blood-200 text-xs font-mono font-bold text-blood-700">
              <Droplets size={11} /> {user?.bloodType || 'O+'}
            </span>
          </div>
        </div>
        <Link to="/donor/card"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-white border border-warm-200 shadow-card text-sm font-semibold
                     text-warm-700 hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <Award size={15} className="text-blood-500" />
          My donor card
        </Link>
      </div>

      {/* ── Emergency alert ── */}
      {!respondedToEmergency && (
        <div className="bg-white rounded-2xl border-2 border-blood-200 shadow-emergency/20 shadow-lg overflow-hidden animate-fade-in">
          <div className="bg-blood-600 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-white" />
              <span className="text-white font-semibold text-sm">Emergency request near you</span>
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
            </div>
            <span className="text-blood-200 text-xs">{MOCK_EMERGENCY.timeAgo}</span>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-xl bg-blood-50 border-2 border-blood-200
                              flex items-center justify-center flex-shrink-0">
                <span className="font-mono font-bold text-blood-700 text-lg">{MOCK_EMERGENCY.bloodType}</span>
              </div>
              <div>
                <p className="font-display font-semibold text-warm-900">{MOCK_EMERGENCY.urgency}</p>
                <p className="text-sm text-warm-500">{MOCK_EMERGENCY.hospital}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-warm-400">
                    <MapPin size={10} /> {MOCK_EMERGENCY.distance}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-warm-400">
                    <Droplets size={10} /> {MOCK_EMERGENCY.units} units needed
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setRespondedToEmergency(true)}
                className="btn-primary flex-1 sm:flex-none px-5 py-2.5">
                I can donate
              </button>
              <button
                onClick={() => setRespondedToEmergency(true)}
                className="btn-secondary flex-1 sm:flex-none px-5 py-2.5 text-sm">
                Not available
              </button>
            </div>
          </div>
        </div>
      )}

      {respondedToEmergency && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl px-6 py-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
          <p className="text-sm text-teal-800 font-medium">
            Response recorded. The hospital has been notified. Thank you!
          </p>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart}      label="Total donations"    value="3"          sub="Since joining BDEN"        color="blood"  highlight />
        <StatCard icon={TrendingUp} label="Lives impacted"     value="9"          sub="Each donation helps ~3"    color="teal"   />
        <StatCard icon={Clock}      label="Next eligible"      value={daysUntilEligible === 0 ? 'Now!' : `${daysUntilEligible}d`}
                  sub={daysUntilEligible === 0 ? 'You can donate today' : `From ${nextEligible}`}
                  color={daysUntilEligible === 0 ? 'teal' : 'amber'} />
        <StatCard icon={Award}      label="Benefits earned"    value="2"          sub="Claim on your donor card"  color="blue"   />
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Donation history */}
        <div className="bg-white rounded-2xl border border-warm-200 shadow-card">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-warm-100">
            <h2 className="font-display font-semibold text-warm-900">Donation history</h2>
            <Link to="/donor/card" className="text-xs text-blood-600 font-semibold hover:text-blood-700 flex items-center gap-1">
              View card <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-warm-100">
            {MOCK_DONATIONS.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-xl bg-blood-50 border border-blood-100
                                flex items-center justify-center flex-shrink-0">
                  <span className="font-mono font-bold text-blood-600 text-xs">{d.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-900 truncate">{d.hospital}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar size={10} className="text-warm-400" />
                    <span className="text-xs text-warm-400">{d.date}</span>
                  </div>
                </div>
                {d.verified && (
                  <span className="flex items-center gap-1 text-xs font-medium text-teal-600 flex-shrink-0">
                    <CheckCircle size={12} /> Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nearby campaigns */}
        <div className="bg-white rounded-2xl border border-warm-200 shadow-card">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-warm-100">
            <h2 className="font-display font-semibold text-warm-900">Campaigns near you</h2>
            <Link to="/donor/map" className="text-xs text-blood-600 font-semibold hover:text-blood-700 flex items-center gap-1">
              Open map <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-warm-100">
            {MOCK_CAMPAIGNS.map((c, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-warm-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-warm-900">{c.hospital}</p>
                  </div>
                  <span className="text-xs text-warm-400 flex-shrink-0 flex items-center gap-1">
                    <MapPin size={10} /> {c.distance}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {c.types.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-lg bg-blood-50 text-blood-700
                                             text-xs font-mono font-semibold border border-blood-100">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-teal-600">
                    <Award size={11} /> {c.benefit}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-warm-400">
                    <Calendar size={10} /> {c.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 pb-5 pt-2">
            <Link to="/campaigns"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                         bg-warm-50 border border-warm-200 text-sm font-semibold text-warm-600
                         hover:bg-warm-100 transition-colors">
              Browse all campaigns <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
