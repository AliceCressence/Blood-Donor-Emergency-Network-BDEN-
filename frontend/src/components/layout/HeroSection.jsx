// src/components/layout/HeroSection.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle, Clock, Droplets, Heart, MapPin, Shield } from 'lucide-react'
import FluidBg from '../shared/FluidBg'

const MOCK_REQUESTS = [
  {
    bloodType: 'O-',
    hospital: 'Hopital Central',
    city: 'Yaounde',
    units: 2,
    situation: 'Post-op haemorrhage',
    distance: '2.8 km',
    notified: 3,
    timeLabel: 'Just now',
  },
  {
    bloodType: 'A+',
    hospital: 'Clinique de la Cite Verte',
    city: 'Yaounde',
    units: 1,
    situation: 'Trauma surgery',
    distance: '5.1 km',
    notified: 5,
    timeLabel: '4 min ago',
  },
  {
    bloodType: 'B-',
    hospital: 'CHUY',
    city: 'Yaounde',
    units: 3,
    situation: 'Sickle cell crisis',
    distance: '1.4 km',
    notified: 2,
    timeLabel: '1 min ago',
  },
]

function HeroGrid() {
  return (
    <>
      <div className="bden-hero-grid" />
      <div className="bden-hero-sweep" />
    </>
  )
}

function EmergencyCard() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  const req = MOCK_REQUESTS[idx]

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % MOCK_REQUESTS.length)
        setVisible(true)
      }, 320)
    }, 90000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="bden-live-card"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="bden-live-card-main">
        <div className="bden-live-card-left">
          <div className="bden-live-blood">
            <span>{req.bloodType}</span>
          </div>
          <div className="bden-live-copy">
            <div className="bden-live-label">
              <span />
              Live request
            </div>
            <p className="bden-live-title">
              {req.units} unit{req.units > 1 ? 's' : ''} needed - {req.hospital}
            </p>
            <p className="bden-live-meta">
              {req.city} - {req.situation}
            </p>
          </div>
        </div>

        <div className="bden-live-metrics">
          <div>
            <p>When</p>
            <strong>{req.timeLabel}</strong>
          </div>
          <div>
            <p>Range</p>
            <strong>{req.distance}</strong>
          </div>
          <div>
            <p>Window</p>
            <strong>30m</strong>
          </div>
        </div>
      </div>

      <div className="bden-live-foot">
        <span>{req.notified} compatible donors notified</span>
        {/* <span>
          <Clock size={11} />
          Refreshes every 90s
        </span> */}
      </div>
    </div>
  )
}

export default function HeroSection() {
  const chips = [
    { icon: Shield, text: 'WHO-aligned' },
    { icon: MapPin, text: 'Privacy-first' },
    { icon: CheckCircle, text: 'Verified facilities' },
    { icon: Droplets, text: 'No blood type? No problem' },
  ]

  return (
    <section className="bden-hero">
      <FluidBg />
      <HeroGrid />

      <div className="bden-hero-vignette" />

      <div className="bden-hero-content">
        {/* <div className="bden-hero-eyebrow text-sm">
          <span />
          Emergency Blood Donor Network - Cameroon
        </div> */}

        <h1 className="bden-hero-title">
          Give blood when every
          <span className='whitespace-nowrap'>minute matters</span>
        </h1>

        <div className="bden-hero-chips">
          {chips.map(({ icon: Icon, text }) => (
            <div key={text}>
              <Icon size={13} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <p className="bden-hero-copy">
          BDEN connects voluntary donors with verified hospitals in real time,
          turning urgent blood needs into clear, trusted action.
        </p>

        <div className="bden-hero-actions">
          <Link to="/register">
            <button className="bden-hero-primary">
              <Heart size={16} />
              Register as donor
              <ArrowRight size={14} />
            </button>
          </Link>
          <Link to="/register?role=hospital">
            <button className="bden-hero-secondary">
              <Building2 size={16} />
              Partner as hospital
            </button>
          </Link>
        </div>
      </div>

      <div className="bden-hero-card-wrap">
        <EmergencyCard />
      </div>
    </section>
  )
}
