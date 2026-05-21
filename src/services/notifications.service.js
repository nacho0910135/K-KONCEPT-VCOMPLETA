import api from './api.js';

export const getUnreadNotificationCount = async () => (await api.get('/notifications/me/unread-count')).data;
export const getLatestNotifications = async (params) => (await api.get('/notifications/me', { params })).data;
export const markNotificationAsRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data;
