import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const uploadTicketEvidence = async (ticketId, files) => {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => {
    formData.append('files', file);
  });

  return unwrap(await api.post(`/tickets/${ticketId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }));
};

export const listTicketEvidence = async (ticketId) => unwrap(await api.get(`/tickets/${ticketId}/evidence`));
