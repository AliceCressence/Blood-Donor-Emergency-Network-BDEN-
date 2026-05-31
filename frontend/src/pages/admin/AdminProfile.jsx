import { useState } from 'react'
import { Save, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ErrorState } from '../../components/shared/DataStates'

export default function AdminProfile() {
  const { user, updateUser } = useAuth()
  const [gender, setGender] = useState(user?.gender || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await updateUser({ gender }, { persist: true })
      setMessage('Profile updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950 dark:text-white">Admin Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage the account you use to care for the BDEN workspace.</p>
      </div>

      {error && <ErrorState message={error} />}
      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}

      <section className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blood-100 bg-blood-50 text-blood-600 dark:border-blood-500/20 dark:bg-blood-500/10">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-display font-bold text-warm-950 dark:text-white">Account details</h2>
            <p className="text-xs text-neutral-500">Email and role are controlled by the auth service.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Email</span>
            <input className="input bg-warm-50 text-neutral-500" value={user?.email || ''} disabled />
          </label>
          <label className="block">
            <span className="label">Role</span>
            <input className="input bg-warm-50 text-neutral-500" value="Platform administrator" disabled />
          </label>
          <label className="block">
            <span className="label flex items-center gap-2"><User size={13} /> Gender</span>
            <select className="input" value={gender} onChange={e => { setGender(e.target.value); setMessage('') }}>
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Auth provider</span>
            <input className="input bg-warm-50 text-neutral-500 capitalize" value={user?.authProvider || 'email'} disabled />
          </label>
        </div>

        <button onClick={save} disabled={saving || gender === (user?.gender || '')} className="btn-primary mt-5 disabled:opacity-40">
          <Save size={15} /> {saving ? 'Saving...' : 'Save profile'}
        </button>
      </section>
    </div>
  )
}
