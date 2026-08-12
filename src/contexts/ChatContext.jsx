import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getChatUsers, getUnreadChatMessages } from '../services/chat.client.service.js';

const ChatContext = createContext(null);
const CHAT_REFRESH_MS = 30000;

export const ChatProvider = ({ children, enabled = false }) => {
  const [users, setUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const inFlightRef = useRef(false);

  const refreshChat = useCallback(async () => {
    if (!enabled || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const [nextUsers, nextUnreadMessages] = await Promise.all([
        getChatUsers(),
        getUnreadChatMessages()
      ]);
      setUsers(nextUsers);
      setUnreadMessages(nextUnreadMessages);
    } catch (_error) {
      setUsers([]);
      setUnreadMessages([]);
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setUnreadMessages([]);
      return undefined;
    }

    refreshChat();
    const timer = window.setInterval(refreshChat, CHAT_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [enabled, refreshChat]);

  const unreadBySender = useMemo(
    () => unreadMessages.reduce((acc, message) => {
      acc[message.senderId] = (acc[message.senderId] || 0) + 1;
      return acc;
    }, {}),
    [unreadMessages]
  );

  const value = useMemo(
    () => ({
      users,
      unreadMessages,
      unreadBySender,
      unreadCount: unreadMessages.length,
      refreshChat
    }),
    [users, unreadMessages, unreadBySender, refreshChat]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChatContext debe usarse dentro de ChatProvider');
  return context;
};
