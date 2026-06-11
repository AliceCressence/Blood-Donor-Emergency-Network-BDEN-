// src/pages/public/LandingPage.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Droplets, AlertCircle, Heart, MapPin, Shield, Users,
  Building2, ChevronRight, Clock, CheckCircle, ArrowRight,
  TrendingUp, Zap, BookOpen, Phone, Mail, Globe,
  Activity, Award, Maximize2, Minimize2, XCircle
} from 'lucide-react'
import { campaignApi, mythApi } from '../../services/app.service'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import HeroSection from '../../components/layout/HeroSection'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ─── DATA ────────────────────────────────────────────────────────

const STATS = [
  { value: 12480, suffix: '+', label: 'Registered donors',   icon: Users,     color: 'text-blood-500' },
  { value: 89,    suffix: '',  label: 'Partner hospitals',   icon: Building2, color: 'text-teal-500'  },
  { value: 3240,  suffix: '+', label: 'Lives impacted',      icon: Heart,     color: 'text-blood-500' },
  { value: 94,    suffix: '%', label: 'Emergency match rate', icon: Zap,       color: 'text-amber-500' },
]

const HOW_IT_WORKS = [
  {
    role: 'Donors',
    color: 'blood',
    icon: Heart,
    steps: [
      { icon: Users,        title: 'Register in minutes',    desc: "Don't know your blood type? No problem — our AI guides you through an estimation flow." },
      { icon: MapPin,       title: 'Set your location',      desc: 'Your exact location is never exposed. Only hospitals within your radius can send alerts.' },
      { icon: Zap,          title: 'Respond to emergencies', desc: 'Get notified instantly when a compatible patient needs you. One tap to respond.' },
      { icon: Award,        title: 'Build your donor card',  desc: 'Every verified donation earns you benefits — medical exams, priority access, and community recognition.' },
    ],
  },
  {
    role: 'Hospitals',
    color: 'teal',
    icon: Building2,
    steps: [
      { icon: Shield,       title: 'Verified facility account', desc: 'Admin-verified onboarding ensures only licensed, operating health facilities access the system.' },
      { icon: AlertCircle,  title: 'Post emergency requests',   desc: 'Specify blood type, urgency, and location. Matching donors are notified in seconds.' },
      { icon: Activity,     title: 'Organize campaigns',        desc: 'Plan donation drives with target blood types, collection goals, and donor incentives.' },
      { icon: TrendingUp,   title: 'Track in real time',        desc: 'Monitor request status, campaign progress, and your donor community from one dashboard.' },
    ],
  },
]

const VOICES = [
  {
    quote: 'I was nervous the first time. Then a nurse told me the bag beside me could mean someone gets another birthday.',
    author: 'Mireille',
    role: 'First-time donor',
  },
  {
    quote: 'The hardest part was deciding to go. The calmest part was sitting there, realizing my body had something useful to give.',
    author: 'Arnaud',
    role: 'Voluntary donor',
  },
  {
    quote: 'When a request is urgent, clarity matters. A donor who knows where to go and why can move faster than a whole phone tree.',
    author: 'BDEN partner facility',
    role: 'Hospital team',
  },
  {
    quote: 'I did not feel heroic. I felt human. That was enough.',
    author: 'Anonymous',
    role: 'Community donor',
  },
]

// ─── ANIMATED COUNTER ────────────────────────────────────────────

function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

function StatCard({ value, suffix, label, icon: Icon, color, animate }) {
  const count = useCounter(value, 2200, animate)
  return (
    <div className="flex flex-col items-center text-center p-6">
      <Icon size={22} className={`mb-3 ${color}`} />
      <span className={`font-display text-4xl font-bold ${color}`}>
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-sm text-warm-500 mt-1 font-body">{label}</span>
    </div>
  )
}

// ─── INTERSECTION OBSERVER HOOK ──────────────────────────────────

function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─── BLOOD TYPE PILL ─────────────────────────────────────────────

