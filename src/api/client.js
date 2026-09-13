const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic API Helper
async function apiFetch(endpoint, options = {}) {
  const userStr = localStorage.getItem('kodevio_user');
  let userEmail = 'admin@kodevio.com';
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed?.email) userEmail = parsed.email;
    } catch (e) {
      // ignore
    }
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-User-Email': userEmail,
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (netErr) {
    // If backend is warming up, retry once after a short delay
    await new Promise((r) => setTimeout(r, 600));
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch (retryErr) {
      throw new Error(retryErr.message === 'Failed to fetch' 
        ? 'Connecting to database engine... Please retry in a moment.' 
        : retryErr.message);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error ${response.status}`);
  }

  return response.json();
}

// Authentication API Client
export const authApi = {
  login: async (credentials) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res?.token) {
      localStorage.setItem('kodevio_token', res.token);
    }
    if (res?.user) {
      localStorage.setItem('kodevio_user', JSON.stringify(res.user));
    }
    return res;
  },

  register: async (userData) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res?.token) {
      localStorage.setItem('kodevio_token', res.token);
    }
    if (res?.user) {
      localStorage.setItem('kodevio_user', JSON.stringify(res.user));
    }
    return res;
  },
};

// Named Export for AuthForm compatibility
export const loginUser = async (emailOrCredentials, password) => {
  let credentialsObj = {};
  if (typeof emailOrCredentials === 'object' && emailOrCredentials !== null) {
    credentialsObj = emailOrCredentials;
  } else {
    credentialsObj = { email: emailOrCredentials, password };
  }
  return authApi.login(credentialsObj);
};

// User Profile API Client
export const profileApi = {
  getProfile: async () => {
    return apiFetch('/profile/me', {
      method: 'GET',
    });
  },

  updateProfile: async (profileData) => {
    return apiFetch('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Real-Time Database Synchronization API Client
export const syncApi = {
  triggerSync: async () => {
    return apiFetch('/db/sync', {
      method: 'POST',
    });
  },
};

// Fiverr Seller Profiles API Client
export const fiverrProfilesApi = {
  fetchProfiles: async () => {
    return apiFetch('/fiverr-profiles', {
      method: 'GET',
    });
  },

  createProfile: async (profileData) => {
    return apiFetch('/fiverr-profiles', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  deleteProfile: async (id) => {
    return apiFetch(`/fiverr-profiles/${id}`, {
      method: 'DELETE',
    });
  },

  updateProfile: async (id, profileData) => {
    return apiFetch(`/fiverr-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};


// Agency Clients API Client
export const clientsApi = {
  fetchClients: async () => {
    return apiFetch('/clients', {
      method: 'GET',
    });
  },

  createClient: async (clientData) => {
    return apiFetch('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  updateClient: async (id, clientData) => {
    return apiFetch(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  },

  deleteClient: async (id) => {
    return apiFetch(`/clients/${id}`, {
      method: 'DELETE',
    });
  },
};

// Organization Users API Client
export const usersApi = {
  fetchUsers: async () => {
    return apiFetch('/users', {
      method: 'GET',
    });
  },

  createUser: async (userData) => {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id, userData) => {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id) => {
    return apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  bulkDeleteUsers: async (ids) => {
    return apiFetch('/users/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};

// Bonus Schemes API Client (Operations & Sales)
export const bonusSchemesApi = {
  fetchBonusSchemes: async () => {
    return apiFetch('/bonus-schemes', {
      method: 'GET',
    });
  },

  createGrade: async (gradeData) => {
    return apiFetch('/bonus-schemes/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
  },

  updateGrade: async (id, gradeData) => {
    return apiFetch(`/bonus-schemes/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  },

  deleteGrade: async (id) => {
    return apiFetch(`/bonus-schemes/grades/${id}`, {
      method: 'DELETE',
    });
  },

  clearBonusSchemes: async () => {
    return apiFetch('/bonus-schemes/clear', {
      method: 'DELETE',
    });
  },

  updateEmployeePayout: async (payload) => {
    return apiFetch('/bonus-schemes/payouts/update', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Projects API Client
export const projectsApi = {
  fetchProjects: async () => {
    return apiFetch('/projects', {
      method: 'GET',
    });
  },

  createProject: async (projectData) => {
    return apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  updateProject: async (id, projectData) => {
    return apiFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  deleteProject: async (id) => {
    return apiFetch(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  bulkDeleteProjects: async (ids) => {
    return apiFetch('/projects/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};

// Monthly Performance API Client (Sales & Operations)
export const performanceApi = {
  fetchSales: async (month = 'August', year = '2026') => {
    return apiFetch(`/performance/sales?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`, {
      method: 'GET',
    });
  },

  fetchOps: async (month = 'August', year = '2026') => {
    return apiFetch(`/performance/operations?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`, {
      method: 'GET',
    });
  },

  saveSales: async (payload) => {
    return apiFetch('/performance/sales/save', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  saveOps: async (payload) => {
    return apiFetch('/performance/operations/save', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateSalesMember: async (id, data) => {
    return apiFetch(`/performance/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateOpsMember: async (id, data) => {
    return apiFetch(`/performance/operations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// System Health & Whole-Database Connection Inspector API
export const systemHealthApi = {
  getHealth: async () => {
    return apiFetch('/db/sync/health', {
      method: 'GET',
    });
  },

  triggerFullSync: async () => {
    return apiFetch('/db/sync', {
      method: 'POST',
    });
  },
};

// Buyer Briefs & Incoming Leads API
export const briefsApi = {
  fetchBriefs: async () => apiFetch('/briefs', { method: 'GET' }),
  createBrief: async (data) => apiFetch('/briefs', { method: 'POST', body: JSON.stringify(data) }),
  updateBrief: async (id, data) => apiFetch(`/briefs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBrief: async (id) => apiFetch(`/briefs/${id}`, { method: 'DELETE' }),
};

// Post-Delivery Issues & Support Tickets API
export const issuesApi = {
  fetchIssues: async () => apiFetch('/issues', { method: 'GET' }),
  createIssue: async (data) => apiFetch('/issues', { method: 'POST', body: JSON.stringify(data) }),
  updateIssue: async (id, data) => apiFetch(`/issues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIssue: async (id) => apiFetch(`/issues/${id}`, { method: 'DELETE' }),
};

// Client Scheduled Meetings API
export const meetingsApi = {
  fetchMeetings: async () => apiFetch('/meetings', { method: 'GET' }),
  createMeeting: async (data) => apiFetch('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  updateMeeting: async (id, data) => apiFetch(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMeeting: async (id) => apiFetch(`/meetings/${id}`, { method: 'DELETE' }),
};

// Employee Payouts Ledger API
export const payoutsApi = {
  fetchPayouts: async () => apiFetch('/payouts', { method: 'GET' }),
  createPayout: async (data) => apiFetch('/payouts', { method: 'POST', body: JSON.stringify(data) }),
  updatePayout: async (id, data) => apiFetch(`/payouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePayout: async (id) => apiFetch(`/payouts/${id}`, { method: 'DELETE' }),
};

// AI Match & Auto-Dispatcher Rules API
export const aiRulesApi = {
  fetchRules: async () => apiFetch('/ai-rules', { method: 'GET' }),
  createRule: async (data) => apiFetch('/ai-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: async (id, data) => apiFetch(`/ai-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: async (id) => apiFetch(`/ai-rules/${id}`, { method: 'DELETE' }),
};

// System Activity Logs API
export const activityLogsApi = {
  fetchLogs: async () => apiFetch('/activity-logs', { method: 'GET' }),
  logEvent: async (data) => apiFetch('/activity-logs', { method: 'POST', body: JSON.stringify(data) }),
  clearLogs: async () => apiFetch('/activity-logs', { method: 'DELETE' }),
};

// Leaves & HR Management API
export const leavesApi = {
  fetchLeaves: async () => apiFetch('/leaves', { method: 'GET' }),
  applyLeave: async (data) => apiFetch('/leaves/apply', { method: 'POST', body: JSON.stringify(data) }),
  updateLeaveStatus: async (id, data) => apiFetch(`/leaves/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateQuotas: async (data) => apiFetch('/leaves/quotas', { method: 'PUT', body: JSON.stringify(data) }),
  deleteLeave: async (id) => apiFetch(`/leaves/${id}`, { method: 'DELETE' }),
};



