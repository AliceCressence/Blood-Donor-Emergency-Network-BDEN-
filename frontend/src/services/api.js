import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bden_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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
