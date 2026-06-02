import api from './api.js';

const unwrap = (response) => ({
  data: response.data?.data ?? response.data,
  pagination: response.data?.pagination
});

export const getUsers = async (params) => unwrap(await api.get('/users', { params }));
export const getUserById = async (id) => unwrap(await api.get(`/users/${id}`)).data;
export const createUser = async (payload) => unwrap(await api.post('/users', payload)).data;
export const updateUser = async (id, payload) => unwrap(await api.put(`/users/${id}`, payload)).data;
export const updateUserRole = async (id, role) => unwrap(await api.patch(`/users/${id}/role`, { role, confirm: true })).data;
export const deactivateUser = async (id) => unwrap(await api.patch(`/users/${id}/deactivate`)).data;
export const activateUser = async (id) => unwrap(await api.patch(`/users/${id}/activate`)).data;
