import api from './api.js';

export const createTicket = async (payload) => (await api.post('/tickets', payload)).data;
export const getTickets = async (params) => (await api.get('/tickets', { params })).data;
export const getTicketById = async (id) => (await api.get(`/tickets/${id}`)).data;
export const updateTicket = async (id, payload) => (await api.patch(`/tickets/${id}`, payload)).data;
export const addComment = async (ticketId, payload) => (await api.post(`/tickets/${ticketId}/comments`, payload)).data;
