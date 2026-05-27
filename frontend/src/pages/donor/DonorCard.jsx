import { useState, useRef } from 'react'
import { Droplets, Shield, Download, Share2, CheckCircle, Smartphone, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const COMPATIBILITY = {
  'O−': ['O−', 'O+', 'A−', 'A+', 'B−', 'B+', 'AB−', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A−': ['A−', 'A+', 'AB−', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B−': ['B−', 'B+', 'AB−', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB−': ['AB−', 'AB+'],
  'AB+': ['AB+']
}

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

// ─── Tilt + Flip Card Wrapper ────────────────────────────────────────────────
// KEY FIX: Two nested divs.
//   Outer div  → tilt transform only, fast transition (follows mouse smoothly)
//   Inner div  → flip transform only, ALWAYS slow transition (never rushed by hover state)
function TiltCard({ children, onClick, flipped }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ x: dy * -8, y: dx * 8 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setHovering(false)
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer"
      style={{ perspective: '1200px' }}
    >
      {/* Outer: tilt only — fast so it tracks the cursor */}
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.12s ease-out',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovering ? 1.02 : 1})`,
        }}
      >
        {/* Inner: flip only — always slow regardless of hover */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)',
            transform: `rotateY(${flipped ? 180 : 0}deg)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Card Front ──────────────────────────────────────────────────────────────
function CardFront({ donor }) {
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden select-none"
      style={{
        aspectRatio: '1.6 / 1',
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 40%, #8B0000 100%)',
        boxShadow: '0 25px 60px rgba(139,0,0,0.4), 0 8px 20px rgba(0,0,0,0.5)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div className="absolute inset-0 opacity-10" style={{ transform: 'scale(1.5) rotate(-10deg)', transformOrigin: 'center' }}>
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

      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        <div className="flex items-center justify-between">
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

        <div className="flex items-center justify-end mt-4">
          <div className="text-right">
            <p className="font-mono font-black leading-none"
              style={{
                fontSize: '2.5rem',
                background: 'linear-gradient(135deg, #ff4444, #ff8888)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {donor.bloodType}
            </p>
            <p className="text-white/40 text-[10px] tracking-widest uppercase mt-1">Blood Type</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-white/80 text-xl md:text-2xl font-mono tracking-[0.2em] mb-2">
            {donor.donorId.replace(/-/g, ' ')}
          </p>

          <div className="flex items-center gap-1 mb-2">
            <span className="text-white/40 text-[9px] uppercase tracking-widest mr-1.5">Gives to</span>
            {COMPATIBILITY[donor.bloodType]?.map(type => (
               <span key={type} className="bg-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{type}</span>
            ))}
          </div>

          <div className="flex items-end justify-between mt-3">
            <div className="min-w-0 pr-2">
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Cardholder Name</p>
              <p className="text-white font-semibold text-lg uppercase tracking-wide truncate">{donor.name}</p>
            </div>
            <div className="flex gap-4 text-right shrink-0">
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest">Valid From</p>
                <p className="text-white/90 text-sm font-medium mt-0.5">{(typeof donor.donorSince === 'string' && donor.donorSince.split(' ').length > 1) ? donor.donorSince.split(' ')[1] : donor.donorSince}</p>
              </div>
              <div>
                <p className="text-white/30 text-[9px] uppercase tracking-widest">Gifts</p>
                <p className="text-white/90 text-sm font-bold mt-0.5 font-mono">{String(donor.totalDonations).padStart(2, '0')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Card Back ───────────────────────────────────────────────────────────────
function CardBack({ donor }) {
  const serialId = (donor.donorId.replace(/-/g, '') + 'X9Q').substring(0, 16)
    .toUpperCase().replace(/(.{4})/g, '\ ').trim()
  
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden select-none"
      style={{
        aspectRatio: '1.6 / 1',
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        position: 'absolute',
        inset: 0,
      }}
    >
      <div className="absolute top-8 left-0 right-0 h-12 bg-black" />

      <div className="absolute inset-0 p-6 flex flex-col justify-between pt-24 text-white/50">
        
        <div className="flex flex-col gap-4">
          <p className="text-[10px] leading-relaxed max-w-sm">
            This card is the property of BDEN. It certifies that the holder is a registered blood donor.
            If found, please return to any BDEN affiliated hospital or contact us directly.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm">
             <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone size={12} className="text-white/40" />
                  <span className="text-xs text-white/80">{donor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-white/40" />
                  <span className="text-xs text-white/80">{donor.city}, CM</span>
                </div>
             </div>
             
             <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Serial identifier</p>
                <p className="font-mono text-xs text-white/70">{serialId}</p>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-white/30" />
            <span className="text-[9px] tracking-wider">BDEN NETWORK · CAMEROON</span>
          </div>
          <span className="text-[9px] font-mono">v2.2</span>
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
    bloodType: user?.bloodType || MOCK_DONOR.bloodType,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Virtual Donor Card</h1>
        <p className="text-neutral-500 text-sm mt-1">Your digital identity as a BDEN registered donor.</p>
      </div>

      <div className="space-y-3">
        <TiltCard onClick={() => setFlipped(f => !f)} flipped={flipped}>
          <div style={{ position: 'relative', transformStyle: 'preserve-3d' }}>
            <CardFront donor={donor} />
            <CardBack donor={donor} />
          </div>
        </TiltCard>
        <p className="text-center text-xs text-neutral-400 select-none">
          {flipped ? '← Tap to flip back' : 'Tap card to see back →'}
        </p>
      </div>

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

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="font-display font-bold text-neutral-900">Card Details</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {[
            { label: 'Donor ID',        value: donor.donorId,                mono: true  },
            { label: 'Blood Type',      value: donor.bloodType,              mono: true  },
            { label: 'Status',          value: 'Verified Donor',             badge: true },
            { label: 'Total Donations', value: `${donor.totalDonations} donations`       },
            { label: 'Next Eligible',   value: donor.nextEligible                        },
            { label: 'Member Since',    value: donor.donorSince                          },
          ].map((item, i) => (
            <div key={i} className="px-6 py-3 flex justify-between items-center bg-gray-50/50">
              <span className="text-sm font-medium text-neutral-500">{item.label}</span>
              {item.badge ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  {item.value}
                </span>
              ) : (
                <span className={`text-sm text-neutral-900 ${item.mono ? 'font-mono bg-neutral-100 px-2 py-0.5 rounded' : 'font-semibold'}`}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
