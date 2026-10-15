import axios from 'axios';

/**
 * Shared API layer for the Admin panel.
 *
 * IMPORTANT: this points at the SAME backend (`/api`) as the customer frontend
 * (onward-react). The two apps share one database, so anything changed here —
 * banners, promotions, games, KYC, wallet, notifications — is immediately
 * visible to players on the frontend.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

const TOKEN_KEY = 'onward_admin_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* */ }
};

const api = axios.create({ baseURL: API_BASE, headers: { Accept: 'application/json' } });

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const data = error.response?.data;
    const message = data?.error || data?.message || error.message || 'Request failed';
    // Session expired/invalid: clear the token and return to the login screen.
    // (Previously the token was cleared silently, leaving the UI "logged in"
    // while every later request failed with "Missing authorization token".)
    const url = String(error.config?.url || '');
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      setToken('');
      if (!window.__onwardSessionExpired) {
        window.__onwardSessionExpired = true;
        alert('Your admin session has expired — please sign in again.');
        window.location.reload(); // authed = hasToken() → lands on the login screen
      }
    }
    return Promise.reject(Object.assign(error, { message }));
  }
);

/** Build a standard REST resource client (list/get/create/update/remove/toggle). */
export function resource(name) {
  const base = `/${name}`;
  return {
    list: (params) => api.get(base, { params }).then((r) => r.data),
    get: (id) => api.get(`${base}/${id}`).then((r) => r.data),
    create: (d) => api.post(base, d).then((r) => r.data),
    update: (id, d) => api.put(`${base}/${id}`, d).then((r) => r.data),
    remove: (id) => api.delete(`${base}/${id}`).then((r) => r.data),
    toggle: (id) => api.patch(`${base}/${id}/toggle`).then((r) => r.data),
  };
}

export default api;
