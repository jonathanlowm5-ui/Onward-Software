import api, { resource } from './api';

// Notifications — created here and delivered to players on the frontend.
const notifications = resource('notifications');
export const listNotifications = (params) => notifications.list(params);
export const createNotification = (data) => notifications.create(data);
export const removeNotification = (id) => notifications.remove(id);
export const sendNotification = (id) => api.post(`/notifications/${id}/send`).then((r) => r.data);
