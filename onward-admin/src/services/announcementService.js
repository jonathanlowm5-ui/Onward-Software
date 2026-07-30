import api from './api';

// Site-wide emergency announcement ticker shown at the top of the player site.
export const getAnnouncement = () => api.get('/announcement').then((r) => r.data);
export const saveAnnouncement = (data) => api.put('/announcement', data).then((r) => r.data);
