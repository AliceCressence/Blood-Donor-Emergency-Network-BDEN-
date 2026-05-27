// src/pages/donor/ProfileSettings.jsx
import { useState } from 'react'
import {
  User, Phone, MapPin, Droplets, Bell,
  Shield, Eye, EyeOff, Save, CheckCircle, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
const CITIES = ['Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Bamenda']

function Section({ title, description, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-100">
        <h2 className="font-display font-bold text-neutral-900">{title}</h2>
        {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900
        focus:outline-none focus:ring-2 focus:ring-blood-500 focus:border-transparent
        placeholder:text-neutral-400 transition-all ${className}`}
      {...props}
    />
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${
          checked ? 'bg-blood-600' : 'bg-neutral-200'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </button>
    </div>
  )
}

export default function ProfileSettings() {
  const { user } = useAuth()

  const [profile, setProfile] = useState({
    name: user?.name || 'Alice Cressence',
    email: user?.email || 'alice@example.com',
    gender: user?.gender || 'F',
    phone: '+237 6XX XXX XXX',
    city: 'Yaoundé',
    bloodType: 'O−',
    bloodTypeConfirmed: true,
  })

  const [notifications, setNotifications] = useState({
    emergencyAlerts: true,
    campaignUpdates: true,
    eligibilityReminders: true,
    emailNotifs: false,
    smsNotifs: true,
  })

  const [privacy, setPrivacy] = useState({
    showOnMap: true,
    shareBloodType: true,
    allowHospitalContact: true,
  })

  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In production: call API
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">Profile Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your donor profile and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-blood-600 hover:bg-blood-700 text-white'
          }`}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Personal info */}
      <Section title="Personal Information" description="Your basic profile details">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <Input
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email Address">
            <Input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Gender" hint="Required for medical eligibility formulas">
            <select
              value={profile.gender}
              onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </Field>
          <Field label="Phone Number" hint="Used for emergency SMS alerts">
            <Input
              type="tel"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+237 6XX XXX XXX"
            />
          </Field>
          <Field label="City">
            <select
              value={profile.city}
              onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
              className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blood-500 focus:border-transparent bg-white"
            >
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Blood type */}
      <Section title="Blood Type" description="Your blood type is used to match you with compatible requests">
        <Field label="Blood Type" hint={profile.bloodTypeConfirmed ? 'Lab-verified by hospital' : 'Self-reported — get confirmed at a hospital'}>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map(bt => (
              <button
                key={bt}
                onClick={() => setProfile(p => ({ ...p, bloodType: bt, bloodTypeConfirmed: false }))}
                className={`py-2.5 rounded-xl border text-sm font-bold font-mono transition-all ${
                  profile.bloodType === bt
                    ? 'bg-blood-600 text-white border-blood-600'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-blood-300 hover:text-blood-600'
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </Field>
        {profile.bloodTypeConfirmed ? (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
            <CheckCircle size={13} /> Lab-verified by Hôpital Central Yaoundé
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
            <AlertTriangle size={13} /> Self-reported. Get it confirmed at a hospital for full verification.
          </div>
        )}
      </Section>

      {/* Notification preferences */}
      <Section title="Notification Preferences" description="Choose what alerts you want to receive">
        <div className="space-y-4">
          <Toggle
            label="Emergency Alerts"
            description="Get notified when a compatible blood type is urgently needed near you"
            checked={notifications.emergencyAlerts}
            onChange={v => setNotifications(p => ({ ...p, emergencyAlerts: v }))}
          />
          <Toggle
            label="Campaign Updates"
            description="News about upcoming donation campaigns in your city"
            checked={notifications.campaignUpdates}
            onChange={v => setNotifications(p => ({ ...p, campaignUpdates: v }))}
          />
          <Toggle
            label="Eligibility Reminders"
            description="Remind me when I'm eligible to donate again"
            checked={notifications.eligibilityReminders}
            onChange={v => setNotifications(p => ({ ...p, eligibilityReminders: v }))}
          />
          <div className="border-t border-neutral-100 pt-4 space-y-4">
            <Toggle
              label="Email Notifications"
              description="Receive alerts by email"
              checked={notifications.emailNotifs}
              onChange={v => setNotifications(p => ({ ...p, emailNotifs: v }))}
            />
            <Toggle
              label="SMS Notifications"
              description="Receive alerts by SMS (uses your phone number above)"
              checked={notifications.smsNotifs}
              onChange={v => setNotifications(p => ({ ...p, smsNotifs: v }))}
            />
          </div>
        </div>
      </Section>

      {/* Privacy */}
      <Section title="Privacy & Visibility" description="Control how your data is shared within the BDEN network">
        <div className="space-y-4">
          <Toggle
            label="Show on donor map"
            description="Allow hospitals to see that an eligible O− donor is in the area (your exact location is never shared)"
            checked={privacy.showOnMap}
            onChange={v => setPrivacy(p => ({ ...p, showOnMap: v }))}
          />
          <Toggle
            label="Share blood type with hospitals"
            description="Allow hospitals running campaigns to filter by blood type compatibility"
            checked={privacy.shareBloodType}
            onChange={v => setPrivacy(p => ({ ...p, shareBloodType: v }))}
          />
          <Toggle
            label="Allow hospital contact"
            description="Allow verified hospitals to contact you directly during critical emergencies"
            checked={privacy.allowHospitalContact}
            onChange={v => setPrivacy(p => ({ ...p, allowHospitalContact: v }))}
          />
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" description="Use a strong, unique password for your account">
        <Field label="Current Password">
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={password.current}
              onChange={e => setPassword(p => ({ ...p, current: e.target.value }))}
              placeholder="Enter current password"
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              onClick={() => setShowPass(s => !s)}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="New Password">
            <Input
              type={showPass ? 'text' : 'password'}
              value={password.next}
              onChange={e => setPassword(p => ({ ...p, next: e.target.value }))}
              placeholder="New password"
            />
          </Field>
          <Field label="Confirm New Password">
            <Input
              type={showPass ? 'text' : 'password'}
              value={password.confirm}
              onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Confirm password"
            />
          </Field>
        </div>
        {password.next && password.confirm && password.next !== password.confirm && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle size={12} /> Passwords do not match
          </p>
        )}
      </Section>

      {/* Danger zone */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <h2 className="font-display font-bold text-red-900 mb-1">Danger Zone</h2>
        <p className="text-sm text-red-600 mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex flex-wrap gap-3">
          <button className="text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors">
            Deactivate account
          </button>
          <button className="text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-xl transition-colors">
            Delete account permanently
          </button>
        </div>
      </div>

      {/* Save footer */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-blood-600 hover:bg-blood-700 text-white'
          }`}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Changes saved!' : 'Save all changes'}
        </button>
      </div>
    </div>
  )
}

