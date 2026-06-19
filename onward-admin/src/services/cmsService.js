import api from './api';

// CMS / site settings — announcements, floating images, page links, site config.
// The frontend reads the same settings endpoint.
export const getSettings = () => api.get('/settings').then((r) => r.data);
export const updateSettings = (data) => api.put('/settings', data).then((r) => r.data);
export const listAnnouncements = (params) => api.get('/settings/announcements', { params }).then((r) => r.data);
export const saveAnnouncement = (data) => api.post('/settings/announcements', data).then((r) => r.data);
export const removeAnnouncement = (id) => api.delete(`/settings/announcements/${id}`).then((r) => r.data);
