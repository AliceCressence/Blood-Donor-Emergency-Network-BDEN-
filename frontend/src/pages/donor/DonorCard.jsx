// src/pages/donor/DonorCard.jsx
import { useState, useRef } from 'react'
import { Droplets, Shield, Calendar, Download, Share2, CheckCircle } from 'lucide-react'
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

// ─── Branded QR Code ────────────────────────────────────────────────────────
function BrandedQR({ donorId }) {
  const size = 120
  const cellSize = size / 9
  const dataCells = [
    [0,3],[0,5],[1,4],[1,6],[2,3],[2,4],[2,6],[2,8],
    [3,0],[3,2],[3,5],[3,7],[4,1],[4,3],[4,5],[4,8],
    [5,0],[5,2],[5,4],[5,6],[5,8],[6,1],[6,3],[6,5],
    [7,2],[7,4],[7,6],[8,1],[8,3],[8,5],[8,7],
  ]
  const finderPatterns = [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 0, y: 6 }]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" rx="10" />
      {finderPatterns.map((fp, i) => {
        const ox = fp.x * cellSize
        const oy = fp.y * cellSize
        const outer = cellSize * 3
        return (
          <g key={i}>
            <rect x={ox+1} y={oy+1} width={outer-2} height={outer-2} rx={cellSize*0.5} ry={cellSize*0.5} fill="#1a0a0a" />
            <rect x={ox+cellSize*0.7} y={oy+cellSize*0.7} width={outer-cellSize*1.4} height={outer-cellSize*1.4} rx={cellSize*0.3} ry={cellSize*0.3} fill="white" />
            <rect x={ox+cellSize*1.2} y={oy+cellSize*1.2} width={cellSize*0.6} height={cellSize*0.6} rx={cellSize*0.15} ry={cellSize*0.15} fill="#8B0000" />
          </g>
        )
      })}
      {dataCells.map(([col, row], i) => (
        <circle key={i} cx={col*cellSize+cellSize/2} cy={row*cellSize+cellSize/2} r={cellSize*0.32} fill="#1a0a0a" />
      ))}
      <circle cx={size/2} cy={size/2} r={cellSize*1.1} fill="white" />
      <g transform={`translate(${size/2-cellSize*0.75}, ${size/2-cellSize*0.85})`}>
        <path
          d={`M${cellSize*0.75},0 C${cellSize*0.75},0 0,${cellSize*0.9} 0,${cellSize*1.15} a${cellSize*0.75},${cellSize*0.75} 0 0,0 ${cellSize*1.5},0 C${cellSize*1.5},${cellSize*0.9} ${cellSize*0.75},0 ${cellSize*0.75},0z`}
          fill="#8B0000"
        />
        <ellipse cx={cellSize*0.55} cy={cellSize*0.85} rx={cellSize*0.12} ry={cellSize*0.18} fill="white" opacity="0.4" />
      </g>
    </svg>
  )
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
      <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-blood-500/30 rounded-full blur-3xl" />

      <div className="absolute inset-0 p-6 flex flex-col justify-between">
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

        <div className="flex items-center gap-6">
          <div>
            <p
              className="font-mono font-black leading-none"
              style={{
                fontSize: 'clamp(3rem, 8vw, 4.5rem)',
                background: 'linear-gradient(135deg, #ff4444, #ff8888)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {donor.bloodType}
            </p>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mt-1">Blood Type</p>
          </div>
          <div className="h-16 w-px bg-white/10" />
          <div className="flex gap-6">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest">Donations</p>
              <p className="text-white font-bold text-2xl font-mono">{donor.totalDonations}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest">Member since</p>
              <p className="text-white text-sm font-medium mt-0.5">{donor.donorSince}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-widest">City</p>
              <p className="text-white text-sm font-medium mt-0.5">{donor.city}</p>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-white font-semibold text-base">{donor.name}</p>
            <p className="text-white/40 text-[11px] font-mono tracking-wider mt-0.5">{donor.donorId}</p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-[9px] uppercase tracking-widest">Next eligible</p>
            <p className="text-white/70 text-xs mt-0.5">{donor.nextEligible}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Card Back ───────────────────────────────────────────────────────────────
function CardBack({ donor }) {
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden select-none"
      style={{
        aspectRatio: '1.6 / 1',
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        // Back face is pre-rotated 180° so it appears correctly when the parent flips
        transform: 'rotateY(180deg)',
        // Must be positioned absolutely to sit on top of front face
        position: 'absolute',
        inset: 0,
      }}
    >
      <div className="absolute top-10 left-0 right-0 h-10 bg-neutral-800" />

      <div className="absolute inset-0 p-6 flex flex-col justify-between pt-26">
        <div className="flex items-start gap-5 mt-8">
          <div className="shrink-0 rounded-2xl overflow-hidden shadow-lg" style={{ background: 'white', padding: 6 }}>
            <BrandedQR donorId={donor.donorId} />
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <p className="text-white/40 text-[9px] uppercase tracking-widest">Scan to verify donor</p>
            <p className="text-white text-xs font-mono">{donor.donorId}</p>
            <p className="text-white/50 text-[10px] leading-relaxed mt-1">
              This card certifies that the holder is a registered blood donor in the BDEN network.
              Verify at <span className="text-red-400">bden.network/verify</span>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[9px] font-bold text-white/50 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 uppercase tracking-wider">
                {donor.bloodType}
              </span>
              <span className="text-[9px] font-bold text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                Verified
              </span>
            </div>
          </div>
        </div>

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

// ─── Page ────────────────────────────────────────────────────────────────────
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
          {/* Wrapper needs relative + preserve-3d so CardBack's absolute positioning works */}
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
            { label: 'Donor Since',     value: donor.donorSince                          },
            { label: 'Next Eligible',   value: donor.nextEligible                        },
            { label: 'City',            value: donor.city                                },
          ].map(({ label, value, mono, badge }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-neutral-500">{label}</span>
              {badge ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={11} /> {value}
                </span>
              ) : (
                <span className={`text-sm font-semibold text-neutral-900 ${mono ? 'font-mono' : ''}`}>
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <Shield size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Your donor card is digitally signed by BDEN. Hospitals can scan the QR code on the back
          to instantly verify your donor status and blood type eligibility.
        </p>
      </div>
    </div>
  )
}