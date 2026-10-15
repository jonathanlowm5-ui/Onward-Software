import api from './api';

// Uploadable hero banners for content pages (Jackpots, Referral, VIP, …).
export const getPageBanners = () => api.get('/page-banners').then((r) => r.data);
export const savePageBanners = (data) => api.put('/page-banners', data).then((r) => r.data);

// Editable hero text (eyebrow / title / desc) per content page.
export const getPageHeroes = () => api.get('/page-banners/text').then((r) => r.data);
export const savePageHeroes = (data) => api.put('/page-banners/text', data).then((r) => r.data);

// Official social-media links shown in the footer "Follow Us" row.
export const getSocialLinks = () => api.get('/social-links').then((r) => r.data);
export const saveSocialLinks = (data) => api.put('/social-links', data).then((r) => r.data);
