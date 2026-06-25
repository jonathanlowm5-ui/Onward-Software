import api from './api';

// Uploadable hero banners for content pages (Jackpots, Referral, VIP, …).
export const getPageBanners = () => api.get('/page-banners').then((r) => r.data);
export const savePageBanners = (data) => api.put('/page-banners', data).then((r) => r.data);
