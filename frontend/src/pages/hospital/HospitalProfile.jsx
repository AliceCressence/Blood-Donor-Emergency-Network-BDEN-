import { useMemo, useState } from 'react'
import { Building2, CheckCircle, Loader2, Mail, MapPin, Phone, Save, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const FACILITY_TYPES = [
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'HEALTH_CENTER', label: 'Health centre' },
  { value: 'MATERNITY', label: 'Maternity ward' },
  { value: 'NGO', label: 'NGO health facility' },
  { value: 'OTHER', label: 'Other' },
]

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      {children}
    </label>
  )
}

export default function HospitalProfile() {
  const { user, updateUser } = useAuth()
  const initial = useMemo(() => ({
    facilityName: user?.facilityName || user?.name || '',
    facilityType: user?.facilityType || 'HOSPITAL',
    address: user?.address || '',
    city: user?.city || '',
    region: user?.region || '',
    contactPhone: user?.contactPhone || user?.phone || '',
  }), [user])

  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const changed = JSON.stringify(form) !== JSON.stringify(initial)

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }))
    setMessage('')
    setError('')
  }

  const save = async (event) => {
    event.preventDefault()
    if (!changed) return
    setSaving(true)
    try {
      await updateUser(form)
      setMessage('Profile updated. Your hospital details are now up to date.')
      setError('')
    } catch (err) {
      setError(err.message || 'We could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-warm-950/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src="/favicon.svg" alt="BDEN" className="h-14 w-14 rounded-2xl shadow-sm" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blood-600">Hospital profile</p>
            <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">{form.facilityName || 'Your facility'}</h1>
            <p className="text-sm text-neutral-500">Keep the details donors and coordinators rely on fresh and easy to trust.</p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
          <CheckCircle size={13} /> Verified facility
        </span>
      </div>

      <form onSubmit={save} className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-warm-950/70">
        <div className="mb-5 flex items-center gap-2">
          <Building2 size={18} className="text-blood-600" />
          <h2 className="font-display font-bold text-neutral-900 dark:text-white">Facility details</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facility name">
            <input className="input" value={form.facilityName} onChange={e => updateField('facilityName', e.target.value)} />
          </Field>
          <Field label="Facility type">
            <select className="input" value={form.facilityType} onChange={e => updateField('facilityType', e.target.value)}>
              {FACILITY_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </Field>
          <Field label="City">
            <input className="input" value={form.city} onChange={e => updateField('city', e.target.value)} />
          </Field>
          <Field label="Region">
            <input className="input" value={form.region} onChange={e => updateField('region', e.target.value)} />
          </Field>
          <Field label="Contact phone">
            <input className="input" value={form.contactPhone} onChange={e => updateField('contactPhone', e.target.value)} />
          </Field>
          <Field label="Account email">
            <div className="flex items-center gap-2 rounded-xl border border-warm-300 bg-warm-50 px-4 py-2.5 text-sm font-semibold text-warm-600 dark:border-white/10 dark:bg-white/5 dark:text-warm-300">
              <Mail size={15} /> {user?.email}
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <textarea className="input min-h-24" value={form.address} onChange={e => updateField('address', e.target.value)} />
            </Field>
          </div>
        </div>

        {message && <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end">
          <button disabled={!changed || saving} className="btn-primary disabled:shadow-none">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save changes
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-warm-950/70">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck size={18} className="text-teal-600" />
          <h2 className="font-display font-bold text-neutral-900 dark:text-white">Trust status</h2>
        </div>
        <p className="text-sm leading-relaxed text-neutral-500">
          Your facility is approved on BDEN. If a major legal detail changes, update the profile here and keep your registration documents ready for any future review.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-3 py-1 dark:bg-white/5"><MapPin size={12} /> {form.city || 'City not added'}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-3 py-1 dark:bg-white/5"><Phone size={12} /> {form.contactPhone || 'Phone not added'}</span>
        </div>
      </div>
    </div>
  )
}
