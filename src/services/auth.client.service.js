import api, { getStoredRefreshToken } from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const loginRequest = async (credentials) => unwrap(await api.post('/auth/login', credentials));
export const refreshRequest = async () => unwrap(await api.post('/auth/refresh', { refreshToken: getStoredRefreshToken() }));
export const logoutRequest = async () => unwrap(await api.post('/auth/logout', { refreshToken: getStoredRefreshToken() }));
export const getCurrentUser = async () => unwrap(await api.get('/auth/me'));
export const registerClient = async (payload) => unwrap(await api.post('/auth/register', payload));
