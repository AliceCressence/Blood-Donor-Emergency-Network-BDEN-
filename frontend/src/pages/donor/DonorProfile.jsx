// src/pages/donor/DonorProfile.jsx
import { useState, useMemo } from 'react'
import {
  User, Phone, MapPin, Save, CheckCircle,
  Mail, Shield, AlertTriangle, X, Trash2, UserX, Venus, Mars, CircleDashed,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const BLOOD_TYPES = ['A+', 'A⁻', 'B+', 'B⁻', 'AB+', 'AB⁻', 'O+', 'O⁻']

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male',   icon: Mars          },
  { value: 'female', label: 'Female', icon: Venus         },
  { value: 'other',  label: 'Other',  icon: CircleDashed  },
]

// Auth provider display config
const AUTH_PROVIDER_CONFIG = {
  google: {
    label: 'Google',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  email: {
    label: 'Email & Password',
    color: 'text-neutral-700 bg-neutral-50 border-neutral-200',
    icon: () => <Mail size={14} className="text-neutral-500 shrink-0" />,
  },
}

// ─── Danger zone confirmation modal ──────────────────────────────────────────
function DangerModal({ action, onConfirm, onCancel }) {
  const [confirmed, setConfirmed] = useState(false)

  const config = {
    deactivate: {
      title: 'Deactivate your account?',
      description: 'Your account will be hidden from the platform. You won\'t receive emergency alerts or appear in donor searches. You can reactivate anytime by logging back in.',
      confirmLabel: 'Deactivate account',
      icon: UserX,
    },
    delete: {
      title: 'Permanently delete your account?',
      description: 'This will erase all your data — donation history, donor card, and profile — from the BDEN network. This action is irreversible and cannot be undone.',
      confirmLabel: 'Yes, delete everything',
      icon: Trash2,
    },
  }[action] || {}

  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          {Icon && <Icon size={22} className="text-red-500" />}
        </div>

        <h2 className="font-display text-lg font-bold text-neutral-900 text-center mb-2">
          {config.title}
        </h2>
        <p className="text-sm text-neutral-500 text-center leading-relaxed mb-6">
          {config.description}
        </p>

        {/* Explicit confirmation checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-red-600"
          />
          <span className="text-xs text-neutral-600 leading-relaxed">
            I understand the consequences and want to proceed.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DonorProfile() {
  const { user, updateUser, logout } = useAuth()
  const [saved, setSaved]           = useState(false)
  const [dangerAction, setDangerAction] = useState(null) // 'deactivate' | 'delete'

  const initial = useMemo(() => ({
    name:      user?.name      || '',
    phone:     user?.phone     || '',
    city:      user?.city      || '',
    bloodType: user?.bloodType || '',
    gender:    user?.gender    || '',
    available: user?.available ?? true,
  }), [user])

  const [form, setForm] = useState(initial)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Save button is only active when form differs from initial values
  const hasChanges = useMemo(() =>
    Object.keys(initial).some(k => form[k] !== initial[k]),
    [form, initial]
  )

  const handleSave = () => {
    if (!hasChanges) return
    updateUser(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDangerConfirm = () => {
    // In production: call the appropriate API endpoint
    if (dangerAction === 'delete') {
      logout()
    } else {
      logout()
    }
    setDangerAction(null)
  }

  // Auth provider
  const provider = user?.authProvider || 'email'
  const providerCfg = AUTH_PROVIDER_CONFIG[provider] || AUTH_PROVIDER_CONFIG.email
  const ProviderIcon = providerCfg.icon

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-warm-950">Profile settings</h1>
          <p className="text-warm-500 text-sm mt-1">Keep your information up to date for accurate matching</p>
        </div>

        {/* Success banner */}
        {saved && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-teal-50 border border-teal-200">
            <CheckCircle size={16} className="text-teal-600" />
            <p className="text-sm text-teal-800 font-medium">Profile updated successfully!</p>
          </div>
        )}

        {/* ── Main form ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-6 space-y-5">

          {/* Email — read only */}
          <div>
            <label className="label flex items-center gap-1.5">
              Email
              <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                not editable
              </span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-300" />
              <input
                value={user?.email || ''}
                readOnly
                disabled
                className="input pl-10 bg-neutral-50 text-neutral-400 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Auth provider */}
          <div>
            <label className="label">Signed in with</label>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${providerCfg.color}`}>
              <ProviderIcon />
              {providerCfg.label}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="label">Full name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+237 6XX XXX XXX"
                className="input pl-10"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="label">City</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                value={form.city}
                onChange={e => update('city', e.target.value)}
                placeholder="e.g. Yaoundé"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="label">Gender</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => update('gender', opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.gender === opt.value
                        ? 'border-blood-500 bg-blood-50 text-blood-700'
                        : 'border-warm-200 text-warm-600 hover:border-blood-300'
                    }`}
                  >
                    <Icon size={15} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Blood type */}
          <div>
            <label className="label">Blood type</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BLOOD_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => update('bloodType', t)}
                  className={`py-2.5 rounded-xl border-2 font-mono font-bold text-sm transition-all ${
                    form.bloodType === t
                      ? 'border-blood-500 bg-blood-50 text-blood-700'
                      : 'border-warm-200 text-warm-600 hover:border-blood-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-warm-50 border border-warm-200">
            <div>
              <p className="text-sm font-semibold text-warm-800">Available to donate</p>
              <p className="text-xs text-warm-500 mt-0.5">Toggle off to pause emergency notifications</p>
            </div>
            <button
              onClick={() => update('available', !form.available)}
              className={`w-12 h-6 rounded-full transition-all duration-200 relative ${
                form.available ? 'bg-teal-500' : 'bg-warm-300'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                form.available ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Save button — disabled when no changes */}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`btn-primary w-full py-3 justify-center transition-all ${
              !hasChanges ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <Save size={16} /> Save changes
          </button>
          {!hasChanges && (
            <p className="text-center text-xs text-neutral-400">No changes to save yet</p>
          )}
        </div>

        {/* ── Danger zone ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-display font-bold text-red-700">Danger zone</h2>
          </div>
          <div className="divide-y divide-red-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Deactivate account</p>
                <p className="text-xs text-neutral-500 mt-0.5">Temporarily hide your profile and pause alerts</p>
              </div>
              <button
                onClick={() => setDangerAction('deactivate')}
                className="px-4 py-2 rounded-xl border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
              >
                Deactivate
              </button>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Delete account</p>
                <p className="text-xs text-neutral-500 mt-0.5">Permanently erase all your data from BDEN</p>
              </div>
              <button
                onClick={() => setDangerAction('delete')}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Danger zone modal */}
      {dangerAction && (
        <DangerModal
          action={dangerAction}
          onConfirm={handleDangerConfirm}
          onCancel={() => setDangerAction(null)}
        />
      )}
    </>
  )
}