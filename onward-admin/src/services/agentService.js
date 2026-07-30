import api from './api';

// Agent module — applications workflow, approved agents, plans, commissions.
const g = (url, params) => api.get(url, { params }).then((r) => r.data);

// Dashboard
export const agentDashboard = () => g('/agents/dashboard');

// Applications (workflow)
export const listApplications = (params) => g('/agents/applications', params);
export const getApplication = (id) => g(`/agents/applications/${id}`);
export const updateApplication = (id, patch) => api.patch(`/agents/applications/${id}`, patch).then((r) => r.data);
export const bulkApplications = (ids, patch) => api.post('/agents/applications/bulk', { ids, ...patch }).then((r) => r.data);

// Approved agents
export const listAgents = (params) => g('/agents/list', params);
export const updateAgent = (id, patch) => api.patch(`/agents/agent/${id}`, patch).then((r) => r.data);
export const agentPlayers = (id, params) => g(`/agents/agent/${id}/players`, params);

// Plans & managers
export const listPlans = () => g('/agents/plans');
export const savePlans = (plans) => api.put('/agents/plans', { plans }).then((r) => r.data);
export const listManagers = () => g('/agents/managers');
export const saveManagers = (managers) => api.put('/agents/managers', { managers }).then((r) => r.data);

// Commissions
export const listCommissions = (params) => g('/agents/commissions', params);
export const generateCommissions = (period) => api.post('/agents/commissions/generate', { period }).then((r) => r.data);
export const adjustCommission = (agentId, amount, detail) => api.post('/agents/commissions/adjust', { agentId, amount, detail }).then((r) => r.data);
export const payCommission = (id) => api.patch(`/agents/commissions/${id}/pay`).then((r) => r.data);

// Shared CSV download helper for the agent pages.
export function downloadCsv(filename, head, rows) {
  const csv = [head, ...rows].map((r) => r.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
