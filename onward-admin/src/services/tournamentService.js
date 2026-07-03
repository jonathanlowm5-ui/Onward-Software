import api from './api';

// Admin-managed tournaments (shown on the player promotions page).
export const listTournaments = () => api.get('/tournaments').then((r) => r.data);
export const saveTournaments = (items) => api.put('/tournaments', { items }).then((r) => r.data);
