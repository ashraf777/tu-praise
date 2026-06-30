import apiClient from './apiClient'

export const authApi = {
  login: (company, username, password) =>
    apiClient.post('/auth/login', { company, username, password }),

  logout: () =>
    apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get('/auth/me'),
  // changePassword removed — passwords are managed by TU Leave system
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