function BloodPill({ type }) {
  return (
    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg
                     bg-blood-50 text-blood-700 text-xs font-mono font-semibold
                     border border-blood-100">
      {type}
    </span>
  )
}

function VoicesSpotlight() {
  const [active, setActive] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [progressKey, setProgressKey] = useState(0) // Used to restart progress bar animation
  const current = VOICES[active]

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(index => (index + 1) % VOICES.length)
      setProgressKey(prev => prev + 1)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  const next = () => {
    setActive(index => (index + 1) % VOICES.length)
    setProgressKey(prev => prev + 1)
  }
  const prev = () => {
    setActive(index => (index - 1 + VOICES.length) % VOICES.length)
    setProgressKey(prev => prev + 1)
  }

  const quoteBlock = (
    <div key={active} className="animate-[voiceFade_900ms_ease_both] text-center">
      <p className="mx-auto max-w-4xl font-display text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
        “{current.quote}”
      </p>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.28em] text-blood-100">
        {current.author}{current.role ? ` · ${current.role}` : ''}
      </p>
    </div>
  )

  return (
    <>
      <section className="relative min-h-[76vh] overflow-hidden bg-blood-700">
        <div className="absolute inset-0 opacity-30">
          <div className="voice-lines absolute inset-0" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.18),transparent_35%),linear-gradient(180deg,rgba(133,18,18,.1),rgba(38,15,12,.85))]" />
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-30">
          <div 
            key={progressKey}
            className="h-full bg-white/40 origin-left animate-progressFill"
          />
        </div>

        <div className="relative z-10 flex min-h-[76vh] items-center justify-center px-6 py-24">
          {quoteBlock}
        </div>
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-xl">
          <button onClick={prev} className="rounded-xl px-3 py-2 text-sm font-bold text-white hover:bg-white/10">Prev</button>
          <button onClick={next} className="rounded-xl px-3 py-2 text-sm font-bold text-white hover:bg-white/10">Next</button>
          <button onClick={() => setExpanded(true)} className="rounded-xl bg-white px-3 py-2 text-blood-700 shadow-lg hover:bg-blood-50" aria-label="Open spotlight fullscreen">
            <Maximize2 size={16} />
          </button>
        </div>
      </section>

      {expanded && (
        <div className="fixed inset-0 z-[1600] overflow-hidden bg-blood-800 animate-[spotlightExpand_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <div className="absolute inset-0 opacity-35"><div className="voice-lines absolute inset-0" /></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.2),transparent_34%),linear-gradient(180deg,rgba(229,17,17,.15),rgba(17,16,13,.92))]" />
          
          {/* Progress Bar for Fullscreen */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/20 z-30">
            <div 
              key={progressKey}
              className="h-full bg-white/40 origin-left animate-progressFill"
            />
          </div>

          <div className="absolute left-8 top-8 z-20 flex items-center gap-3">
            <img src="/favicon.svg" alt="BDEN" className="h-11 w-11 rounded-2xl bg-white shadow-xl" />
            <span className="font-display text-lg font-bold text-white">BDEN Voices</span>
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            {quoteBlock}
          </div>
          <p className="absolute bottom-8 left-8 z-20 text-xs text-white/55">© 2026 BDEN. Shared human experiences from the network.</p>
          <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-xl">
            <button onClick={prev} className="rounded-xl px-3 py-2 text-sm font-bold text-white hover:bg-white/10">Prev</button>
            <button onClick={next} className="rounded-xl px-3 py-2 text-sm font-bold text-white hover:bg-white/10">Next</button>
            <button onClick={() => setExpanded(false)} className="rounded-xl bg-white px-3 py-2 text-blood-700 shadow-lg hover:bg-blood-50" aria-label="Close spotlight fullscreen">
              <Minimize2 size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── CAMPAIGN CARD ───────────────────────────────────────────────

function CampaignCard({ campaign, delay }) {
  const pct = campaign.target ? Math.round((campaign.current / campaign.target) * 100) : 0
  return (
    <div
      className="bg-white rounded-2xl border border-warm-200 shadow-card p-6
                 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      {campaign.urgent && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blood-500 animate-pulse" />
          <span className="text-xs font-semibold text-blood-600 uppercase tracking-wide">Urgent need</span>
        </div>
      )}
      <h3 className="font-display font-semibold text-warm-900 text-base leading-tight mb-1">
        {campaign.hospital}
      </h3>
      <div className="flex items-center gap-1.5 text-xs text-warm-400 mb-4">
        <MapPin size={11} />
        <span>{campaign.location}</span>
        <span className="mx-1">·</span>
        <Clock size={11} />
        <span>{campaign.date}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {campaign.types.map(t => <BloodPill key={t} type={t} />)}
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-warm-500 mb-1.5">
          <span>{campaign.current} donors</span>
          <span>Goal: {campaign.target || 'open'}</span>
        </div>
        <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blood-500 to-blood-400 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-warm-400 mt-1">{pct}% of goal reached</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
        <Award size={13} className="text-teal-600 flex-shrink-0 mt-0.5" />
        <span className="text-xs text-teal-700">{campaign.benefit}</span>
      </div>
    </div>
  )
}

// ─── IMPACT CHART SECTION ────────────────────────────────────────

function ImpactChartSection() {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Donations Collected',
        data: [1200, 1900, 1500, 2200, 2800, 3100],
        borderColor: '#14B8A6', // teal-500
        backgroundColor: 'rgba(20, 184, 166, 0.15)', // teal translucent
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#14B8A6',
      },
      {
        label: 'Emergency Requests',
        data: [800, 1100, 950, 1300, 1600, 1400],
        borderColor: '#E51111', // blood-600
        backgroundColor: 'rgba(229, 17, 17, 0.1)', // blood translucent
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#E51111',
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'DM Sans' }, color: '#666358', usePointStyle: true, padding: 20 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#E8E7E1', borderDash: [4, 4] },
        ticks: { color: '#7F7C6E', padding: 10 }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#7F7C6E', padding: 10 }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  return (
    <section className="py-24 bg-warm-50 relative overflow-hidden">
      <div className="page-container relative z-10">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-3 block">
            Impact Metrics
          </span>
          <h2 className="font-display text-4xl font-bold text-warm-900 tracking-tight mb-3">
            Real-time Network Activity
          </h2>
          <p className="text-warm-500 text-base max-w-xl mx-auto">
            See how the community is responding to regional blood shortages over the last six months.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-card border border-warm-200">
          <div className="h-[350px] w-full">
            <Line data={data} options={options} />
          </div>
        </div>
      </div>
    </section>
  )
}


