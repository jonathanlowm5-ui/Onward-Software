import { resource } from './api';

// Promotions — shared with the frontend promotions section.
const promos = resource('promotions');
export const listPromotions = (params) => promos.list(params);
export const createPromotion = (data) => promos.create(data);
export const updatePromotion = (id, data) => promos.update(id, data);
export const removePromotion = (id) => promos.remove(id);
export const togglePromotion = (id) => promos.toggle(id);
