// src/pages/auth/Login.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Droplets, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login, loginWithGoogle }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname || null

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const update = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(form.email, form.password)
      if (from) {
        navigate(from, { replace: true })
      } else if (user.role === 'hospital') {
        navigate('/hospital/dashboard')
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/donor/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err.message || 'Google login is not available right now.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-warm-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] opacity-[0.07]">
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
            Every login could<br /><span className="text-blood-500">save a life.</span>
          </h2>
          <p className="text-warm-400 text-base leading-relaxed max-w-sm">
            Your donor profile is waiting. Sign in to respond to emergencies,
            track your donation history, and claim your benefits.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[{ value: '12,480+', label: 'Donors' }, { value: '89', label: 'Hospitals' }, { value: '3,240+', label: 'Lives saved' }].map(s => (
            <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="font-display font-bold text-2xl text-blood-400">{s.value}</p>
              <p className="text-xs text-warm-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-warm-50">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-blood-600 flex items-center justify-center">
              <Droplets size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-warm-950">BD<span className="text-blood-600">EN</span></span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-warm-950 mb-2">Welcome back</h1>
            <p className="text-warm-500 text-sm">Sign in to your BDEN account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input name="email" type="email" value={form.email} onChange={update}
                  placeholder="you@example.com" className="input pl-10" autoComplete="email" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button type="button" className="text-xs text-blood-600 hover:text-blood-700 font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={update} placeholder="Your password" className="input pl-10 pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blood-50 border border-blood-200">
                <div className="w-1.5 h-1.5 rounded-full bg-blood-500 flex-shrink-0" />
                <p className="text-sm text-blood-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base justify-center">
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <> Sign in <ArrowRight size={16} /> </>}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-warm-200" />
            <span className="text-xs text-warm-400">or</span>
            <div className="h-px flex-1 bg-warm-200" />
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading}
            className="btn-secondary w-full py-3 text-base justify-center flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2418h2.9045c1.7018-1.5668 2.6877-3.874 2.6877-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9045-2.2418c-.8059.54-1.8368.859-3.0519.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.7264c-.18-.54-.2822-1.1168-.2822-1.7264s.1023-1.1864.2822-1.7264V4.9418H.9574C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9574 4.0582l3.0066-2.3318z" fill="#FBBC05"/>
              <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9418L3.964 7.2736C4.6718 5.1464 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-warm-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blood-600 font-semibold hover:text-blood-700">
              Register as donor
            </Link>
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-white border border-warm-200 text-center">
            <p className="text-xs text-warm-500 mb-2">Are you a health facility?</p>
            <Link to="/register?role=hospital" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              Register your hospital →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
