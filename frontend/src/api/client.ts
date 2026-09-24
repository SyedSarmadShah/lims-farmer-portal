import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'lims_access_token';
const REFRESH_TOKEN_KEY = 'lims_refresh_token';

export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Robustly sets Authorization header on AxiosHeaders instance or plain header object
 */
const setAuthHeader = (headers: unknown, token: string): void => {
  if (!headers) return;
  const h = headers as Record<string, unknown> & { set?: (k: string, v: string) => void };
  if (typeof h.set === 'function') {
    h.set('Authorization', `Bearer ${token}`);
  } else {
    h['Authorization'] = `Bearer ${token}`;
  }
};

export const setStoredTokens = (access: string, refresh?: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
  setAuthHeader(apiClient.defaults.headers.common, access);
};

export const clearStoredTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  if (apiClient.defaults.headers.common) {
    const common = apiClient.defaults.headers.common as Record<string, unknown> & {
      delete?: (k: string) => void;
    };
    if (typeof common.delete === 'function') {
      common.delete('Authorization');
    } else {
      delete common['Authorization'];
    }
  }
};

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize default Authorization header from localStorage on startup if present
const initialToken = getStoredAccessToken();
if (initialToken) {
  setAuthHeader(apiClient.defaults.headers.common, initialToken);
}

// Request interceptor: attach bearer token using proper AxiosHeaders.set API
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredAccessToken();
    if (token) {
      if (!config.headers) {
        config.headers = new axios.AxiosHeaders();
      }
      setAuthHeader(config.headers, token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 & token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & {
      _retry?: boolean;
    }) | undefined;

    // If 401 and request has not already been retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Do not attempt refresh if the failed request was already login or refresh endpoint
      if (
        originalRequest.url?.includes('/accounts/login/') ||
        originalRequest.url?.includes('/accounts/token/refresh/')
      ) {
        return Promise.reject(error);
      }

      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        clearStoredTokens();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retry = true;
            setAuthHeader(originalRequest.headers, token);
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{ access: string }>(
          '/api/accounts/token/refresh/',
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = refreshResponse.data.access;
        setStoredTokens(newAccessToken);

        processQueue(null, newAccessToken);

        setAuthHeader(originalRequest.headers, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearStoredTokens();
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
