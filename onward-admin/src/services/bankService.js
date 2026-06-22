import api from './api';

// Bank / payment channels — managed on the Bank page, used by Manual Deposit.
export const listBankChannels = () => api.get('/bank-channels').then((r) => r.data);
export const createBankChannel = (data) => api.post('/bank-channels', data).then((r) => r.data);
export const toggleBankChannel = (id) => api.patch(`/bank-channels/${id}/toggle`).then((r) => r.data);
export const removeBankChannel = (id) => api.delete(`/bank-channels/${id}`).then((r) => r.data);
