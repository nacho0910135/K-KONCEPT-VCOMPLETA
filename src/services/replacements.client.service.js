import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const listReplacements = async () => unwrap(await api.get('/replacements'));
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportReplacements = async (format) => {
  const response = await api.get(`/replacements/export/${format}`, { responseType: 'blob' });
  downloadBlob(response.data, `reemplazos.${format}`);
};
export const requestReplacement = async (ticketId, payload) => unwrap(await api.post(`/tickets/${ticketId}/replacements`, payload));
export const validateReplacement = async (id, payload) => unwrap(await api.patch(`/replacements/${id}/validate`, payload));
export const registerReplacementProduct = async (id, payload) => unwrap(await api.put(`/replacements/${id}/new-product`, payload));
export const registerReplacementDelivery = async (id, payload) => unwrap(await api.post(`/replacements/${id}/delivery`, payload));
export const downloadReplacementCertificate = async (id) => {
  const response = await api.get(`/replacements/${id}/certificate/download`, { responseType: 'blob' });
  downloadBlob(response.data, 'constancia-reemplazo.pdf');
};
