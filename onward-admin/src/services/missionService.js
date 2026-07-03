import api from './api';

// Admin-managed player missions (shown on the player Missions page).
export const listMissions = () => api.get('/missions').then((r) => r.data);
export const saveMissions = (items) => api.put('/missions', { items }).then((r) => r.data);