// ─── MAIN COMPONENT ──────────────────────────────────────────────

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState(0)
  const [campaigns, setCampaigns] = useState([])
  const [myths, setMyths] = useState([])
  const [statsRef, statsInView] = useInView(0.3)
  const [howRef,   howInView]   = useInView(0.2)

  useEffect(() => {
    campaignApi.list().then(data => {
      setCampaigns(data.slice(0, 3).map(item => ({
        hospital: item.hospitalName,
        location: [item.city, item.address].filter(Boolean).join(', ') || 'Cameroon',
        types: item.bloodTypes.length ? item.bloodTypes : ['All'],
        target: item.targetDonors,
        current: item.actualDonors,
        date: item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Soon',
        benefit: item.incentives || 'Warm welcome from the hospital team',
        urgent: item.bloodTypes.includes('O−'),
      })))
    }).catch(() => setCampaigns([]))
    mythApi.list().then(data => {
      setMyths(data.slice(0, 3).map(item => ({
        myth: item.myth_statement,
        truth: item.truth_statement,
        source: item.source || 'BDEN medical review',
      })))
    }).catch(() => setMyths([]))
  }, [])

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <HeroSection />


      {/* ══════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════ */}
      <section ref={statsRef} className="bg-white border-y border-warm-200">
        <div className="page-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-warm-100">
            {STATS.map((s) => (
              <StatCard key={s.label} {...s} animate={statsInView} />
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section ref={howRef} className="py-24 bg-warm-50">
        <div className="page-container">

          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-blood-500 mb-3 block">
              Platform overview
            </span>
            <h2 className="section-title text-center">Built for every actor in the chain</h2>
            <p className="section-subtitle mx-auto text-center mt-3">
              Whether you are a donor, a health facility, or simply curious —
              BDEN has a clear path for you.
            </p>
          </div>

          {/* Role tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white border border-warm-200 rounded-2xl p-1.5 shadow-card gap-1">
              {HOW_IT_WORKS.map((r, i) => (
                <button
                  key={r.role}
                  onClick={() => setActiveRole(i)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                              transition-all duration-200
                              ${activeRole === i
                                ? i === 0
                                  ? 'bg-blood-600 text-white shadow-emergency'
                                  : 'bg-teal-600 text-white'
                                : 'text-warm-500 hover:text-warm-800 hover:bg-warm-50'}`}
                >
                  <r.icon size={15} />
                  {r.role}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300 ${howInView ? 'animate-fade-in' : 'opacity-0'}`}>
            {HOW_IT_WORKS[activeRole].steps.map((step, i) => (
              <div key={step.title}
                   className="bg-white rounded-2xl border border-warm-200 shadow-card p-6
                              hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                   style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4
                                 ${activeRole === 0 ? 'bg-blood-50' : 'bg-teal-50'}`}>
                  <step.icon size={18} className={activeRole === 0 ? 'text-blood-600' : 'text-teal-600'} />
                </div>
                <div className={`text-xs font-mono font-bold mb-2
                                 ${activeRole === 0 ? 'text-blood-400' : 'text-teal-400'}`}>
                  STEP {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="font-display font-semibold text-warm-900 mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-sm text-warm-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          ACTIVE CAMPAIGNS
      ══════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="page-container">

          <div className="flex items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-500 mb-3 block">
                Live campaigns
              </span>
              <h2 className="section-title">Upcoming donation drives</h2>
              <p className="section-subtitle mt-2">
                Verified hospitals near you are organizing campaigns.
                Show up, donate, and earn benefits.
              </p>
            </div>
            <Link to="/campaigns"
                  className="hidden md:inline-flex items-center gap-2 text-sm font-semibold
                             text-blood-600 hover:text-blood-700 whitespace-nowrap">
              View all campaigns <ChevronRight size={15} />
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50 p-8 text-center text-warm-500">
              Approved campaigns will appear here as hospitals publish them.
            </div>
          ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c, i) => (
              <CampaignCard key={c.hospital} campaign={c} delay={i * 100} />
            ))}
          </div>
          )}

          <div className="md:hidden text-center mt-8">
            <Link to="/campaigns" className="text-sm font-semibold text-blood-600">
              View all campaigns →
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          MYTH DEBUNKING TEASER
      ══════════════════════════════════════ */}
      <section className="py-24 bg-warm-950 relative overflow-hidden">

        {/* Background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-blood-800/30 to-transparent" />

        <div className="page-container relative z-10">

          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-blood-400 mb-3 block">
              Education
            </span>
            <h2 className="font-display text-4xl font-bold text-white tracking-tight mb-3">
              Facts that save lives
            </h2>
            <p className="text-warm-400 text-base max-w-xl mx-auto">
              Misconceptions keep willing donors away. Here's what the WHO actually says.
            </p>
          </div>

          {myths.length === 0 ? (
            <div className="mb-12 rounded-2xl border border-warm-800 bg-warm-900/50 p-8 text-center text-warm-500">
              Myth-busting articles will appear here once the team publishes them.
            </div>
          ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {myths.map((m, i) => (
              <div key={i}
                   className="rounded-2xl border border-warm-800 bg-warm-900/50 backdrop-blur-sm p-6
                              hover:border-warm-600 transition-colors duration-300">

                {/* Myth */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-blood-900/60 border border-blood-700 flex-shrink-0
                                  flex items-center justify-center mt-0.5">
                    <XCircle size={14} className="text-blood-400" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-blood-400 uppercase tracking-wider mb-1">Myth</p>
                    <p className="text-warm-300 text-sm leading-relaxed">"{m.myth}"</p>
                  </div>
                </div>

                {/* Truth */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal-900/60 border border-teal-700 flex-shrink-0
                                  flex items-center justify-center mt-0.5">
                    <CheckCircle size={14} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">Fact</p>
                    <p className="text-warm-300 text-sm leading-relaxed">{m.truth}</p>
                    <p className="text-warm-600 text-xs mt-2">— {m.source}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          <div className="text-center">
            <Link to="/myths"
                  className="inline-flex items-center gap-2 text-sm font-semibold
                             text-teal-400 hover:text-teal-300 transition-colors">
              <BookOpen size={15} />
              Read all myth-busting guides
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMMUNITY VOICES
      ══════════════════════════════════════ */}
      <VoicesSpotlight />

      {/* ══════════════════════════════════════
          IMPACT CHART
      ══════════════════════════════════════ */}
      <ImpactChartSection />


      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-24 bg-blood-600 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blood-500/40" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-blood-700/40" />

        <div className="page-container relative z-10 text-center">
          <div className="max-w-2xl mx-auto">

            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20
                            flex items-center justify-center mx-auto mb-6">
              <Droplets size={28} className="text-white" />
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white
                           tracking-tight mb-4 leading-tight">
              One donor can save<br />up to three lives.
            </h2>
            <p className="text-blood-100 text-lg mb-10 leading-relaxed">
              Registration takes less than 5 minutes. You don't need to know your blood type.
              You just need to decide to help.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
                                   bg-white text-blood-700 font-bold text-base
                                   hover:bg-blood-50 transition-all duration-200
                                   shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                                   hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                  <Heart size={18} />
                  Start donating today
                  <ArrowRight size={16} />
                </button>
              </Link>
              <Link to="/campaigns">
                <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
                                   bg-blood-700/50 border border-white/20
                                   text-white font-semibold text-base
                                   hover:bg-blood-700 transition-all duration-200
                                   hover:-translate-y-0.5">
                  Browse campaigns
                  <ChevronRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="bg-warm-950 text-warm-400 py-16">
        <div className="page-container">

          <div className="grid md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blood-600 flex items-center justify-center">
                  <Droplets size={16} className="text-white" />
                </div>
                <span className="font-display font-bold text-lg text-white">
                  BD<span className="text-blood-500">EN</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs mb-5">
                Blood Donor Emergency Network — connecting donors, hospitals, and communities
                to make life-saving blood available when it matters most.
              </p>
              <p className="text-xs text-warm-600">
                Built for Cameroon · SEN3244 Software Architecture · ICT University 2026
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Platform</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/campaigns" className="hover:text-white transition-colors">Campaigns</Link>
                </li>
                <li>
                  <Link to="/myths" className="hover:text-white transition-colors">Myth debunking</Link>
                </li>
                <li>
                  <Link to="/auth/user/login" className="hover:text-white transition-colors">Register as donor</Link>
                </li>
                <li>
                  <Link to="/auth/hospital/login" className="hover:text-white transition-colors">Partner as hospital</Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Contact</p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Mail size={13} className="text-blood-400" />
                  <span>contact@bden.cm</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={13} className="text-blood-400" />
                  <span>+237 656997810</span>
                </li>
                <li className="flex items-center gap-2">
                  <Globe size={13} className="text-blood-400" />
                  <span>Yaoundé, Cameroon</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-warm-800 pt-8 flex flex-col sm:flex-row
                          items-center justify-between gap-4 text-xs text-warm-600">
            <p>© 2026 BDEN. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <Shield size={11} className="text-teal-600" />
              <span>Donor privacy protected. No personal data sold or shared.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}
