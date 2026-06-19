import axios from 'axios';

/**
 * Shared API service layer.
 *
 * This is the single Axios instance used by BOTH the customer frontend and the
 * admin panel, so all calls go through the same base URL, auth-token handling
 * and error normalisation. It talks to the existing onward-integration backend
 * (Node + Express) which exposes /api/games, /api/banners, /api/promotions,
 * /api/players, /api/auth, /api/aggregator, etc.
 */

export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

const TOKEN_KEY = 'onward_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
});

// Attach the auth token (admin JWT or Firebase ID token) to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise errors so callers get a predictable `.message`.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;
    const message =
      data?.error || data?.message || error.message || 'Request failed';
    if (error.response?.status === 401) {
      // Token rejected — drop it so the UI can prompt a re-login.
      setToken('');
    }
    return Promise.reject(Object.assign(error, { message }));
  }
);

export default api;
