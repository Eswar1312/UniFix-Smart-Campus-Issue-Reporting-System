// UNIFIX – api.js  (complete, all endpoints)
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({ baseURL: BASE_URL });

// Auto-attach JWT
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('unifix_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Global 401 handler
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('unifix_token');
      localStorage.removeItem('unifix_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Token helpers ──────────────────────────────────────────────
export const getToken = () => localStorage.getItem('unifix_token');
export const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('unifix_user')); } catch { return null; }
};
export const setAuth = (token, user) => {
  localStorage.setItem('unifix_token', token);
  localStorage.setItem('unifix_user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('unifix_token');
  localStorage.removeItem('unifix_user');
};

// ── AUTH ──────────────────────────────────────────────────────
export const apiRegister       = (data)        => api.post('/auth/register',         data);
export const apiLogin          = (data)        => api.post('/auth/login',             data);
export const apiMe             = ()            => api.get('/auth/me');
export const apiChangePassword = (data)        => api.post('/auth/change-password',   data);

// ── ISSUES ────────────────────────────────────────────────────
export const apiSubmitIssue        = (data)     => api.post('/issues/submit',       data);
export const apiSubmitIssueWithFile = (formData) =>
  api.post('/issues/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const apiMyIssues           = (params)   => api.get('/issues/my',            { params });
export const apiPublicIssues       = (params)   => api.get('/issues/public',        { params });
export const apiGetIssue           = (id)       => api.get(`/issues/${id}`);
export const apiUpdateIssue        = (id, data) => api.put(`/issues/update/${id}`,  data);
export const apiUploadImage        = (id, formData) =>
  api.post(`/issues/${id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ── META (dropdowns) ──────────────────────────────────────────
export const apiMeta = () => api.get('/meta');

// ── LOST & FOUND ──────────────────────────────────────────────
export const apiLostFound       = (params)   => api.get('/lostfound',             { params });
export const apiGetLostFoundItem = (id)      => api.get(`/lostfound/${id}`);
export const apiPostLostFound   = (formData) =>
  api.post('/lostfound/post', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const apiResolveLostFound = (id)      => api.put(`/lostfound/${id}/resolve`);
export const apiDeleteLostFound  = (id)      => api.delete(`/lostfound/${id}`);

// ── ADMIN ─────────────────────────────────────────────────────
export const apiAllIssues        = (params) => api.get('/admin/issues',                 { params });
export const apiDeleteIssue      = (id)     => api.delete(`/admin/delete-issue/${id}`);
export const apiAllUsers         = (params) => api.get('/admin/users',                  { params });
export const apiApproveUser      = (id)     => api.put(`/admin/users/approve/${id}`);
export const apiDeleteUser       = (id)     => api.delete(`/admin/users/${id}`);
export const apiAssignDept       = (id, data) => api.put(`/admin/users/${id}/assign-dept`, data);
export const apiAddDept          = (data)   => api.post('/admin/add-department',         data);
export const apiUpdateDept       = (id, data) => api.put(`/admin/update-department/${id}`, data);
export const apiDeleteDept       = (id)     => api.delete(`/admin/delete-department/${id}`);
export const apiListDepts        = ()       => api.get('/admin/departments');
export const apiAddCategory      = (data)   => api.post('/admin/add-category',           data);
export const apiDeleteCategory   = (id)     => api.delete(`/admin/delete-category/${id}`);
export const apiAnalytics        = ()       => api.get('/admin/analytics');

// ── DEPT ADMIN ────────────────────────────────────────────────
export const apiDeptIssues = (params) => api.get('/dept/issues', { params });
export const apiDeptStats  = ()       => api.get('/dept/stats');

export default api;
