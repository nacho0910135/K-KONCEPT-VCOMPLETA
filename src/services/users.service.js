import api from './api.js';

export const getUsers = async (params) => (await api.get('/users', { params })).data;
export const getUserById = async (id) => (await api.get(`/users/${id}`)).data;
export const updateUser = async (id, payload) => (await api.patch(`/users/${id}`, payload)).data;
