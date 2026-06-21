import api from './api';

/**
 * VIP tier configuration. Shared with the player site via the backend
 * (settings.vipTiers) so admin edits — names, icon pictures, cashback, rebate
 * and level bonuses — are immediately reflected on the customer VIP page.
 */
export const getTiers = () => api.get('/vip/tiers').then((r) => r.data);
export const saveTiers = (tiers) => api.put('/vip/tiers', tiers).then((r) => r.data);
