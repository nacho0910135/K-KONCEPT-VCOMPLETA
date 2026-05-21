import axios from 'axios';

let accessToken = null;
let unauthorizedHandler = null;
let refreshPromise = null;
const refreshTokenStorageKey = 'kollab_refresh_token';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

export const setStoredRefreshToken = (token) => {
  if (token) {
    window.localStorage.setItem(refreshTokenStorageKey, token);
  } else {
    window.localStorage.removeItem(refreshTokenStorageKey);
  }
};

export const getStoredRefreshToken = () => window.localStorage.getItem(refreshTokenStorageKey);

export const clearStoredRefreshToken = () => {
  window.localStorage.removeItem(refreshTokenStorageKey);
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const notifyServerError = () => {
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: {
        type: 'error',
        title: 'Error del servidor',
        message: 'No pudimos completar la solicitud. Intenta de nuevo en unos minutos.'
      }
    })
  );
};

const redirectToAccessDenied = () => {
  if (window.location.pathname !== '/access-denied') {
    window.location.assign('/access-denied');
  }
};

const isExpiredAccessTokenError = (error) => {
  const status = error.response?.status;
  const code = error.response?.data?.code || error.response?.data?.errorCode;
  return status === 401 && ['ACCESS_TOKEN_EXPIRED', 'TOKEN_EXPIRED', 'JWT_EXPIRED'].includes(code);
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return Promise.reject(new Error('Refresh token no disponible'));

    refreshPromise = axios
      .post(`${apiBaseURL}/auth/refresh`, { refreshToken }, { withCredentials: true })
      .then((response) => {
        const nextToken = response.data?.data?.accessToken || response.data?.accessToken;
        const nextRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;
        setAccessToken(nextToken);
        setStoredRefreshToken(nextRefreshToken);
        return nextToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (isExpiredAccessTokenError(error) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const nextToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        clearStoredRefreshToken();
        unauthorizedHandler?.();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      redirectToAccessDenied();
    }

    if (error.response?.status >= 500) {
      notifyServerError();
    }

    return Promise.reject(error);
  }
);

export default api;
