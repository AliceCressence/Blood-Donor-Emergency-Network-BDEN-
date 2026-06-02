import { useEffect, useMemo, useState } from 'react'
import { Award, Calendar, CheckCircle, Droplets, Loader2, MapPin, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { campaignApi } from '../../services/app.service'
import { EmptyState, ErrorState } from '../../components/shared/DataStates'

const BLOOD_TYPES = ['', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

function CampaignCard({ campaign }) {
  const progress = campaign.targetDonors ? Math.min(Math.round((campaign.actualDonors / campaign.targetDonors) * 100), 100) : 0
  return (
    <article className="rounded-2xl border border-warm-200 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blood-600">{campaign.hospitalName}</p>
          <h2 className="mt-1 font-display text-xl font-bold text-warm-950">{campaign.title}</h2>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {campaign.rawStatus}
        </span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-warm-500">{campaign.description || 'A verified donation campaign looking for willing donors.'}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {(campaign.bloodTypes.length ? campaign.bloodTypes : ['All types']).map(type => (
          <span key={type} className="rounded-lg border border-blood-100 bg-blood-50 px-2.5 py-1 font-mono text-xs font-bold text-blood-700">{type}</span>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 text-xs text-warm-500">
        <span className="flex items-center gap-1.5"><Calendar size={13} className="text-blood-500" /> {new Date(campaign.startDate).toLocaleDateString()}</span>
        <span className="flex items-center gap-1.5"><MapPin size={13} className="text-teal-500" /> {campaign.city || 'Cameroon'}</span>
        <span className="flex items-center gap-1.5"><Users size={13} className="text-violet-500" /> {campaign.interestedCount} interested</span>
        <span className="flex items-center gap-1.5"><Droplets size={13} className="text-blood-500" /> {campaign.targetDonors || 'Open'} target</span>
      </div>
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-xs text-warm-500">
          <span>{campaign.actualDonors} donors reported</span>
          <span>{campaign.targetDonors ? `${progress}%` : 'Open goal'}</span>
        </div>
        <div className="h-2 rounded-full bg-warm-100">
          <div className="h-2 rounded-full bg-blood-600" style={{ width: `${progress}%` }} />
        </div>
      </div>
      {campaign.incentives && (
        <div className="flex items-start gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs text-teal-700">
          <Award size={14} className="mt-0.5 shrink-0" /> {campaign.incentives}
        </div>
      )}
    </article>
  )
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [city, setCity] = useState('')
  const [bloodType, setBloodType] = useState('')

  useEffect(() => {
    let mounted = true
    const timer = setTimeout(() => {
      setLoading(true)
      campaignApi.list({ city: city || undefined, blood_type: bloodType || undefined })
        .then(data => { if (mounted) { setCampaigns(data); setError('') } })
        .catch(err => { if (mounted) setError(err.message) })
        .finally(() => { if (mounted) setLoading(false) })
    }, 0)
    return () => { mounted = false; clearTimeout(timer) }
  }, [city, bloodType])

  const upcomingCount = useMemo(() => campaigns.filter(item => new Date(item.startDate) > new Date()).length, [campaigns])

  return (
    <div className="bg-warm-50">
      <section className="bg-warm-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blood-400">Donation campaigns</p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Find a drive where your blood can help</h1>
          <p className="mt-4 max-w-2xl text-warm-300">Browse approved campaigns from verified hospitals. Show interest, plan your visit, and help facilities keep blood available before emergencies happen.</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="grid gap-4 rounded-2xl border border-warm-200 bg-white p-4 shadow-card md:grid-cols-[1fr_180px_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Filter by city" className="input pl-9" />
          </div>
          <select value={bloodType} onChange={e => setBloodType(e.target.value)} className="input">
            {BLOOD_TYPES.map(type => <option key={type || 'all'} value={type}>{type || 'All blood types'}</option>)}
          </select>
          <div className="flex items-center gap-2 rounded-xl bg-warm-50 px-4 text-sm font-semibold text-warm-600">
            <CheckCircle size={16} className="text-teal-600" /> {upcomingCount} upcoming
          </div>
        </div>

        {error && <ErrorState message={error} />}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-warm-500"><Loader2 className="mr-2 animate-spin" /> Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <EmptyState icon={Calendar} title="No campaigns match this search" description="Try another city or blood type. New approved campaigns will appear here automatically." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} />)}
          </div>
        )}

        <div className="rounded-2xl border border-blood-100 bg-blood-50 p-6 text-center">
          <p className="font-display text-xl font-bold text-blood-800">Want to be alerted faster?</p>
          <p className="mt-2 text-sm text-blood-700">Create a donor profile so BDEN can match you to campaigns and urgent requests around you.</p>
          <Link to="/register" className="btn-primary mt-5">Join as donor</Link>
        </div>
      </main>
    </div>
  )
}
