// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: check for existing session
  useEffect(() => {
    const stored = localStorage.getItem('bden_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.removeItem('bden_user') }
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    localStorage.setItem('bden_user', JSON.stringify(data.user))
    localStorage.setItem('bden_token', data.access || data.token)
    localStorage.setItem('bden_refresh', data.refresh)
    return data.user
  }

  const register = async (payload) => {
    const data = await authService.register(payload)
    if (data.user) {
      setUser(data.user)
      localStorage.setItem('bden_user', JSON.stringify(data.user))
      localStorage.setItem('bden_token', data.access || data.token)
      localStorage.setItem('bden_refresh', data.refresh)
    }
    return data.user
  }

  const logout = () => {
    const refresh = localStorage.getItem('bden_refresh')
    authService.logout(refresh).catch(() => {})
    setUser(null)
    localStorage.removeItem('bden_user')
    localStorage.removeItem('bden_token')
    localStorage.removeItem('bden_refresh')
  }

  const loginWithGoogle = async () => {
    const url = await authService.getGoogleAuthUrl()
    window.location.assign(url)
  }

  const completeGoogleLogin = useCallback(async (code) => {
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const data = await authService.completeGoogleAuth(code, redirectUri)
    setUser(data.user)
    localStorage.setItem('bden_user', JSON.stringify(data.user))
    localStorage.setItem('bden_token', data.access || data.token)
    localStorage.setItem('bden_refresh', data.refresh)
    return data.user
  }, [])

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('bden_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, loginWithGoogle, completeGoogleLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
