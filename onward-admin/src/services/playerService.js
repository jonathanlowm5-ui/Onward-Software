import api, { resource } from './api';

// Players — shared with the frontend's player records (Firebase-synced).
const players = resource('players');

export const listPlayers = (params) => players.list(params);
export const getPlayer = (id) => players.get(id);
export const updatePlayer = (id, data) => players.update(id, data);
export const blockPlayer = (id, blocked = true) =>
  api.patch(`/players/${id}/block`, { blocked }).then((r) => r.data);
export const deletePlayer = (id) => api.delete(`/players/${id}`).then((r) => r.data);
export const kickPlayer = (id) => api.post(`/players/${id}/kick`).then((r) => r.data);
export const resetPlayerPassword = (id, newPassword) =>
  api.post(`/players/${id}/reset-password`, { newPassword }).then((r) => r.data);
export const onlinePlayers = () => api.get('/players', { params: { online: 1 } }).then((r) => r.data);
export const listVIP = () => api.get('/players', { params: { vip: 1 } }).then((r) => r.data);

// Country / geo-IP restrictions.
export const getGeoBlock = () => api.get('/players/geo-block/config').then((r) => r.data);
export const saveGeoBlock = (enabled, countries) =>
  api.put('/players/geo-block/config', { enabled, countries }).then((r) => r.data);
