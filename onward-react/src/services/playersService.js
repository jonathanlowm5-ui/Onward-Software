import api from './api';

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

export const submitKYC = (formData) =>
  api
    .post('/player/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);

export const registerPlayer = (payload) =>
  api.post('/players/register', payload).then((r) => r.data);
