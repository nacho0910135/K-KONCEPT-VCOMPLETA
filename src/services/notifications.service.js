import api from './api.js';

export const getUnreadNotificationCount = async () => (await api.get('/notifications/me/unread-count')).data;
export const getLatestNotifications = async (params) => (await api.get('/notifications/me', { params })).data;
export const getTicketEmails = async (ticketId) => (await api.get(`/notifications/tickets/${ticketId}/emails`)).data?.data?.emails || [];
export const markNotificationAsRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data;
export const markAllNotificationsAsRead = async () => (await api.patch('/notifications/me/read-all')).data;
export const clearNotifications = async () => (await api.delete('/notifications/me')).data;
