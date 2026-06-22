import api, { resource } from './api';

// Agent system — admin manages applications and agents created from the frontend.
const agents = resource('agents');

export const listAgents = (params) => agents.list(params);
export const listPending = () => api.get('/agents', { params: { status: 'pending' } }).then((r) => r.data);
export const approveAgent = (id) => api.patch(`/agents/${id}/approve`).then((r) => r.data);
export const rejectAgent = (id, reason) => api.patch(`/agents/${id}/reject`, { reason }).then((r) => r.data);
