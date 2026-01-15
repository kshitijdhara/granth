import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/';

// Token getter function - will be set by AuthContext
let getAccessToken: (() => string | null) | null = null;

export const setTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

// Create axios instance with default config
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken ? getAccessToken() : localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - let AuthContext handle this
      // For now, just reject the error
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiService = {
  get: <T = any>(url: string, config?: any) => api.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => api.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => api.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any) => api.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => api.delete<T>(url, config),
};

export default api;