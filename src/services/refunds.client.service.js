import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const listRefunds = async () => unwrap(await api.get('/refunds'));

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportRefunds = async (format) => {
  const response = await api.get(`/refunds/export/${format}`, { responseType: 'blob' });
  downloadBlob(response.data, `reembolsos.${format}`);
};

export const downloadRefundCertificate = async (id) => {
  const response = await api.get(`/refunds/${id}/certificate/download`, { responseType: 'blob' });
  downloadBlob(response.data, 'constancia-reembolso.pdf');
};
