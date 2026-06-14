import apiClient from './apiClient'

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  logout: () =>
    apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get('/auth/me'),

  changePassword: (currentPassword, newPassword) =>
    apiClient.put('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    }),
}

export const getEmployee = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('praise_employee')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const saveAuth = (token, employee) => {
  localStorage.setItem('praise_token', token)
  localStorage.setItem('praise_employee', JSON.stringify(employee))
}

export const clearAuth = () => {
  localStorage.removeItem('praise_token')
  localStorage.removeItem('praise_employee')
}

export const isLoggedIn = () => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('praise_token')
}
