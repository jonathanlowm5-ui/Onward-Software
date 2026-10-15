import api, { resource } from './api';

// Promotions — shared with the frontend promotions section.
const promos = resource('promotions');
export const listPromotions = (params) => promos.list(params);
export const createPromotion = (data) => promos.create(data);
export const updatePromotion = (id, data) => promos.update(id, data);
export const removePromotion = (id) => promos.remove(id);
export const togglePromotion = (id) => promos.toggle(id);
// Set the display order (banner sequence). order = array of promo ids.
export const reorderPromotions = (order) => api.post('/promotions/reorder', { order }).then((r) => r.data);

