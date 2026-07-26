const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

async function apiCall(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'API error');
  return json;
}

export const signupUser = (data) => apiCall('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) });
export const verifyOTP = (data) => apiCall('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) });
export const loginUser = (identifier, password) =>
  apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
export const verifyToken = (token) =>
  apiCall('/api/auth/verify', { method: 'POST', body: JSON.stringify({ token }) });
export const requestReset = (data) => apiCall('/api/auth/request-reset', { method: 'POST', body: JSON.stringify(data) });
export const resetPassword = (data) => apiCall('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
export const fetchStudent = (token) =>
  apiCall('/api/student/profile', { headers: { Authorization: `Bearer ${token}` } });
export const fetchSubjects = (token, dept, year, sem) =>
  apiCall(`/api/subjects?department=${dept}&year=${year}&semester=${sem}`, { headers: { Authorization: `Bearer ${token}` } });
export const submitFeedback = (token, payload) =>
  apiCall('/api/feedback', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
export const checkFeedbackSubmitted = (token) =>
  apiCall('/api/feedback/check', { headers: { Authorization: `Bearer ${token}` } });