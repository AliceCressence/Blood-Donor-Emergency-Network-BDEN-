// src/services/auth.service.js
// Placeholder — will connect to real API in Phase 3

export const authService = {
  login: async (email, password) => {
    // TODO: replace with real API call
    // return await api.post('/auth/login', { email, password })
    return {
      user:  { id: '1', name: 'Alice', email, role: 'donor' },
      token: 'mock-token',
    }
  },

  register: async (payload) => {
    // TODO: replace with real API call
    return {
      user:  { id: '1', name: payload.name, email: payload.email, role: payload.role },
      token: 'mock-token',
    }
  },

  logout: async () => {
    // TODO: call API to invalidate token
  },
}