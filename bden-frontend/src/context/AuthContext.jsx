// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
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
    localStorage.setItem('bden_token', data.token)
    return data.user
  }

  const register = async (payload) => {
    const data = await authService.register(payload)
    setUser(data.user)
    localStorage.setItem('bden_user', JSON.stringify(data.user))
    localStorage.setItem('bden_token', data.token)
    return data.user
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bden_user')
    localStorage.removeItem('bden_token')
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('bden_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
