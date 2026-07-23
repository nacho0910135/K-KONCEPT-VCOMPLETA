import api from './api.js';

const unwrap = (response) => response.data?.data ?? response.data;

export const getChatUsers = async () => unwrap(await api.get('/chat/users')).users || [];
export const getUnreadChatMessages = async () => unwrap(await api.get('/chat/unread')).messages || [];
export const getChatMessages = async (peerId) => unwrap(await api.get(`/chat/messages/${peerId}`)).messages || [];
export const sendChatMessage = async (payload) => unwrap(await api.post('/chat/messages', payload)).message;
