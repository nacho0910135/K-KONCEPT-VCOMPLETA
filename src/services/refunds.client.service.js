import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const listRefunds = async () => unwrap(await api.get('/refunds'));

export const exportRefunds = async (format) => {
  const response = await api.get(`/refunds/export/${format}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reembolsos.${format}`;
  link.click();
  URL.revokeObjectURL(url);
};
