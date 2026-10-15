import api, { setToken } from './api';

/**
 * Player / wallet / KYC service — the customer-facing slice of the shared API.
 * The admin panel reuses the same Axios instance (see services/api.js).
 */

export const getMe = () => api.get('/player/me').then((r) => r.data);

export const getWallet = () => api.get('/player/wallet').then((r) => r.data);

export const deposit = (payload) => api.post('/player/deposit', payload).then((r) => r.data);

export const withdraw = (payload) => api.post('/player/withdraw', payload).then((r) => r.data);

export const getTransactions = (params = {}) =>
  api.get('/player/transactions', { params }).then((r) => r.data);

export const getGameHistory = (params = {}) =>
  api.get('/player/game-history', { params }).then((r) => r.data);

export const saveBankAccount = (payload) =>
  api.post('/player/bank-accounts', payload).then((r) => r.data);

export const getBankAccounts = () =>
  api.get('/player/bank-accounts').then((r) => r.data);

export const getLoginHistory = () =>
  api.get('/player/login-history').then((r) => r.data);

// ---- security ----
export const changePassword = (currentPassword, newPassword) =>
  api.post('/player/me/change-password', { currentPassword, newPassword }).then((r) => {
    // The server rotates the session token on a password change (older tokens
    // are invalidated); swap it in so the current session keeps working.
    if (r.data?.token) setToken(r.data.token);
    return r.data;
  });

export const setTwoFactor = (enabled) =>
  api.post('/player/me/2fa', { enabled }).then((r) => r.data);

// ---- email / mobile verification (mock code flow) ----
export const requestEmailCode = () =>
  api.post('/player/me/verify/email/request').then((r) => r.data);
export const confirmEmailCode = (code) =>
  api.post('/player/me/verify/email/confirm', { code }).then((r) => r.data);
export const requestMobileCode = () =>
  api.post('/player/me/verify/mobile/request').then((r) => r.data);
export const confirmMobileCode = (code) =>
  api.post('/player/me/verify/mobile/confirm', { code }).then((r) => r.data);

export const submitKYC = (payload) =>
  api.post('/player/kyc', payload).then((r) => r.data);

// Upload an image to Firebase Storage (KYC docs / avatar) -> { url }.
export const uploadFile = (file, kind = 'kyc') => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

export const registerPlayer = (payload) =>
  api.post('/players/register', payload).then((r) => r.data);
