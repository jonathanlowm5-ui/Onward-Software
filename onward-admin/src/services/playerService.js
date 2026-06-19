import api, { resource } from './api';

// Players — shared with the frontend's player records (Firebase-synced).
const players = resource('players');

export const listPlayers = (params) => players.list(params);
export const getPlayer = (id) => players.get(id);
export const updatePlayer = (id, data) => players.update(id, data);
export const blockPlayer = (id, blocked = true) =>
  api.patch(`/players/${id}/block`, { blocked }).then((r) => r.data);
export const onlinePlayers = () => api.get('/players', { params: { online: 1 } }).then((r) => r.data);
export const listVIP = () => api.get('/players', { params: { vip: 1 } }).then((r) => r.data);
