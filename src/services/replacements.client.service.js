import api from './api.js';

export const requestReplacement = async (payload) => (await api.post('/replacements', payload)).data;
export const validateReplacement = async (id, payload) => (await api.patch(`/replacements/${id}/validate`, payload)).data;
export const registerReplacementProduct = async (id, payload) => (await api.patch(`/replacements/${id}/product`, payload)).data;
export const registerReplacementDelivery = async (id, payload) => (await api.post(`/replacements/${id}/delivery`, payload)).data;
