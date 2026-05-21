// src/services/auth.service.js
export const authService = {
  login: async (email, password) => {
    // Detect role from email for testing
    const role = email.includes('hospital') ? 'hospital' : 'donor'
    return {
      user: {
        id: '1',
        name: role === 'hospital' ? 'Hôpital Central' : 'Alice Cressence',
        email,
        role,
        bloodType: 'O+',
        city: 'Yaoundé',
        facilityName: 'Hôpital Central de Yaoundé',
      },
      token: 'mock-token',
    }
  },

  register: async (payload) => {
    return {
      user: { id: '1', ...payload },
      token: 'mock-token',
    }
  },
}