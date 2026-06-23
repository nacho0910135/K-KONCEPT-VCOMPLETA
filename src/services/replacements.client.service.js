import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const listReplacements = async () => unwrap(await api.get('/replacements'));
export const exportReplacementsPdf = async () => {
  const response = await api.get('/replacements/export/pdf', { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reemplazos.pdf';
  link.click();
  URL.revokeObjectURL(url);
};
export const requestReplacement = async (ticketId, payload) => unwrap(await api.post(`/tickets/${ticketId}/replacements`, payload));
export const validateReplacement = async (id, payload) => (await api.patch(`/replacements/${id}/validate`, payload)).data;
export const registerReplacementProduct = async (id, payload) => (await api.patch(`/replacements/${id}/product`, payload)).data;
export const registerReplacementDelivery = async (id, payload) => (await api.post(`/replacements/${id}/delivery`, payload)).data;
