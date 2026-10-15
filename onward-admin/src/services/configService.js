import api from './api';

// Whitelisted UI-config keys stored in backend settings (see routes/settings.js).
export const getConfig = () => api.get('/settings/config').then((r) => r.data);
export const saveConfig = (patch) => api.put('/settings/config', patch).then((r) => r.data);

// Server-side reachability check for integration URLs.
export const pingUrl = (url) => api.post('/settings/ping-url', { url }).then((r) => r.data);

// Reports (computed from real transactions / bets / players / logins).
export const getAnalytics = (days = 30) => api.get('/reports/analytics', { params: { days } }).then((r) => r.data);
export const getWinloss = (by = 'provider', days = 30) => api.get('/reports/winloss', { params: { by, days } }).then((r) => r.data);
export const getWebstat = (days = 30) => api.get('/reports/webstat', { params: { days } }).then((r) => r.data);
export const getRetention = (weeks = 8) => api.get('/reports/retention', { params: { weeks } }).then((r) => r.data);
export const getDayRetention = (days = 14) => api.get('/reports/day-retention', { params: { days } }).then((r) => r.data);
export const getOtpLog = (channel) => api.get('/reports/otp', { params: channel ? { channel } : {} }).then((r) => r.data);
export const getReferralTree = () => api.get('/reports/referral-tree').then((r) => r.data);
export const getAuditLog = (admin) => api.get('/reports/audit', { params: admin ? { admin } : {} }).then((r) => r.data);
export const getLiveBets = () => api.get('/bets').then((r) => r.data);
