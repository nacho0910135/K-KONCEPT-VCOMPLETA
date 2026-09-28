import api, { getStoredRefreshToken } from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const loginRequest = async (credentials) => unwrap(await api.post('/auth/login', credentials));
export const sendLoginEmailCode = async (challengeId) => unwrap(await api.post('/auth/login/email-code', { challengeId }));
export const verifyLoginCode = async (payload) => unwrap(await api.post('/auth/login/verify', payload));
export const confirmRegistrationAuthenticator = async (payload) => unwrap(await api.post('/auth/register/authenticator', payload));
export const getAuthenticatorStatus = async () => unwrap(await api.get('/auth/authenticator'));
export const beginAuthenticatorSetup = async (currentPassword) => unwrap(await api.post('/auth/authenticator/setup', { currentPassword }));
export const confirmAuthenticatorSetup = async (payload) => unwrap(await api.post('/auth/authenticator/confirm', payload));
export const refreshRequest = async () => unwrap(await api.post('/auth/refresh', { refreshToken: getStoredRefreshToken() }));
export const logoutRequest = async () => unwrap(await api.post('/auth/logout', { refreshToken: getStoredRefreshToken() }));
export const getCurrentUser = async () => unwrap(await api.get('/auth/me'));
export const registerClient = async (payload) => unwrap(await api.post('/auth/register', payload));
export const requestPasswordResetCode = async (payload) => unwrap(await api.post('/auth/forgot-password/request', payload));
export const resetPasswordWithCode = async (payload) => unwrap(await api.post('/auth/forgot-password/reset', payload));
export const changePassword = async (payload) => unwrap(await api.patch('/auth/password', payload));
