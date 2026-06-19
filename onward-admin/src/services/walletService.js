import api from './api';

// Wallet — credit/adjust balances and read transactions. Crediting here updates
// the player's balance the frontend reads from /player/wallet.
export const getWallet = (playerId) => api.get(`/players/${playerId}/wallet`).then((r) => r.data);
export const credit = (playerId, amount, note) =>
  api.post(`/players/${playerId}/wallet/credit`, { amount, note }).then((r) => r.data);
export const debit = (playerId, amount, note) =>
  api.post(`/players/${playerId}/wallet/debit`, { amount, note }).then((r) => r.data);
export const listTransactions = (params) => api.get('/transactions', { params }).then((r) => r.data);
export const listDeposits = (params) => api.get('/transactions', { params: { type: 'deposit', ...params } }).then((r) => r.data);
export const listWithdrawals = (params) => api.get('/transactions', { params: { type: 'withdrawal', ...params } }).then((r) => r.data);
export const approveTransaction = (id) => api.patch(`/transactions/${id}/approve`).then((r) => r.data);
export const rejectTransaction = (id) => api.patch(`/transactions/${id}/reject`).then((r) => r.data);
