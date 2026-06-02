import api from './api.js';

const unwrap = (response) => ({
  data: response.data?.data ?? response.data,
  pagination: response.data?.pagination
});

export const listAuditLogs = async (params) => unwrap(await api.get('/audit-logs', { params }));

export const listNotificationChannels = async () => unwrap(await api.get('/notification-channels')).data;
export const updateNotificationChannel = async (channel, payload) => unwrap(await api.patch(`/notification-channels/${channel}`, payload)).data;

export const listNotificationTemplates = async (params) => unwrap(await api.get('/notification-templates', { params })).data;
export const updateNotificationTemplate = async (id, payload) => unwrap(await api.put(`/notification-templates/${id}`, payload)).data;
export const toggleNotificationTemplate = async (id) => unwrap(await api.patch(`/notification-templates/${id}/toggle`)).data;

export const listNotificationFrequencyRules = async () => unwrap(await api.get('/notification-frequency-rules')).data;
export const createNotificationFrequencyRule = async (payload) => unwrap(await api.post('/notification-frequency-rules', payload)).data;
export const updateNotificationFrequencyRule = async (id, payload) => unwrap(await api.put(`/notification-frequency-rules/${id}`, payload)).data;
export const toggleNotificationFrequencyRule = async (id) => unwrap(await api.patch(`/notification-frequency-rules/${id}/toggle`)).data;

export const listSlas = async (params) => unwrap(await api.get('/slas', { params }));
export const updateSla = async (id, payload) => unwrap(await api.put(`/slas/${id}`, payload)).data;
export const createSla = async (payload) => unwrap(await api.post('/slas', payload)).data;
export const deleteSla = async (id) => unwrap(await api.delete(`/slas/${id}`)).data;

export const getKpiOverview = async (params) => unwrap(await api.get('/reports/kpi/overview', { params })).data;
export const getTicketsByStatus = async (params) => unwrap(await api.get('/reports/kpi/tickets-by-status', { params })).data;
export const getTicketsByPriority = async (params) => unwrap(await api.get('/reports/kpi/tickets-by-priority', { params })).data;
export const getTicketsByCategory = async (params) => unwrap(await api.get('/reports/kpi/tickets-by-category', { params })).data;
export const getMonthlyVolume = async (params) => unwrap(await api.get('/reports/kpi/monthly-volume', { params })).data;

export const listScheduledReports = async (params) => unwrap(await api.get('/scheduled-reports', { params }));
export const createScheduledReport = async (payload) => unwrap(await api.post('/scheduled-reports', payload)).data;
export const updateScheduledReport = async (id, payload) => unwrap(await api.put(`/scheduled-reports/${id}`, payload)).data;
export const toggleScheduledReport = async (id) => unwrap(await api.patch(`/scheduled-reports/${id}/toggle`)).data;
export const deleteScheduledReport = async (id) => unwrap(await api.delete(`/scheduled-reports/${id}`)).data;
