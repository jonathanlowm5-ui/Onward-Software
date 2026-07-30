import api from './api';

// Admin-generated promo codes / vouchers (players redeem via "Use Code").
export const listVouchers = () => api.get('/vouchers').then((r) => r.data);
export const saveVouchers = (items) => api.put('/vouchers', { items }).then((r) => r.data);
