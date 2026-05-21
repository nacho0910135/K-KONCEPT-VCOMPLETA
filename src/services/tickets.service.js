import api from './api.js';

export const createTicket = async (payload) => (await api.post('/tickets', payload)).data;
export const getTickets = async (params) => (await api.get('/tickets', { params })).data;
export const getTicketById = async (id) => (await api.get(`/tickets/${id}`)).data;
export const updateTicket = async (id, payload) => (await api.patch(`/tickets/${id}`, payload)).data;
export const addComment = async (ticketId, payload) => (await api.post(`/tickets/${ticketId}/comments`, payload)).data;
export const confirmTicketSolution = async (ticketId, payload) => (await api.post(`/tickets/${ticketId}/confirm-solution`, payload)).data;
export const rejectTicketSolution = async (ticketId, payload) => (await api.post(`/tickets/${ticketId}/reject-solution`, payload)).data;
export const requestTicketReschedule = async (ticketId, payload) => (await api.post(`/tickets/${ticketId}/reschedule-requests`, payload)).data;
export const updateTicketStatus = async (ticketId, payload) => (await api.patch(`/tickets/${ticketId}/status`, payload)).data;
export const saveTicketDiagnosis = async (ticketId, payload) => (await api.patch(`/tickets/${ticketId}/diagnosis`, payload)).data;
