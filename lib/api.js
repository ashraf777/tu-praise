import apiClient from './apiClient'
export { default as apiClient } from './apiClient'

export const adminGoalsApi = {
  list: (params = {}) => apiClient.get('/admin/goals', { params }),
}

export const goalsApi = {
  list: (params = {}) =>
    apiClient.get('/goals', { params }),

  get: (goalNo) =>
    apiClient.get(`/goals/${goalNo}`),

  create: (data) =>
    apiClient.post('/goals', data),

  update: (goalNo, data) =>
    apiClient.put(`/goals/${goalNo}`, data),

  updateBaseline: (goalNo, data) =>
    apiClient.patch(`/goals/${goalNo}/baseline`, data),

  updateResult: (goalNo, data) =>
    apiClient.patch(`/goals/${goalNo}/result`, data),

  updateStatus: (goalNo, data) =>
    apiClient.patch(`/goals/${goalNo}/status`, typeof data === 'object' ? data : { status: data }),

  delete: (goalNo) =>
    apiClient.delete(`/goals/${goalNo}`),

  // Reviewers
  getReviewers: (goalNo) =>
    apiClient.get(`/goals/${goalNo}/reviewers`),

  addReviewer: (goalNo, data) =>
    apiClient.post(`/goals/${goalNo}/reviewers`, data),

  removeReviewer: (goalNo, reviewerNo) =>
    apiClient.delete(`/goals/${goalNo}/reviewers/${reviewerNo}`),

  // Comments
  getComments: (goalNo, page = 1) =>
    apiClient.get(`/goals/${goalNo}/comments`, { params: { page } }),

  addComment: (goalNo, message) =>
    apiClient.post(`/goals/${goalNo}/comments`, { content_type: 1, message }),

  deleteComment: (goalNo, commentNo) =>
    apiClient.delete(`/goals/${goalNo}/comments/${commentNo}`),

  // History
  getHistory: (goalNo) =>
    apiClient.get(`/goals/${goalNo}/history`),
}

export const cyclesApi = {
  list: (params = {}) =>
    apiClient.get('/cycles', { params }),

  listAdmin: (params = {}) =>
    apiClient.get('/admin/cycles', { params }),

  create: (data) =>
    apiClient.post('/admin/cycles', data),

  update: (cycleNo, data) =>
    apiClient.put(`/admin/cycles/${cycleNo}`, data),

  updateStatus: (cycleNo, status) =>
    apiClient.patch(`/admin/cycles/${cycleNo}/status`, { status }),
}

export const employeesApi = {
  list: (params = {}) =>
    apiClient.get('/employees', { params }),

  listAdmin: (params = {}) =>
    apiClient.get('/admin/employees', { params }),

  create: (data) =>
    apiClient.post('/admin/employees', data),

  update: (employeeNo, data) =>
    apiClient.put(`/admin/employees/${employeeNo}`, data),

  updateStatus: (employeeNo, status) =>
    apiClient.patch(`/admin/employees/${employeeNo}/status`, { status }),
}

export const clientsApi = {
  list: (params = {}) =>
    apiClient.get('/admin/clients', { params }),

  create: (data) =>
    apiClient.post('/admin/clients', data),

  update: (clientNo, data) =>
    apiClient.put(`/admin/clients/${clientNo}`, data),

  updateStatus: (clientNo, status) =>
    apiClient.patch(`/admin/clients/${clientNo}/status`, { status }),
}

export const feedApi = {
  list: (params = {}) =>
    apiClient.get('/feed', { params }),
}

export const dashboardApi = {
  myGoals: () =>
    apiClient.get('/dashboard/my-goals'),

  team: () =>
    apiClient.get('/dashboard/team'),
}

// Goal helpers
export const GOAL_TYPES = {
  1: 'By Value',
  2: 'By Date',
  3: 'By State',
}

export const GOAL_STATUSES = {
  1: { label: 'Created', color: 'bg-gray-100 text-gray-700' },
  2: { label: 'Baselined', color: 'bg-blue-100 text-blue-700' },
  3: { label: 'Successful', color: 'bg-green-100 text-green-700' },
  4: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  5: { label: 'Archived', color: 'bg-yellow-100 text-yellow-700' },
  9: { label: 'Deleted', color: 'bg-gray-100 text-gray-500' },
}

export const REVIEWER_TYPES = {
  1: 'Primary Supervisor',
  2: 'Secondary Supervisor',
}
