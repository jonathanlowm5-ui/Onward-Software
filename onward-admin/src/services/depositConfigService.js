import api from './api';

// Quick-select deposit amounts shown on the player deposit panel.
export const getDepositConfig = () => api.get('/deposit-config').then((r) => r.data);
export const saveDepositConfig = (data) => api.put('/deposit-config', data).then((r) => r.data);
