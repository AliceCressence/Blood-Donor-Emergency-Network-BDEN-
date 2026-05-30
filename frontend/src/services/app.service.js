import { api, getApiError } from './api'

const normalizeBlood = (value = '') => value.replace('−', '-')
const displayBlood = (value = '') => value.replace('-', '−')
const normalizeStatus = (value = '') => value.toLowerCase()
const normalizeUrgency = (value = '') => {
  const map = { CRITICAL: 'critical', HIGH: 'urgent', MEDIUM: 'standard', LOW: 'standard' }
  return map[value] || value.toLowerCase()
}
const apiUrgency = (value = '') => {
  const map = { critical: 'CRITICAL', urgent: 'HIGH', standard: 'MEDIUM' }
  return map[value] || value.toUpperCase()
}

export function formatRelativeTime(value) {
  if (!value) return 'Just now'
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  if (hr < 24) return `${hr}h ago`
  if (day < 7) return `${day}d ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function normalizeRequest(item) {
  return {
    ...item,
    id: item.id,
    hospital: item.hospital_name || item.hospital || 'Hospital',
    bloodType: displayBlood(item.blood_type || item.bloodType || ''),
    urgency: normalizeUrgency(item.urgency),
    status: normalizeStatus(item.status || 'ACTIVE'),
    units: item.units_needed ?? item.units ?? 1,
    unitsNeeded: item.units_needed ?? item.unitsNeeded ?? 1,
    donors: item.responses_count ?? item.donors ?? 0,
    time: formatRelativeTime(item.created_at),
    postedAgo: formatRelativeTime(item.created_at),
    notes: item.notes || '',
    city: item.city || '',
  }
}

function normalizeNotification(item) {
  return {
    ...item,
    type: (item.type || 'SYSTEM').toLowerCase(),
    message: item.body || item.message || '',
    date: item.created_at ? new Date(item.created_at) : new Date(),
  }
}

export const donorApi = {
  async getProfile() {
    try {
      const { data } = await api.get('/api/donors/me/')
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async getCard() {
    try {
      const { data } = await api.get('/api/donors/me/card/')
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async getDonations() {
    try {
      const { data } = await api.get('/api/donors/me/donations/')
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async getScreeningCenters(params = {}) {
    try {
      const { data } = await api.get('/api/donors/screening-centers/', { params })
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
}

export const requestApi = {
  async list(params = {}) {
    try {
      const { data } = await api.get('/api/requests/active/', { params })
      return data.map(normalizeRequest)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async detail(id) {
    try {
      const { data } = await api.get(`/api/requests/${id}/`)
      return normalizeRequest(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async create(payload, user) {
    try {
      const { data } = await api.post('/api/requests/', {
        hospital_id: user?.id,
        hospital_name: user?.facilityName || user?.name || 'Hospital',
        city: user?.city || payload.city || '',
        blood_type: normalizeBlood(payload.bloodType),
        units_needed: payload.units,
        urgency: apiUrgency(payload.urgency),
        notes: payload.notes || '',
      })
      return normalizeRequest(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async respond(id, payload) {
    try {
      const { data } = await api.post(`/api/requests/${id}/respond/`, payload)
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async close(id, status) {
    try {
      const endpoint = status === 'CANCELLED' ? `/api/requests/${id}/cancel/` : `/api/requests/${id}/close/`
      const method = status === 'CANCELLED' ? 'post' : 'put'
      const { data } = await api[method](endpoint, { status })
      return normalizeRequest(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
}

export const notificationApi = {
  async list(userId, params = {}) {
    try {
      const requestParams = userId ? { user_id: userId, ...params } : params
      const { data } = await api.get('/api/notifications/', { params: requestParams })
      return {
        notifications: (data.notifications || []).map(normalizeNotification),
        unreadCount: data.unread_count || 0,
      }
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async markRead(id) {
    try {
      const { data } = await api.post('/api/notifications/mark-read/', { notification_ids: [id] })
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async markAllRead(userId) {
    try {
      const { data } = await api.post('/api/notifications/mark-read/', { user_id: userId, all: true })
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
}
