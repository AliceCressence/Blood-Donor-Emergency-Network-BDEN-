// src/pages/donor/DonorCard.jsx
import { useState, useRef } from 'react'
import { Droplets, Shield, Calendar, Download, Share2, CheckCircle, QrCode } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const MOCK_DONOR = {
  name: 'Alice Cressence',
  bloodType: 'A+',
  donorId: 'BDEN-YDE-00412',
  status: 'verified',
  totalDonations: 4,
  nextEligible: 'July 15, 2026',
  donorSince: 'February 2025',
  city: 'Yaoundé',
  phone: '+237 653 93 68 99',
}

function CardFront({ donor }) {
  return (
    <div
      className="relative w-full aspect-[1.6/1] rounded-3xl overflow-hidden select-none"
      style={{
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 40%, #8B0000 100%)',
        boxShadow: '0 25px 60px rgba(139,0,0,0.4), 0 8px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeWidth="0.5"/>
              <circle cx="20" cy="20" r="10" fill="none" stroke="white" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circles)"/>
        </svg>
      </div>

      {/* Gradient orb */}
      <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-blood-500/30 rounded-full blur-3xl" />

      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 backdrop-blur-sm">
              <Droplets size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-display font-bold text-sm tracking-wide">BDEN</p>
              <p className="text-white/40 text-[10px] tracking-widest uppercase">Blood Donor Network</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-2.5 py-1 backdrop-blur-sm">
            <CheckCircle size={10} className="text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Verified</span>
          </div>
        </div>

        {/* Blood type — center hero */}
        <div className="flex items-center gap-4">
          <div>
            <p
              className="font-mono font-black leading-none"
              style={{
                fontSize: 'clamp(3rem, 8vw, 4.5rem)',
                background: 'linear-gradient(135deg, #ff4444, #ff8888)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              {donor.bloodType}
            </p>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mt-1">Blood Type</p>
          </div>
          <div className="h-16 w-px bg-white/10" />
          <div className="space-y-2">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest">Donations</p>
              <p className="text-white font-bold text-lg font-mono">{donor.totalDonations}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest">Donor Since</p>
              <p className="text-white text-xs">{donor.donorSince}</p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white font-semibold text-base">{donor.name}</p>
            <p className="text-white/40 text-[11px] font-mono tracking-wider mt-0.5">{donor.donorId}</p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-[9px] uppercase tracking-widest">Next eligible</p>
            <p className="text-white/70 text-xs">{donor.nextEligible}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardBack({ donor }) {
  return (
    <div
      className="relative w-full aspect-[1.6/1] rounded-3xl overflow-hidden select-none"
      style={{
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Magnetic strip */}
      <div className="absolute top-10 left-0 right-0 h-12 bg-neutral-800" />

      <div className="absolute inset-0 p-6 flex flex-col justify-between pt-28">
        {/* QR area */}
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2 shrink-0">
            <QrCode size={72} className="text-neutral-900" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-white/40 text-[9px] uppercase tracking-widest">Scan to verify donor</p>
            <p className="text-white text-xs font-mono">{donor.donorId}</p>
            <p className="text-white/50 text-[10px] mt-2 leading-relaxed">
              This card certifies that the holder is a registered blood donor in the BDEN network.
              Verify at <span className="text-red-400">bden.network/verify</span>
            </p>
          </div>
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-white/30" />
            <span className="text-white/30 text-[9px] tracking-wider">BDEN NETWORK · CAMEROON</span>
          </div>
          <span className="text-white/20 text-[9px] font-mono">v2.1</span>
        </div>
      </div>
    </div>
  )
}

export default function DonorCard() {
  const { user } = useAuth()
  const [flipped, setFlipped] = useState(false)
  const donor = {
    ...MOCK_DONOR,
    name: user?.name || MOCK_DONOR.name,
    bloodType: MOCK_DONOR.bloodType,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Virtual Donor Card</h1>
        <p className="text-neutral-500 text-sm mt-1">Your digital identity as a BDEN registered donor.</p>
      </div>

      {/* Card with flip */}
      <div className="space-y-4">
        <div
          className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
          onClick={() => setFlipped(f => !f)}
        >
          {flipped ? <CardBack donor={donor} /> : <CardFront donor={donor} />}
        </div>
        <p className="text-center text-xs text-neutral-400">
          Tap card to {flipped ? 'see front' : 'see back'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 bg-blood-600 hover:bg-blood-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors">
          <Download size={16} />
          Download Card
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors">
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="font-display font-bold text-neutral-900">Card Details</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {[
            { label: 'Donor ID', value: donor.donorId, mono: true },
            { label: 'Blood Type', value: donor.bloodType, mono: true },
            { label: 'Status', value: 'Verified Donor', badge: 'emerald' },
            { label: 'Total Donations', value: `${donor.totalDonations} donations` },
            { label: 'Donor Since', value: donor.donorSince },
            { label: 'Next Eligible', value: donor.nextEligible },
            { label: 'City', value: donor.city },
          ].map(({ label, value, mono, badge }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-neutral-500">{label}</span>
              {badge ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={11} /> {value}
                </span>
              ) : (
                <span className={`text-sm font-semibold text-neutral-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <Shield size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Your donor card is digitally signed by BDEN. Hospitals can scan the QR code on the back to instantly verify your donor status and blood type eligibility.
        </p>
      </div>
    </div>
  )
}
