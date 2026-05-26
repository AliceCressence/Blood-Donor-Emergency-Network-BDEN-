import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const facilityTypeMap = {
  'Public hospital': 'HOSPITAL',
  'Private clinic': 'CLINIC',
  'Health centre': 'HEALTH_CENTER',
  'NGO health facility': 'NGO',
  Other: 'OTHER',
}

function splitName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' '),
  }
}

function normalizeUser(data) {
  const user = data.user || {}
  return {
    id: user.id || data.user_id,
    email: user.email || data.email,
    role: (user.role || data.role || '').toLowerCase(),
    isVerified: user.isVerified ?? data.is_verified ?? false,
    profileComplete: data.profile_complete,
  }
}

function errorMessage(error) {
  const data = error.response?.data
  if (!data) return 'Network error. Please check that the backend is running.'
  if (typeof data.detail === 'string') return data.detail
  const firstKey = Object.keys(data)[0]
  const value = data[firstKey]
  if (Array.isArray(value)) return value[0]
  if (typeof value === 'string') return value
  return 'Request failed. Please review your details and try again.'
}

export const authService = {
  login: async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login/', { email, password })
      return {
        user: normalizeUser(data),
        access: data.access,
        refresh: data.refresh,
        token: data.access,
      }
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  register: async (payload) => {
    try {
      if (payload.role === 'hospital') {
        const { data } = await api.post('/api/auth/register/hospital/', {
          email: payload.email,
          password: payload.password,
          facility_name: payload.facilityName,
          facility_type: facilityTypeMap[payload.facilityType] || 'OTHER',
          registration_number: payload.licenseNo || `TEMP-${Date.now()}`,
          address: payload.address || '',
          city: payload.city,
          region: payload.region || '',
          contact_phone: payload.phone || '',
        })
        return {
          status: data.status,
          message: data.message,
          user: null,
        }
      }

      const names = splitName(payload.name)
      const { data } = await api.post('/api/auth/register/donor/', {
        email: payload.email,
        password: payload.password,
        first_name: names.first_name,
        last_name: names.last_name,
        phone: payload.phone,
        city: payload.city,
        blood_type: payload.bloodType || '',
      })

      return {
        user: normalizeUser(data),
        access: data.access,
        refresh: data.refresh,
        token: data.access,
      }
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  logout: async (refresh) => {
    const access = localStorage.getItem('bden_token')
    if (!access || !refresh) return
    await api.post(
      '/api/auth/logout/',
      { refresh },
      { headers: { Authorization: `Bearer ${access}` } },
    )
  },

  getGoogleAuthUrl: async () => {
    try {
      const { data } = await api.get('/api/auth/google/')
      return data.authorization_url
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  completeGoogleAuth: async (code, redirectUri) => {
    try {
      const { data } = await api.post('/api/auth/google/callback/', {
        code,
        redirect_uri: redirectUri,
      })
      return {
        user: normalizeUser(data),
        access: data.access,
        refresh: data.refresh,
        token: data.access,
      }
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },
}
