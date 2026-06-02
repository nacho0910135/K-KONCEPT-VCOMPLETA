import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLatestNotifications, getUnreadNotificationCount } from '../services/notifications.service.js';

const NotificationContext = createContext(null);

const unwrapUnreadCount = (response) => {
  const data = response?.data ?? response;
  return data?.count ?? data?.unreadCount ?? 0;
};

const unwrapNotifications = (response) => {
  const data = response?.data ?? response;
  const items = data?.items ?? data?.notifications ?? data;
  return Array.isArray(items) ? items : [];
};

export const NotificationProvider = ({ children, isAuthenticated = false }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const [countResponse, latestResponse] = await Promise.all([
      getUnreadNotificationCount(),
      getLatestNotifications({ limit: 5 })
    ]);
    setUnreadCount(unwrapUnreadCount(countResponse));
    setNotifications(unwrapNotifications(latestResponse));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return undefined;
    }

    refreshNotifications().catch(() => {});
    const id = window.setInterval(() => {
      refreshNotifications().catch(() => {});
    }, 30000);

    return () => window.clearInterval(id);
  }, [isAuthenticated, refreshNotifications]);

  const value = useMemo(
    () => ({ unreadCount, notifications, refreshNotifications }),
    [unreadCount, notifications, refreshNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext debe usarse dentro de NotificationProvider');
  return context;
};
