import api from './api.js';

export const getKpis = async (params) => (await api.get('/reports/kpis', { params })).data;
export const getReports = async (params) => (await api.get('/reports', { params })).data;
