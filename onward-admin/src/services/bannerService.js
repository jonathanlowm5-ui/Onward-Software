import { resource } from './api';

// Banners — toggling/reordering here changes the carousel on the frontend.
const banners = resource('banners');
export const listBanners = (params) => banners.list(params);
export const createBanner = (data) => banners.create(data);
export const updateBanner = (id, data) => banners.update(id, data);
export const removeBanner = (id) => banners.remove(id);
export const toggleBanner = (id) => banners.toggle(id);
