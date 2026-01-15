import { api } from './baseApi';

// Authentication API methods
export const authAPI = {
  // Login user
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Return raw response data, let context handle storage
  },

  // Register user
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data; // Return raw response data, let context handle storage
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refreshToken', { refreshToken });
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};