import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from 'axios';

// =======================================================
// API Base Configuration
// =======================================================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/';

// =======================================================
// Auth Hooks (Injected by App/Auth Context)
// =======================================================
let refreshCallback: (() => Promise<string>) | null = null;
let onLogout: (() => void) | null = null;

export const setRefreshCallback = (
  callback: () => Promise<string>
) => {
  refreshCallback = callback;
};

export const setLogoutHandler = (handler: () => void) => {
  onLogout = handler;
};

// =======================================================
// Axios Instance
// =======================================================
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// =======================================================
// Token Management (Single Source of Truth)
// =======================================================
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// =======================================================
// Refresh State
// =======================================================
let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (
  error: any,
  token: string | null = null
) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });

  failedQueue = [];
};

// =======================================================
// Response Interceptor (Auth / Refresh Logic)
// =======================================================
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Only handle 401 errors
    if (
      error.response?.status !== 401 ||
      !refreshCallback
    ) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Allow opt-out for login / refresh endpoints
    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // Queue requests if refresh already running
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization =
              `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshCallback();

      // Update global token
      setAuthToken(newToken);

      // Retry queued requests
      processQueue(null, newToken);

      // Retry original request
      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      onLogout?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// =======================================================
// API Service Wrapper
// =======================================================
export const apiService = {
  get: <T = any>(url: string, config?: any) =>
    api.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) =>
    api.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) =>
    api.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any) =>
    api.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) =>
    api.delete<T>(url, config),
};

export default api;
