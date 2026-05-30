import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Shield, Download, Share2, CheckCircle, Smartphone, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { donorApi } from '../../services/app.service'
import { CardShimmer, ErrorState } from '../../components/shared/DataStates'

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

const formatDate = (value, fallback = 'Not set yet') => {
  if (!value) return fallback
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const normalizeBloodType = value => (value || 'Unset').replace('-', '−')

const initialsFromId = value => {
  if (!value) return 'BDEN'
  return value.replace(/-/g, '').slice(-8).toUpperCase()
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
              <img src="/favicon.svg" alt="BDEN" className="w-5 h-5" />
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
                fontSize: '3.75rem',
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
    .toUpperCase().replace(/(.{4})/g, '$1 ').trim()
  
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
            <img src="/favicon.svg" alt="BDEN" className="w-4 h-4 opacity-35 grayscale" />
            <span className="text-[9px] tracking-wider">BDEN NETWORK · CAMEROON</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[9px] font-mono">
            <Shield size={12} className="text-white/30" />
            v2.2
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DonorCard() {
  const { user } = useAuth()
  const [flipped, setFlipped] = useState(false)
  const [profile, setProfile] = useState(null)
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadCard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [profileData, cardData] = await Promise.all([
        donorApi.getProfile(),
        donorApi.getCard().catch(() => null),
      ])
      setProfile(profileData)
      setCard(cardData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { loadCard() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadCard])

  const donor = useMemo(() => {
    const donorId = card?.card_number || `BDEN-${initialsFromId(user?.id)}`
    return {
      name: card?.donor_name || profile?.full_name || user?.name || user?.email || 'BDEN donor',
      bloodType: normalizeBloodType(card?.blood_type || profile?.blood_type || user?.bloodType),
      donorId,
      status: profile?.blood_type_verified ? 'Verified donor' : 'Registered donor',
      totalDonations: card?.total_donations ?? profile?.total_donations ?? 0,
      totalVolume: card?.total_volume_ml ?? profile?.total_volume_ml ?? 0,
      nextEligible: formatDate(card?.next_eligible_date || profile?.next_eligible_date),
      donorSince: formatDate(card?.issued_at || profile?.created_at, 'Recently joined'),
      city: profile?.city || 'City not set',
      phone: profile?.phone || 'Phone not set',
    }
  }, [card, profile, user])

  const showNotice = message => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const downloadCard = async () => {
    const scale = 3
    const width = 960
    const height = 600
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }

    const label = (text, x, y) => {
      ctx.save()
      ctx.globalAlpha = 0.44
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 13px Arial'
      ctx.letterSpacing = '3px'
      ctx.fillText(text, x, y)
      ctx.restore()
    }

    const fitText = (text, x, y, maxWidth, initialSize, weight = 700) => {
      let size = initialSize
      ctx.font = `${weight} ${size}px Arial`
      while (ctx.measureText(text).width > maxWidth && size > 18) {
        size -= 2
        ctx.font = `${weight} ${size}px Arial`
      }
      ctx.fillText(text, x, y)
    }

    roundRect(0, 0, width, height, 38)
    ctx.clip()

    const bg = ctx.createLinearGradient(0, 0, width, height)
    bg.addColorStop(0, '#1a0a0a')
    bg.addColorStop(0.42, '#2d0f0f')
    bg.addColorStop(1, '#8B0000')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.globalAlpha = 0.06
    ctx.strokeStyle = '#ffffff'
    for (let x = -80; x < width + 80; x += 56) {
      for (let y = -80; y < height + 80; y += 56) {
        ctx.beginPath()
        ctx.arc(x, y, 24, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(760, 120, 170, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(855, 510, 250, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    roundRect(56, 48, 52, 52, 14)
    ctx.fillStyle = 'rgba(255,255,255,.10)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.22)'
    ctx.stroke()
    try {
      const logo = new Image()
      logo.src = '/favicon.svg'
      await logo.decode()
      ctx.drawImage(logo, 68, 60, 28, 28)
    } catch {
      ctx.fillStyle = '#e51111'
      ctx.beginPath()
      ctx.arc(82, 74, 14, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = '#ffffff'
    ctx.font = '800 25px Arial'
    ctx.fillText('BDEN', 122, 70)
    ctx.save()
    ctx.globalAlpha = 0.42
    ctx.font = '700 12px Arial'
    ctx.fillText('BLOOD DONOR NETWORK', 122, 93)
    ctx.restore()

    roundRect(750, 50, 148, 34, 17)
    ctx.fillStyle = 'rgba(16,185,129,.18)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(110,231,183,.34)'
    ctx.stroke()
    ctx.fillStyle = '#34d399'
    ctx.font = '800 12px Arial'
    ctx.fillText(donor.status.toUpperCase(), 768, 72)

    const blood = ctx.createLinearGradient(638, 130, 850, 282)
    blood.addColorStop(0, '#ff4444')
    blood.addColorStop(1, '#ff9a9a')
    ctx.fillStyle = blood
    ctx.font = '900 120px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(donor.bloodType, 870, 278)
    ctx.textAlign = 'left'
    label('BLOOD TYPE', 723, 315)

    ctx.fillStyle = 'rgba(255,255,255,.82)'
    ctx.font = '700 34px Arial'
    ctx.fillText(donor.donorId.replace(/-/g, ' '), 56, 325)

    label('GIVES TO', 56, 370)
    let pillX = 134
    ;(COMPATIBILITY[donor.bloodType] || []).slice(0, 8).forEach(type => {
      roundRect(pillX, 350, 43, 25, 7)
      ctx.fillStyle = 'rgba(255,255,255,.12)'
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '800 12px Arial'
      ctx.fillText(type, pillX + 10, 367)
      pillX += 49
    })

    label('CARDHOLDER NAME', 56, 440)
    ctx.fillStyle = '#ffffff'
    fitText(donor.name.toUpperCase(), 56, 482, 500, 30, 800)

    label('VALID FROM', 620, 440)
    ctx.fillStyle = 'rgba(255,255,255,.90)'
    fitText(donor.donorSince, 620, 482, 140, 22, 700)
    label('GIFTS', 802, 440)
    ctx.fillStyle = 'rgba(255,255,255,.90)'
    ctx.font = '800 24px Arial'
    ctx.fillText(String(donor.totalDonations).padStart(2, '0'), 802, 482)

    ctx.save()
    ctx.globalAlpha = 0.38
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(56, 525)
    ctx.lineTo(904, 525)
    ctx.stroke()
    ctx.font = '700 13px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`BDEN NETWORK · CAMEROON · ${donor.city}`, 56, 556)
    ctx.restore()

    canvas.toBlob(blob => {
      if (!blob) {
        showNotice('Could not prepare the PNG. Please try again.')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${donor.donorId || 'bden-donor-card'}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      showNotice('Card downloaded as a PNG.')
    }, 'image/png', 1)
  }

  const shareCard = async () => {
    const text = `${donor.name} · ${donor.bloodType} · ${donor.donorId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My BDEN donor card', text, url: window.location.href })
        return
      }
      await navigator.clipboard.writeText(text)
      showNotice('Card details copied to clipboard.')
    } catch {
      showNotice('Sharing was cancelled.')
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto"><CardShimmer rows={8} /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {error && <ErrorState message={error} onRetry={loadCard} />}
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900">Virtual Donor Card</h1>
        <p className="text-neutral-500 text-sm mt-1">Your digital identity as a BDEN registered donor.</p>
        {notice && <p className="text-xs font-semibold text-emerald-700 mt-2">{notice}</p>}
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
        <button onClick={downloadCard} className="flex-1 flex items-center justify-center gap-2 bg-blood-600 hover:bg-blood-700 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors">
          <Download size={16} />
          Download Card
        </button>
        <button onClick={shareCard} className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors">
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
            { label: 'Status',          value: donor.status,                 badge: true },
            { label: 'Total Donations', value: `${donor.totalDonations} donation${donor.totalDonations === 1 ? '' : 's'}` },
            { label: 'Total Volume',    value: `${donor.totalVolume} ml`                 },
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
