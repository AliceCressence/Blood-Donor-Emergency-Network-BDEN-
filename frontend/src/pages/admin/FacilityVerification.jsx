// src/pages/admin/FacilityVerification.jsx
import { useEffect, useMemo, useState } from 'react'
import { Building2, CheckCircle, Clock, FileText, Loader2, MapPin, Phone, Search, X, XCircle } from 'lucide-react'
import { authService } from '../../services/auth.service'
import { CardShimmer, EmptyState, ErrorState } from '../../components/shared/DataStates'

const facilityTypeLabel = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  HEALTH_CENTER: 'Health centre',
  NGO: 'NGO health facility',
  OTHER: 'Other facility',
}

function formatDate(value) {
  if (!value) return 'Recently submitted'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function FacilityVerification() {
  const [facilities, setFacilities] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const loadFacilities = () => {
    setLoading(true)
    authService.listPendingHospitals()
      .then(data => {
        setFacilities(data)
        setSelected(current => current ? data.find(item => item.id === current.id) || null : null)
        setError('')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    authService.listPendingHospitals()
      .then(data => {
        if (!mounted) return
        setFacilities(data)
        setError('')
      })
      .catch(err => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return facilities
    return facilities.filter(f =>
      [f.facility_name, f.city, f.region, f.user_email, f.registration_number]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term)),
    )
  }, [facilities, search])

  const startAction = (action) => {
    setConfirmAction(action)
    setReason('')
  }

  const submitAction = async () => {
    if (!selected || !confirmAction) return
    if (confirmAction === 'reject' && !reason.trim()) return
    setSaving(true)
    try {
      await authService.verifyHospital(selected.user_id, confirmAction, reason.trim())
      setFacilities(items => items.filter(item => item.id !== selected.id))
      setSelected(null)
      setConfirmAction(null)
      setReason('')
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Facility Verification</h1>
        <p className="text-neutral-500 text-sm mt-1">Review hospitals and clinics applying to join BDEN</p>
      </div>

      {error && <ErrorState message={error} onRetry={loadFacilities} />}

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-violet-600 text-white border-violet-600">
          Pending ({facilities.length})
        </span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white text-neutral-500 border-warm-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
          Approved and rejected history will appear when the admin API supports it
        </span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pending facilities..."
          className="w-full bg-white border border-warm-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-warm-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-neutral-900 dark:border-white/10 dark:text-white dark:placeholder:text-neutral-600"
        />
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2"><CardShimmer rows={5} /></div>
          <div className="lg:col-span-3"><CardShimmer rows={8} /></div>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'No matching facility found' : 'No hospitals waiting right now'}
          description={search ? 'Try another name, city, email, or registration number.' : 'New hospital registrations will appear here as soon as they are submitted.'}
        />
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            {visible.map(facility => (
              <button
                key={facility.id}
                onClick={() => setSelected(facility)}
                className={`w-full text-left bg-white border rounded-2xl p-4 shadow-sm transition-all hover:border-violet-200 dark:bg-neutral-900 dark:hover:border-white/20 ${
                  selected?.id === facility.id ? 'border-violet-500' : 'border-warm-200 dark:border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-warm-950 dark:text-white leading-snug">{facility.facility_name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-900/30 text-amber-400 border-amber-700/30 shrink-0">
                    Pending
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {facilityTypeLabel[facility.facility_type] || facility.facility_type} · {facility.city || 'City not provided'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
                  <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(facility.submitted_at)}</span>
                  <span className="flex items-center gap-1"><FileText size={10} /> {facility.registration_number}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden shadow-sm sticky top-24 dark:bg-neutral-900 dark:border-white/5">
                <div className="px-6 py-5 border-b border-warm-100 dark:border-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display font-bold text-warm-950 dark:text-white text-lg">{selected.facility_name}</h2>
                      <p className="text-neutral-500 text-sm">{facilityTypeLabel[selected.facility_type] || selected.facility_type}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-900/30 text-amber-400 border-amber-700/30">
                      Pending Review
                    </span>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { icon: MapPin, label: 'Location', value: [selected.city, selected.region].filter(Boolean).join(', ') || 'Not provided' },
                      { icon: Phone, label: 'Phone', value: selected.contact_phone || 'Not provided' },
                      { icon: FileText, label: 'Registration No.', value: selected.registration_number },
                      { icon: Clock, label: 'Submitted', value: formatDate(selected.submitted_at) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-warm-50 rounded-xl p-3 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon size={11} className="text-neutral-500" />
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</span>
                        </div>
                        <p className="text-xs font-semibold text-warm-950 dark:text-white break-words">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Account Email</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 bg-warm-50 dark:bg-neutral-800/50 rounded-xl p-3">{selected.user_email}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Address</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 bg-warm-50 dark:bg-neutral-800/50 rounded-xl p-3 leading-relaxed">
                      {selected.address || 'No address was provided during signup.'}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => startAction('approve')}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                      <CheckCircle size={15} /> Approve Facility
                    </button>
                    <button onClick={() => startAction('reject')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 text-sm font-semibold py-3 rounded-xl transition-colors">
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-warm-200 dark:bg-neutral-900 dark:border-white/5 rounded-2xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <Building2 size={28} className="text-neutral-700 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">Select a facility to review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmAction(null)} aria-label="Close" />
          <div className="relative w-full max-w-md rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl p-6">
            <button onClick={() => setConfirmAction(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white">
              <X size={16} />
            </button>
            <h2 className="font-display text-xl font-bold text-white pr-8">
              {confirmAction === 'approve' ? 'Approve this facility?' : 'Reject this facility?'}
            </h2>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              {confirmAction === 'approve'
                ? 'This hospital will be verified and allowed to sign in to the BDEN hospital dashboard.'
                : 'This hospital will remain unable to sign in. Add a clear reason so the team knows what needs attention.'}
            </p>
            {confirmAction === 'reject' && (
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                className="mt-4 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Reason for rejection..."
              />
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/10">
                Cancel
              </button>
              <button
                onClick={submitAction}
                disabled={saving || (confirmAction === 'reject' && !reason.trim())}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {saving && <Loader2 size={14} className="inline animate-spin mr-1" />}
                {confirmAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
