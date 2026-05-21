import api from './api.js';

export const loginRequest = async (credentials) => (await api.post('/auth/login', credentials)).data;
export const logoutRequest = async () => (await api.post('/auth/logout')).data;
export const getCurrentUser = async () => (await api.get('/auth/me')).data;
export const registerClient = async (payload) => (await api.post('/auth/register', payload)).data;
