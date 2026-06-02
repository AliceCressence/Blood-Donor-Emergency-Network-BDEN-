import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise = null

function clearSession() {
  localStorage.removeItem('bden_user')
  localStorage.removeItem('bden_token')
  localStorage.removeItem('bden_refresh')
  window.dispatchEvent(new Event('bden:session-expired'))
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bden_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const refresh = localStorage.getItem('bden_refresh')

    if (status !== 401 || original?._retry || original?.url?.startsWith('/api/auth/')) {
      return Promise.reject(error)
    }

    if (!refresh) {
      clearSession()
      return Promise.reject(error)
    }

    original._retry = true

    try {
      refreshPromise ||= authApi.post('/api/auth/token/refresh/', { refresh })
      const { data } = await refreshPromise
      refreshPromise = null

      localStorage.setItem('bden_token', data.access)
      if (data.refresh) localStorage.setItem('bden_refresh', data.refresh)

      original.headers = original.headers || {}
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    } catch (refreshError) {
      refreshPromise = null
      clearSession()
      return Promise.reject(refreshError)
    }
  },
)

export function getApiError(error, fallback = 'Request failed. Please try again.') {
  const data = error.response?.data
  if (!data) return 'Network error. Please check that the backend is running.'
  if (typeof data.detail === 'string') return data.detail
  const firstKey = Object.keys(data)[0]
  const value = data[firstKey]
  if (Array.isArray(value)) return value[0]
  if (typeof value === 'string') return value
  return fallback
}
