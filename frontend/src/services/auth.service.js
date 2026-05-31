import { api } from './api'

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
    name: user.name || data.name || '',
    phone: user.phone || data.phone || '',
    contactPhone: user.contactPhone || data.contact_phone || data.contactPhone || user.phone || data.phone || '',
    city: user.city || data.city || '',
    region: user.region || data.region || '',
    address: user.address || data.address || '',
    facilityName: user.facilityName || data.facility_name || data.facilityName || '',
    facilityType: user.facilityType || data.facility_type || data.facilityType || '',
    registrationNumber: user.registrationNumber || data.registration_number || data.registrationNumber || '',
    verificationStatus: user.verificationStatus || data.verification_status || data.verificationStatus || '',
    bloodType: user.bloodType || data.bloodType || data.blood_type || '',
    gender: user.gender || data.gender || '',
    authProvider: user.authProvider || data.auth_provider || (user.google_id ? 'google' : 'email'),
    profileComplete: data.profile_complete ?? user.profileComplete,
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

  updateCurrentUser: async (payload) => {
    try {
      const access = localStorage.getItem('bden_token')
      const { data } = await api.patch(
        '/api/auth/me/',
        payload,
        { headers: { Authorization: `Bearer ${access}` } },
      )
      return normalizeUser(data)
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  updateHospitalProfile: async (payload) => {
    try {
      const { data } = await api.patch('/api/auth/me/', {
        facilityName: payload.facilityName || '',
        facilityType: payload.facilityType || '',
        address: payload.address || '',
        city: payload.city || '',
        region: payload.region || '',
        contactPhone: payload.contactPhone || payload.phone || '',
      })
      return normalizeUser(data)
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  updateDonorProfile: async (payload) => {
    try {
      const access = localStorage.getItem('bden_token')
      const names = splitName(payload.name || '')
      const body = {
        first_name: names.first_name,
        last_name: names.last_name,
        phone: payload.phone || '',
        city: payload.city || '',
        gender: payload.gender || '',
        availability_status: payload.available ? 'AVAILABLE' : 'UNAVAILABLE',
      }
      Object.keys(body).forEach(key => {
        if (body[key] === undefined) delete body[key]
      })
      const { data } = await api.patch(
        '/api/donors/me/',
        body,
        { headers: { Authorization: `Bearer ${access}` } },
      )
      return data
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  updateDonorBloodType: async (bloodType) => {
    if (!bloodType) return null
    try {
      const access = localStorage.getItem('bden_token')
      const { data } = await api.patch(
        '/api/donors/me/blood-type/',
        { blood_type: bloodType, verified: false },
        { headers: { Authorization: `Bearer ${access}` } },
      )
      return data
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
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

  listPendingHospitals: async () => {
    try {
      const { data } = await api.get('/api/admin/hospitals/pending/')
      return data.results || []
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  listHospitals: async (params = {}) => {
    try {
      const { data } = await api.get('/api/admin/hospitals/pending/', { params })
      return data.results || []
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },

  verifyHospital: async (userId, action, reason = '') => {
    try {
      const { data } = await api.post(`/api/admin/hospitals/${userId}/verify/`, { action, reason })
      return data
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error })
    }
  },
}
