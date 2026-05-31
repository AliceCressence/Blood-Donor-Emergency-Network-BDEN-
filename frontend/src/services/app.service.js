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
const apiBloodList = (items = []) => items.map(normalizeBlood)

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
    latitude: item.latitude,
    longitude: item.longitude,
  }
}

function requestPayload(payload, user) {
  return {
    hospital_id: user?.id,
    hospital_name: user?.facilityName || user?.name || 'Hospital',
    city: payload.city || user?.city || '',
    blood_type: normalizeBlood(payload.bloodType),
    units_needed: payload.units,
    urgency: apiUrgency(payload.urgency),
    notes: payload.notes || '',
    latitude: payload.latitude ? Number(payload.latitude) : null,
    longitude: payload.longitude ? Number(payload.longitude) : null,
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

export function normalizeCampaign(item) {
  return {
    ...item,
    id: item.id,
    hospital: item.hospital_name || item.hospital || 'Hospital',
    hospitalName: item.hospital_name || item.hospital || 'Hospital',
    hospitalEmail: item.hospital_email || '',
    title: item.title || '',
    description: item.description || '',
    bloodTypes: (item.blood_types_needed || []).map(displayBlood),
    bloodTypesNeeded: item.blood_types_needed || [],
    targetDonors: item.target_donors || 0,
    targetVolumeMl: item.target_volume_ml || 0,
    incentives: item.donor_incentives || '',
    startDate: item.start_datetime,
    endDate: item.end_datetime,
    latitude: item.latitude,
    longitude: item.longitude,
    city: item.city || '',
    address: item.address || '',
    status: normalizeStatus(item.status || 'PENDING'),
    rawStatus: item.status || 'PENDING',
    rejectionReason: item.rejection_reason || '',
    actualDonors: item.actual_donors || 0,
    actualVolumeMl: item.actual_volume_ml || 0,
    interestedCount: item.interested_count || 0,
    donorProgressPct: item.donor_progress_pct,
    volumeProgressPct: item.volume_progress_pct,
    distanceKm: item.distance_km,
    createdAt: item.created_at,
  }
}

function campaignPayload(payload, user) {
  const start = new Date(`${payload.startDate || payload.date}T${payload.startTime || '08:00'}`)
  const end = new Date(`${payload.endDate || payload.startDate || payload.date}T${payload.endTime || '16:00'}`)
  return {
    hospital_name: user?.facilityName || user?.name || 'Hospital',
    hospital_email: user?.email || '',
    title: payload.title,
    description: payload.description,
    blood_types_needed: apiBloodList(payload.bloodTypes),
    target_donors: payload.targetDonors ? Number(payload.targetDonors) : null,
    target_volume_ml: payload.targetVolumeMl ? Number(payload.targetVolumeMl) : null,
    donor_incentives: payload.incentives || '',
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
    latitude: Number(payload.latitude || 3.8667),
    longitude: Number(payload.longitude || 11.5167),
    city: payload.city || user?.city || '',
    address: payload.address || '',
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
      const { data } = await api.post('/api/requests/', requestPayload(payload, user))
      return normalizeRequest(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async edit(id, payload, user) {
    try {
      const { data } = await api.patch(`/api/requests/${id}/`, requestPayload(payload, user))
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

export const campaignApi = {
  async list(params = {}) {
    try {
      const { data } = await api.get('/api/campaigns/', { params: { ...params, blood_type: params.blood_type ? normalizeBlood(params.blood_type) : undefined } })
      return data.map(normalizeCampaign)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async nearby(params = {}) {
    try {
      const { data } = await api.get('/api/campaigns/nearby/', { params })
      return data.map(normalizeCampaign)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async mine() {
    try {
      const { data } = await api.get('/api/campaigns/mine/')
      return data.map(normalizeCampaign)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async create(payload, user) {
    try {
      const { data } = await api.post('/api/campaigns/', campaignPayload(payload, user))
      return normalizeCampaign(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async edit(id, payload, user) {
    try {
      const { data } = await api.patch(`/api/campaigns/${id}/edit/`, campaignPayload(payload, user))
      return normalizeCampaign(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async updateProgress(id, payload) {
    try {
      const { data } = await api.patch(`/api/campaigns/${id}/progress/`, {
        actual_donors: Number(payload.actualDonors || 0),
        actual_volume_ml: Number(payload.actualVolumeMl || 0),
      })
      return normalizeCampaign(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async cancel(id, reason = '') {
    try {
      const { data } = await api.post(`/api/campaigns/${id}/cancel/`, { reason })
      return normalizeCampaign(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async pending() {
    try {
      const { data } = await api.get('/api/campaigns/pending/')
      return data.map(normalizeCampaign)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async adminList(params = {}) {
    try {
      const { data } = await api.get('/api/campaigns/admin/all/', { params })
      return data.map(normalizeCampaign)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async review(id, action, reason = '') {
    try {
      const { data } = await api.post(`/api/campaigns/${id}/review/`, { action, reason })
      return normalizeCampaign(data)
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async interest(id) {
    try {
      const { data } = await api.post(`/api/campaigns/${id}/interest/`)
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async withdrawInterest(id) {
    try {
      const { data } = await api.delete(`/api/campaigns/${id}/interest/`)
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
}

export const mythApi = {
  async list(params = {}) {
    try {
      const { data } = await api.get('/api/myths/', { params })
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async create(payload) {
    try {
      const { data } = await api.post('/api/myths/create/', payload)
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
  async update(id, payload) {
    try {
      const { data } = await api.patch(`/api/myths/${id}/edit/`, payload)
      return data
    } catch (error) {
      throw new Error(getApiError(error), { cause: error })
    }
  },
}
