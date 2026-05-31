import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Award, Bell, Calendar, CheckCircle, ChevronRight,
  CreditCard, Droplets, Heart, MapPin, User, Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { campaignApi, donorApi, requestApi } from '../../services/app.service'
import { CardShimmer, EmptyState, ErrorState, InfoTip } from '../../components/shared/DataStates'

function StatCard({ icon: Icon, label, value, sub, color = 'blood' }) {
  const colors = {
    blood: 'bg-blood-50 text-blood-600 border-blood-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-display font-bold text-neutral-900">{value}</p>
      <p className="text-sm font-medium text-neutral-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </div>
  )
}

function UrgencyBadge({ level }) {
  const styles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    urgent: 'bg-orange-100 text-orange-700 border-orange-200',
    standard: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[level] || styles.standard}`}>{level.toUpperCase()}</span>
}

export default function DonorDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [card, setCard] = useState(null)
  const [requests, setRequests] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userBloodType = user?.bloodType

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [profileData, cardData, donationData, requestData, campaignData] = await Promise.all([
        donorApi.getProfile(),
        donorApi.getCard().catch(() => null),
        donorApi.getDonations().catch(() => []),
        requestApi.list({ status: 'ACTIVE', blood_type: userBloodType?.replace('−', '-') || undefined }).catch(() => []),
        campaignApi.list({ blood_type: userBloodType?.replace('−', '-') || undefined }).catch(() => []),
      ])
      setProfile(profileData)
      setCard(cardData)
      setDonations(donationData)
      setRequests(requestData.slice(0, 4))
      setCampaigns(campaignData.slice(0, 3))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userBloodType])

  useEffect(() => {
    const timer = setTimeout(() => { load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const name = useMemo(() => {
    const full = profile?.full_name || user?.name || user?.email || 'Donor'
    return full.split(' ')[0]
  }, [profile, user])

  const totalDonations = profile?.total_donations ?? card?.total_donations ?? 0
  const livesImpacted = totalDonations * 3
  const hasDonationHistory = totalDonations > 0
  const daysUntilEligible = profile?.days_until_eligible ?? 0
  const canDonate = profile?.is_eligible_to_donate ?? daysUntilEligible <= 0
  const bloodType = (profile?.blood_type || card?.blood_type || user?.bloodType || 'Unset').replace('-', '−')
  const welcomeCopy = hasDonationHistory
    ? <>Your donations have helped an estimated <span className="font-semibold text-blood-600">{livesImpacted} lives</span> so far.</>
    : <>Your donor profile is ready. When your first donation is verified, your impact will start showing here.</>

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <CardShimmer key={i} rows={2} />)}
        </div>
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3"><CardShimmer rows={6} /></div>
          <div className="lg:col-span-2"><CardShimmer rows={5} /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {error && <ErrorState message={error} onRetry={load} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Good morning, {name}</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {welcomeCopy}
          </p>
        </div>
        <Link to="/donor/map" className="inline-flex items-center gap-2 bg-blood-600 hover:bg-blood-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Droplets size={16} />
          Find nearby needs
        </Link>
      </div>

      <div className={`${canDonate ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'} border rounded-2xl p-5 flex items-center gap-4`}>
        <div className={`w-10 h-10 ${canDonate ? 'bg-emerald-100' : 'bg-amber-100'} rounded-xl flex items-center justify-center shrink-0`}>
          {canDonate ? <CheckCircle size={20} className="text-emerald-600" /> : <Calendar size={20} className="text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${canDonate ? 'text-emerald-800' : 'text-amber-800'}`}>
            {canDonate ? 'You are eligible to donate!' : `Next donation in ${daysUntilEligible} days`}
          </p>
          <p className={`text-sm ${canDonate ? 'text-emerald-600' : 'text-amber-600'}`}>
            {canDonate ? 'You can respond to nearby compatible requests today.' : `Eligible from ${profile?.next_eligible_date || card?.next_eligible_date || 'your next verified date'}.`}
          </p>
        </div>
        <Link to={canDonate ? '/donor/map' : '/donor/card'} className={`text-sm font-semibold ${canDonate ? 'text-emerald-700' : 'text-amber-700'} flex items-center gap-1`}>
          {canDonate ? 'View needs' : 'View card'} <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplets} label="Total donations" value={totalDonations} sub={hasDonationHistory ? `${profile?.total_volume_ml || 0} ml recorded` : 'Your first verified donation will appear here'} color="blood" />
        <StatCard icon={Heart} label="Lives helped" value={hasDonationHistory ? livesImpacted : 'Soon'} sub={hasDonationHistory ? 'Estimated from verified donations' : 'This starts after your first verified donation'} color="green" />
        <StatCard icon={Award} label="Eligibility" value={canDonate ? 'Ready' : `${daysUntilEligible}d`} sub={canDonate ? 'You can respond when a need fits' : 'Based on donation history'} color="amber" />
        <StatCard icon={Users} label="Blood type" value={bloodType} sub={profile?.blood_type_verified ? 'Verified' : 'Not verified yet'} color="blue" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-blood-600" />
              <h2 className="font-display font-bold text-neutral-900">Nearby Emergency Requests</h2>
              <InfoTip>Only active requests from the backend are shown here. Matching will become more precise as your location profile improves.</InfoTip>
            </div>
            <Link to="/donor/map" className="text-xs font-semibold text-blood-600 hover:text-blood-700 flex items-center gap-1">
              View map <ChevronRight size={12} />
            </Link>
          </div>
          {requests.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CheckCircle} title="No active emergency requests" description="When hospitals publish compatible requests, they will appear here with the same priority layout." />
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {requests.map(req => (
                <Link key={req.id} to={`/donor/requests/${req.id}`} className="block px-6 py-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold text-blood-600 bg-blood-50 px-2 py-0.5 rounded-md">{req.bloodType}</span>
                        <UrgencyBadge level={req.urgency} />
                      </div>
                      <p className="font-medium text-neutral-900 text-sm truncate">{req.hospital}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{req.notes || 'Emergency blood request'} · {req.unitsNeeded} unit{req.unitsNeeded > 1 ? 's' : ''} needed</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-neutral-400 justify-end"><MapPin size={11} /> {req.city || 'Nearby'}</div>
                      <div className="flex items-center gap-1 text-xs text-neutral-400 justify-end mt-0.5"><Calendar size={11} /> {req.postedAgo}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="border-t border-neutral-100 px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-neutral-900">Donation campaigns</h3>
              <Link to="/donor/map" className="text-xs font-semibold text-blood-600">View nearby</Link>
            </div>
            {campaigns.length === 0 ? (
              <p className="rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">No approved campaigns are open for your blood type right now.</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map(campaign => (
                  <Link key={campaign.id} to="/donor/map" className="block rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 transition-colors hover:bg-blue-50">
                    <p className="text-sm font-semibold text-neutral-900">{campaign.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{campaign.city || 'Nearby'} · {new Date(campaign.startDate).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
            <h2 className="font-display font-bold text-neutral-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to: '/donor/card', icon: CreditCard, label: 'View donor card', color: 'text-blood-600' },
                { to: '/donor/map', icon: MapPin, label: 'Explore nearby needs', color: 'text-blue-600' },
                { to: '/donor/notifications', icon: Bell, label: 'Check notifications', color: 'text-amber-600' },
                { to: '/donor/profile', icon: User, label: 'Edit profile', color: 'text-neutral-600' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group">
                  <Icon size={16} className={color} />
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 flex-1">{label}</span>
                  <ChevronRight size={14} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="font-display font-bold text-neutral-900 text-sm">Recent Donations</h2>
              <span className="text-xs text-neutral-400">{totalDonations} total</span>
            </div>
            {donations.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Droplets} title="No donations recorded yet" description="Your verified donations will appear here after a facility records them." />
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {donations.slice(0, 3).map(item => (
                  <div key={item.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-neutral-800">{new Date(item.donation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-neutral-500 truncate max-w-[160px]">{item.facility_name}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle size={11} /> Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
