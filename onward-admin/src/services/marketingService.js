import api from './api';

// Marketing campaign engine (SMS / Email / Push / Ads share it).
export const getProviders = () => api.get('/marketing/providers').then((r) => r.data);
export const saveProviders = (providers) => api.put('/marketing/providers', { providers }).then((r) => r.data);
export const testProvider = (channel, id, to) => api.post('/marketing/providers/test', { channel, id, to }).then((r) => r.data);

export const previewAudience = (filters) => api.post('/marketing/audience/preview', { filters }).then((r) => r.data);
export const listAudiences = () => api.get('/marketing/audiences').then((r) => r.data);
export const saveAudiences = (items) => api.put('/marketing/audiences', { items }).then((r) => r.data);

export const listCampaigns = (channel) => api.get('/marketing/campaigns', { params: { channel } }).then((r) => r.data);
export const createCampaign = (data) => api.post('/marketing/campaigns', data).then((r) => r.data);
export const sendCampaign = (id) => api.post(`/marketing/campaigns/${id}/send`).then((r) => r.data);
export const deleteCampaign = (id) => api.delete(`/marketing/campaigns/${id}`).then((r) => r.data);

export const getAutomations = () => api.get('/marketing/automations').then((r) => r.data);
export const saveAutomations = (items) => api.put('/marketing/automations', { items }).then((r) => r.data);

export const getSummary = () => api.get('/marketing/summary').then((r) => r.data);
export const tick = () => api.get('/marketing/tick').then((r) => r.data);

export const listAdsConnectors = () => api.get('/marketing/ads/connectors').then((r) => r.data);
export const saveAdsConnectors = (items) => api.put('/marketing/ads/connectors', { items }).then((r) => r.data);
export const listAdsCampaigns = () => api.get('/marketing/ads/campaigns').then((r) => r.data);
export const createAdsCampaign = (data) => api.post('/marketing/ads/campaigns', data).then((r) => r.data);
export const updateAdsCampaign = (id, data) => api.patch(`/marketing/ads/campaigns/${id}`, data).then((r) => r.data);
export const deleteAdsCampaign = (id) => api.delete(`/marketing/ads/campaigns/${id}`).then((r) => r.data);
