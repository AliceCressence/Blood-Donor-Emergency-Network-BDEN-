// src/pages/auth/Register.jsx
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Droplets, Heart, Building2, User, Mail, Lock, Phone,
  Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, MapPin, HelpCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const BLOOD_TYPES  = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
const FACILITY_TYPES = ['Public hospital', 'Private clinic', 'Health centre', 'NGO health facility', 'Other']

// ── Step progress sidebar ──────────────────────────────────────
function StepList({ steps, current }) {
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s} className={`flex items-center gap-3 transition-all duration-300
          ${i === current ? 'opacity-100' : i < current ? 'opacity-70' : 'opacity-25'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
            ${i < current  ? 'bg-teal-500 text-white'
            : i === current ? 'bg-blood-500 text-white'
            : 'bg-white/10 text-white/40'}`}>
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span className={`text-sm font-medium ${i === current ? 'text-white' : 'text-warm-500'}`}>{s}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const initialRole  = params.get('role') === 'hospital' ? 'hospital' : null

  const [role,       setRole]       = useState(initialRole)
  const [step,       setStep]       = useState(initialRole ? 1 : 0)
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [bloodKnown, setBloodKnown] = useState(null) // true | false | null

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '',
    bloodType: '', facilityName: '', facilityType: '', licenseNo: '',
  })

  const update = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError('') }

  const donorSteps    = ['Role', 'Account', 'Profile', 'Blood type', 'Done']
  const hospitalSteps = ['Role', 'Account', 'Facility', 'Done']
  const steps = role === 'hospital' ? hospitalSteps : donorSteps

  const next = () => setStep(s => s + 1)
  const back = () => { setStep(s => s - 1); setError('') }

  const selectRole = (r) => { setRole(r); setStep(1) }

  const handleFinish = async () => {
    setLoading(true)
    try {
      await register({ ...form, role })
      next() // go to Done step
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding ── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-16 bg-warm-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 opacity-[0.06]">
          <svg viewBox="0 0 200 240" fill="none">
            <path d="M100 10 C100 10 20 100 20 150 A80 80 0 0 0 180 150 C180 100 100 10 100 10Z" fill="#E51111"/>
          </svg>
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blood-600 flex items-center justify-center">
            <Droplets size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">BD<span className="text-blood-500">EN</span></span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Join the network.<br /><span className="text-blood-500">Be the difference.</span>
          </h2>
          <p className="text-warm-400 text-base leading-relaxed max-w-sm mb-10">
            Registration takes under 5 minutes. You don't need to know your blood type to start.
          </p>
          {role && <StepList steps={steps} current={step} />}
        </div>

        <p className="relative z-10 text-xs text-warm-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blood-400 hover:text-blood-300 font-medium">Sign in</Link>
        </p>
      </div>

      {/* ── Right form ── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-16 bg-warm-50">
        <div className="w-full max-w-lg">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-blood-600 flex items-center justify-center">
              <Droplets size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-warm-950">BD<span className="text-blood-600">EN</span></span>
          </div>

          {/* ════ STEP 0: Role selection ════ */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h1 className="font-display text-3xl font-bold text-warm-950 mb-2">Create your account</h1>
              <p className="text-warm-500 text-sm mb-8">How will you be using BDEN?</p>
              <div className="grid gap-4">

                <button onClick={() => selectRole('donor')}
                  className="group p-6 rounded-2xl border-2 border-warm-200 bg-white text-left
                             hover:border-blood-400 hover:shadow-card-hover transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blood-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blood-100 transition-colors">
                      <Heart size={22} className="text-blood-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-warm-900 text-lg mb-1">I'm a donor</h3>
                      <p className="text-sm text-warm-500 leading-relaxed">
                        Register to donate blood, respond to emergencies, and build your donor history.
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-warm-300 group-hover:text-blood-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>

                <button onClick={() => selectRole('hospital')}
                  className="group p-6 rounded-2xl border-2 border-warm-200 bg-white text-left
                             hover:border-teal-400 hover:shadow-card-hover transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                      <Building2 size={22} className="text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-warm-900 text-lg mb-1">I represent a hospital</h3>
                      <p className="text-sm text-warm-500 leading-relaxed">
                        Post emergency requests, organize donation campaigns, and manage your donor network.
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-warm-300 group-hover:text-teal-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-warm-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-blood-600 font-semibold hover:text-blood-700">Sign in</Link>
              </p>
            </div>
          )}

          {/* ════ STEP 1: Account details ════ */}
          {step === 1 && (
            <div className="animate-fade-in">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 mb-6 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <h1 className="font-display text-3xl font-bold text-warm-950 mb-2">Account details</h1>
              <p className="text-warm-500 text-sm mb-8">Your login credentials</p>

              <div className="space-y-5">
                <div>
                  <label className="label">Full name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input name="name" value={form.name} onChange={update} placeholder="Your full name" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={update}
                      placeholder="Min. 8 characters" className="input pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-warm-400 mt-1">Use at least 8 characters including a number</p>
                </div>
              </div>

              {error && <p className="text-sm text-blood-600 mt-3">{error}</p>}

              <button onClick={next} disabled={!form.name || !form.email || !form.password}
                className="btn-primary w-full py-3 justify-center mt-6
                           disabled:opacity-40 disabled:cursor-not-allowed">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ════ STEP 2 DONOR: Personal profile ════ */}
          {step === 2 && role === 'donor' && (
            <div className="animate-fade-in">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 mb-6 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <h1 className="font-display text-3xl font-bold text-warm-950 mb-2">Your profile</h1>
              <p className="text-warm-500 text-sm mb-8">Helps us match you with nearby requests</p>

              <div className="space-y-5">
                <div>
                  <label className="label">Phone number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input name="phone" value={form.phone} onChange={update} placeholder="+237 6XX XXX XXX" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label">City / Town</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input name="city" value={form.city} onChange={update} placeholder="e.g. Yaoundé" className="input pl-10" />
                  </div>
                </div>
              </div>

              <button onClick={next} disabled={!form.phone || !form.city}
                className="btn-primary w-full py-3 justify-center mt-6
                           disabled:opacity-40 disabled:cursor-not-allowed">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ════ STEP 3 DONOR: Blood type ════ */}
          {step === 3 && role === 'donor' && (
            <div className="animate-fade-in">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 mb-6 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <h1 className="font-display text-3xl font-bold text-warm-950 mb-2">Your blood type</h1>
              <p className="text-warm-500 text-sm mb-8">This is used to match you with compatible patients</p>

              {bloodKnown === null && (
                <div className="grid gap-4 animate-fade-in">
                  <button onClick={() => setBloodKnown(true)}
                    className="p-5 rounded-2xl border-2 border-warm-200 bg-white text-left hover:border-blood-400 hover:shadow-card transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blood-50 flex items-center justify-center">
                        <CheckCircle size={18} className="text-blood-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-warm-900">Yes, I know my blood type</p>
                        <p className="text-xs text-warm-500 mt-0.5">Select it from the list</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => setBloodKnown(false)}
                    className="p-5 rounded-2xl border-2 border-warm-200 bg-white text-left hover:border-amber-400 hover:shadow-card transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        <HelpCircle size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-warm-900">I don't know my blood type</p>
                        <p className="text-xs text-warm-500 mt-0.5">No problem — we'll guide you to get tested</p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {bloodKnown === true && (
                <div className="animate-fade-in">
                  <label className="label mb-3">Select your blood type</label>
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {BLOOD_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, bloodType: t }))}
                        className={`py-3 rounded-xl border-2 font-mono font-semibold text-sm transition-all duration-150
                          ${form.bloodType === t
                            ? 'border-blood-500 bg-blood-50 text-blood-700'
                            : 'border-warm-200 bg-white text-warm-600 hover:border-blood-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setBloodKnown(null)}
                    className="text-xs text-warm-400 hover:text-warm-600 mb-4 block">
                    ← I actually don't know my type
                  </button>
                  <button onClick={handleFinish} disabled={!form.bloodType || loading}
                    className="btn-primary w-full py-3 justify-center
                               disabled:opacity-40 disabled:cursor-not-allowed">
                    {loading
                      ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : <> Complete registration <ArrowRight size={16} /> </>}
                  </button>
                </div>
              )}

              {bloodKnown === false && (
                <div className="animate-fade-in">
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
                    <p className="text-sm font-semibold text-amber-800 mb-2">What happens next?</p>
                    <ul className="space-y-2 text-sm text-amber-700">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        Your account is created as an <strong>unverified donor</strong>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        We show you nearby screening centers on your dashboard
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        Once tested, you update your profile and become fully active
                      </li>
                    </ul>
                  </div>
                  <button onClick={handleFinish} disabled={loading}
                    className="btn-primary w-full py-3 justify-center">
                    {loading
                      ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : <> Register without blood type <ArrowRight size={16} /> </>}
                  </button>
                </div>
              )}

              {error && <p className="text-sm text-blood-600 mt-3">{error}</p>}
            </div>
          )}

          {/* ════ STEP 2 HOSPITAL: Facility info ════ */}
          {step === 2 && role === 'hospital' && (
            <div className="animate-fade-in">
              <button onClick={back} className="flex items-center gap-1.5 text-sm text-warm-500 hover:text-warm-800 mb-6 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <h1 className="font-display text-3xl font-bold text-warm-950 mb-2">Facility information</h1>
              <p className="text-warm-500 text-sm mb-2">Used for admin verification of your account</p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 border border-teal-200 mb-8">
                <CheckCircle size={14} className="text-teal-600 flex-shrink-0" />
                <p className="text-xs text-teal-700">
                  All hospital accounts are reviewed by our admin team before activation. This usually takes 24–48 hours.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label">Facility name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input name="facilityName" value={form.facilityName} onChange={update}
                      placeholder="e.g. Hôpital Central de Yaoundé" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label">Facility type</label>
                  <select name="facilityType" value={form.facilityType} onChange={update} className="input">
                    <option value="">Select facility type</option>
                    {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">City / Town</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input name="city" value={form.city} onChange={update} placeholder="e.g. Yaoundé" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label">Operating license number <span className="text-warm-400 font-normal">(optional)</span></label>
                  <input name="licenseNo" value={form.licenseNo} onChange={update}
                    placeholder="Ministry of Health license no." className="input" />
                </div>
              </div>

              {error && <p className="text-sm text-blood-600 mt-3">{error}</p>}

              <button onClick={handleFinish}
                disabled={!form.facilityName || !form.facilityType || !form.city || loading}
                className="btn-primary w-full py-3 justify-center mt-6
                           disabled:opacity-40 disabled:cursor-not-allowed">
                {loading
                  ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <> Submit for verification <ArrowRight size={16} /> </>}
              </button>
            </div>
          )}

          {/* ════ DONE STEP ════ */}
          {((step === 4 && role === 'donor') || (step === 3 && role === 'hospital')) && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200
                              flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={36} className="text-teal-600" />
              </div>

              {role === 'donor' ? (
                <>
                  <h1 className="font-display text-3xl font-bold text-warm-950 mb-3">
                    You're registered! 🩸
                  </h1>
                  <p className="text-warm-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    Welcome to BDEN. Your donor profile is live. Head to your dashboard to complete your setup
                    and start responding to emergency requests.
                  </p>
                  <button onClick={() => navigate('/donor/dashboard')} className="btn-primary px-8 py-3 justify-center">
                    Go to my dashboard <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <h1 className="font-display text-3xl font-bold text-warm-950 mb-3">
                    Application submitted!
                  </h1>
                  <p className="text-warm-500 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                    Your facility registration is under review. Our admin team will verify your account
                    within 24–48 hours and notify you by email.
                  </p>
                  <div className="p-4 rounded-2xl bg-warm-100 border border-warm-200 text-left mb-8">
                    <p className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-2">Submitted details</p>
                    <p className="text-sm text-warm-800 font-medium">{form.facilityName}</p>
                    <p className="text-xs text-warm-500">{form.facilityType} · {form.city}</p>
                  </div>
                  <Link to="/" className="btn-secondary px-8 py-3 justify-center inline-flex">
                    Back to home
                  </Link>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
