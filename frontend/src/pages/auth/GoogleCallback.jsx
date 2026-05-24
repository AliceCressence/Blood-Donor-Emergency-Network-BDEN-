import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Droplets } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function GoogleCallback() {
  const { completeGoogleLogin } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code')
  const [error, setError] = useState(code ? '' : 'Google did not return an authorization code.')

  useEffect(() => {
    if (!code) return

    completeGoogleLogin(code)
      .then((user) => {
        if (user.role === 'admin') navigate('/admin/dashboard', { replace: true })
        else if (user.role === 'hospital') navigate('/hospital/dashboard', { replace: true })
        else navigate('/donor/dashboard', { replace: true })
      })
      .catch((err) => {
        setError(err.message || 'Google login failed. Please try again.')
      })
  }, [code, completeGoogleLogin, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-blood-600 flex items-center justify-center mx-auto mb-5">
          <Droplets size={22} className="text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-warm-950 mb-2">Connecting Google</h1>
        {error ? (
          <>
            <p className="text-sm text-blood-700 mb-6">{error}</p>
            <Link to="/login" className="btn-primary px-6 py-3 justify-center inline-flex">
              Back to login
            </Link>
          </>
        ) : (
          <p className="text-sm text-warm-500">Finishing your secure BDEN sign in...</p>
        )}
      </div>
    </div>
  )
}
