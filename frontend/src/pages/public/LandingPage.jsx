// src/pages/public/LandingPage.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Droplets, AlertCircle, Heart, MapPin, Shield, Users,
  Building2, ChevronRight, Clock, CheckCircle, ArrowRight,
  TrendingUp, Zap, BookOpen, Phone, Mail, Globe,
  Star, Activity, Award, XCircle
} from 'lucide-react'

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

const MYTHS = [
  {
    myth:  'Donating blood makes you weak and sick',
    truth: 'Your body replaces donated plasma within 24 hours. Most donors feel completely normal immediately after donation.',
    source: 'WHO Guidelines',
  },
  {
    myth:  'You need to know your blood type to register',
    truth: "BDEN accepts donors at every stage. You can register without a known blood type and we'll guide you to get tested.",
    source: 'BDEN Platform',
  },
  {
    myth:  'Blood donation is painful and time-consuming',
    truth: 'The process takes about 30–45 minutes total. The actual blood draw is only 8–10 minutes with minimal discomfort.',
    source: 'WHO Guidelines',
  },
]

const CAMPAIGNS = [
  {
    hospital:  'Centre Hospitalier Universitaire de Yaoundé',
    location:  'Yaoundé, Centre',
    types:     ['O+', 'O-', 'A+'],
    target:    120,
    current:   74,
    date:      'May 20, 2026',
    benefit:   'Free malaria screening for all donors',
    urgent:    false,
  },
  {
    hospital:  'Hôpital Central de Yaoundé',
    location:  'Yaoundé, Centre',
    types:     ['B+', 'AB+'],
    target:    60,
    current:   18,
    date:      'May 15, 2026',
    benefit:   'Priority consultation access (3 months)',
    urgent:    true,
  },
  {
    hospital:  'Fondation Chantal Biya',
    location:  'Yaoundé, Centre',
    types:     ['A-', 'B-', 'AB-'],
    target:    80,
    current:   55,
    date:      'May 25, 2026',
    benefit:   'BDEN loyalty card + free blood typing',
    urgent:    false,
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

// ─── CAMPAIGN CARD ───────────────────────────────────────────────

function CampaignCard({ campaign, delay }) {
  const pct = Math.round((campaign.current / campaign.target) * 100)
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
          <span>Goal: {campaign.target}</span>
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

// ─── MAIN COMPONENT ──────────────────────────────────────────────

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState(0)
  const [statsRef, statsInView] = useInView(0.3)
  const [howRef,   howInView]   = useInView(0.2)

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center bg-warm-950 overflow-hidden">

        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Decorative large blood drop — top right */}
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] opacity-[0.06]">
          <svg viewBox="0 0 200 240" fill="none">
            <path d="M100 10 C100 10 20 100 20 150 A80 80 0 0 0 180 150 C180 100 100 10 100 10Z"
                  fill="#E51111"/>
          </svg>
        </div>

        {/* Decorative small drop — bottom left */}
        <div className="absolute bottom-10 -left-10 w-48 h-48 opacity-[0.05]">
          <svg viewBox="0 0 200 240" fill="none">
            <path d="M100 10 C100 10 20 100 20 150 A80 80 0 0 0 180 150 C180 100 100 10 100 10Z"
                  fill="#E51111"/>
          </svg>
        </div>

        <div className="page-container relative z-10 py-24">
          <div className="max-w-4xl">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-blood-600/10 border border-blood-500/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-blood-500 animate-pulse" />
              <span className="text-blood-400 text-sm font-medium tracking-wide">
                Emergency Blood Donor Network · Cameroon
              </span>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold
                           text-white leading-[1.05] tracking-tight mb-6">
              When every<br />
              <span className="text-blood-500">minute counts,</span><br />
              BDEN connects.
            </h1>

            <p className="text-warm-300 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10 font-body">
              A coordination platform linking voluntary donors, hospitals, and communities
              to make life-saving blood available — fast, verified, and trusted.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-16">
              <Link to="/register">
                <button className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl
                                   bg-blood-600 hover:bg-blood-700 active:bg-blood-800
                                   text-white font-semibold text-base
                                   transition-all duration-200 shadow-emergency
                                   hover:shadow-[0_8px_32px_rgba(229,17,17,0.4)]
                                   hover:-translate-y-0.5">
                  <Heart size={18} />
                  Register as donor
                  <ArrowRight size={16} />
                </button>
              </Link>
              <Link to="/register?role=hospital">
                <button className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl
                                   bg-white/10 hover:bg-white/15 border border-white/20
                                   text-white font-semibold text-base
                                   backdrop-blur-sm transition-all duration-200
                                   hover:-translate-y-0.5">
                  <Building2 size={18} />
                  Partner as hospital
                </button>
              </Link>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center gap-6">
              {[
                { icon: Shield,       text: 'WHO-aligned guidelines' },
                { icon: MapPin,       text: 'Privacy-first by design'  },
                { icon: CheckCircle,  text: 'Verified facilities only'  },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-warm-400 text-sm">
                  <Icon size={14} className="text-teal-400" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live emergency request preview — floating card */}
        <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 z-10">
          <div className="w-80 bg-white rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="bg-blood-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-white" />
                <span className="text-white text-sm font-semibold">Emergency request</span>
              </div>
              <span className="text-blood-200 text-xs">2 min ago</span>
            </div>
            <div className="p-5">
              <p className="text-xs text-warm-400 mb-3 font-mono uppercase tracking-wider">
                Hôpital Central · Yaoundé
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-blood-50 border-2 border-blood-200
                                flex items-center justify-center">
                  <span className="font-mono font-bold text-blood-700 text-lg">O−</span>
                </div>
                <div>
                  <p className="font-display font-semibold text-warm-900">Urgent: O− blood</p>
                  <p className="text-xs text-warm-500 mt-0.5">Surgical emergency · 2 units needed</p>
                </div>
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-warm-500">
                  <MapPin size={11} className="text-blood-400" />
                  <span>3.2 km from your location</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-warm-500">
                  <Clock size={11} className="text-amber-500" />
                  <span>Time-critical — respond within 30 min</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-warm-500">
                  <Users size={11} className="text-teal-500" />
                  <span>2 compatible donors already notified</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 rounded-xl bg-blood-600 text-white text-sm font-semibold
                                   hover:bg-blood-700 transition-colors">
                  I can donate
                </button>
                <button className="py-2.5 rounded-xl bg-warm-100 text-warm-600 text-sm font-medium
                                   hover:bg-warm-200 transition-colors">
                  Not available
                </button>
              </div>
            </div>
          </div>
        </div>

      </section>


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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAMPAIGNS.map((c, i) => (
              <CampaignCard key={c.hospital} campaign={c} delay={i * 100} />
            ))}
          </div>

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

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {MYTHS.map((m, i) => (
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
                {['Campaigns', 'Myth debunking', 'Register as donor', 'Partner as hospital'].map(l => (
                  <li key={l}>
                    <Link to="/" className="hover:text-white transition-colors">{l}</Link>
                  </li>
                ))}
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
                  <span>+237 6XX XXX XXX</span>
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
