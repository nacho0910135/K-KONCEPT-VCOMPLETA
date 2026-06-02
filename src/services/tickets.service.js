import api from './api.js';

const unwrap = (response) => ({
  data: response.data?.data ?? response.data,
  pagination: response.data?.pagination
});

export const createTicket = async (payload) => unwrap(await api.post('/tickets', payload)).data;
export const getTickets = async (params) => unwrap(await api.get('/tickets', { params }));
export const getMyTickets = async (params) => unwrap(await api.get('/tickets/me', { params }));
export const getAssignedTickets = async (params) => unwrap(await api.get('/tickets/assigned', { params }));
export const getTicketAssignmentSettings = async () => unwrap(await api.get('/tickets/assignment-settings')).data;
export const updateTicketAssignmentSettings = async (payload) => unwrap(await api.patch('/tickets/assignment-settings', payload)).data;
export const getTicketById = async (id) => unwrap(await api.get(`/tickets/${id}`)).data;
export const getTicketHistory = async (id) => unwrap(await api.get(`/tickets/${id}/history`)).data;
export const updateTicket = async (id, payload) => unwrap(await api.patch(`/tickets/${id}`, payload)).data;
export const assignTicketTechnician = async (id, payload) => unwrap(await api.patch(`/tickets/${id}/assign`, payload)).data;
export const updateTicketPriority = async (id, payload) => unwrap(await api.patch(`/tickets/${id}/priority`, payload)).data;
export const deleteTicket = async (id) => unwrap(await api.delete(`/tickets/${id}`)).data;
export const addComment = async (ticketId, payload) => unwrap(await api.post(`/tickets/${ticketId}/comments`, {
  ...payload,
  comment: payload.comment ?? payload.body
})).data;
export const confirmTicketSolution = async (ticketId, payload) => unwrap(await api.post(`/tickets/${ticketId}/confirm-solution`, payload)).data;
export const rejectTicketSolution = async (ticketId, payload) => unwrap(await api.post(`/tickets/${ticketId}/reject-solution`, payload)).data;
export const requestTicketReschedule = async (ticketId, payload) => unwrap(await api.post(`/tickets/${ticketId}/reschedule-requests`, payload)).data;
export const updateTicketStatus = async (ticketId, payload) => unwrap(await api.patch(`/tickets/${ticketId}/status`, payload)).data;
export const saveTicketDiagnosis = async (ticketId, payload) => unwrap(await api.patch(`/tickets/${ticketId}/diagnosis`, payload)).data;
