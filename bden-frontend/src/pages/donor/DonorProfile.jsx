// src/pages/donor/DonorProfile.jsx
import { useState } from 'react'
import { User, Phone, MapPin, Droplets, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

export default function DonorProfile() {
  const { user, updateUser } = useAuth()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name:      user?.name      || '',
    phone:     user?.phone     || '',
    city:      user?.city      || '',
    bloodType: user?.bloodType || '',
    available: user?.available ?? true,
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    updateUser(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-warm-950">Profile settings</h1>
        <p className="text-warm-500 text-sm mt-1">Keep your information up to date for accurate matching</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-teal-50 border border-teal-200">
          <CheckCircle size={16} className="text-teal-600" />
          <p className="text-sm text-teal-800 font-medium">Profile updated successfully!</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-warm-200 shadow-card p-6 space-y-5">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
            <input value={form.name} onChange={e => update('name', e.target.value)} className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">Phone number</label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
            <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+237 6XX XXX XXX" className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">City</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
            <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="e.g. Yaoundé" className="input pl-10" />
          </div>
        </div>
        <div>
          <label className="label">Blood type</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {BLOOD_TYPES.map(t => (
              <button key={t} onClick={() => update('bloodType', t)}
                className={`py-2.5 rounded-xl border-2 font-mono font-bold text-sm transition-all
                  ${form.bloodType === t ? 'border-blood-500 bg-blood-50 text-blood-700' : 'border-warm-200 text-warm-600 hover:border-blood-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-warm-50 border border-warm-200">
          <div>
            <p className="text-sm font-semibold text-warm-800">Available to donate</p>
            <p className="text-xs text-warm-500 mt-0.5">Toggle off to pause emergency notifications</p>
          </div>
          <button onClick={() => update('available', !form.available)}
            className={`w-12 h-6 rounded-full transition-all duration-200 relative
              ${form.available ? 'bg-teal-500' : 'bg-warm-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200
              ${form.available ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        <button onClick={handleSave} className="btn-primary w-full py-3 justify-center">
          <Save size={16} /> Save changes
        </button>
      </div>
    </div>
  )
}