import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAccessToken, clearStoredRefreshToken, getStoredRefreshToken, setAccessToken, setStoredRefreshToken, setUnauthorizedHandler } from '../services/api.js';
import { getCurrentUser, loginRequest, logoutRequest, refreshRequest } from '../services/auth.client.service.js';
import { NotificationProvider } from './NotificationContext.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  const persistAccessToken = useCallback((nextToken) => {
    setToken(nextToken || null);
    setAccessToken(nextToken);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await getCurrentUser();
    setUser(data?.user || data);
    return data;
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    const nextToken = data?.accessToken;
    persistAccessToken(nextToken);
    setStoredRefreshToken(data?.refreshToken);
    setUser(data?.user || null);
    return data;
  }, [persistAccessToken]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      persistAccessToken(null);
      clearAccessToken();
      clearStoredRefreshToken();
    }
  }, [persistAccessToken]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      persistAccessToken(null);
    });
  }, [persistAccessToken]);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        if (!getStoredRefreshToken()) {
          setUser(null);
          return;
        }
        const session = await refreshRequest();
        persistAccessToken(session?.accessToken);
        setStoredRefreshToken(session?.refreshToken);
        const data = await getCurrentUser();
        if (!mounted) return;
        setUser(data?.user || data);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken: token,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser
    }),
    [user, token, isLoading, login, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      <NotificationProvider isAuthenticated={value.isAuthenticated}>
        {children}
      </NotificationProvider>
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  return context;
};
