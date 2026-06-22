import api, { resource } from './api';

// Games & providers — disabling a game here removes it from the frontend grids.
const games = resource('games');
export const listGames = (params) => games.list(params);
export const createGame = (data) => games.create(data);
export const updateGame = (id, data) => games.update(id, data);
export const removeGame = (id) => games.remove(id);
export const toggleGame = (id) => games.toggle(id);
export const listProviders = () => api.get('/games/providers').then((r) => r.data);
