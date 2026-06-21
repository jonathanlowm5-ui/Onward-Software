import api, { setToken, getToken } from './api';

// Admin authentication (JWT). The backend issues a token used as the bearer
// on every subsequent request.
export async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  if (data?.token) setToken(data.token);
  return data;
}

export const me = () => api.get('/auth/me').then((r) => r.data);

export const changeAdminPassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data);

export function logout() {
  setToken('');
}

export const isAuthenticated = () => !!getToken();
