import api from './api';

// KYC review. Approving/rejecting updates the player's kyc_status, which the
// frontend profile reflects immediately.
export const listKYC = (params) => api.get('/kyc', { params }).then((r) => r.data);
export const getKYC = (id) => api.get(`/kyc/${id}`).then((r) => r.data);
export const approveKYC = (id, note) => api.patch(`/kyc/${id}/approve`, { note }).then((r) => r.data);
export const rejectKYC = (id, reason) => api.patch(`/kyc/${id}/reject`, { reason }).then((r) => r.data);
