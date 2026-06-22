import api from './api';

// Fortune Wheel + Lucky Ticket config — edited on Promotions → Mini Games,
// read by the player site's Mini Games modal.
export const getMiniGames = () => api.get('/mini-games').then((r) => r.data);
export const saveMiniGames = (config) => api.put('/mini-games', config).then((r) => r.data);
