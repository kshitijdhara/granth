import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/authApi';
import { setAuthToken, setRefreshCallback } from '../../services/baseApi';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface StoredAuthData {
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  userId: string | null;
  username: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType {
  // State properties
  userId: string | null;
  username: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Methods
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string>;
}

const AUTH_STORAGE_KEY = 'auth';

// Helper functions for localStorage management
const getStoredAuthData = (): StoredAuthData | null => {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading auth data from localStorage:', error);
    return null;
  }
};

const setStoredAuthData = (data: StoredAuthData | null): void => {
  try {
    if (data) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving auth data to localStorage:', error);
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    username: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Set up token for API requests
  useEffect(() => {
    setAuthToken(authState.accessToken);
    setRefreshCallback(refreshToken);
  }, [authState.accessToken, authState.refreshToken]);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const storedAuth = getStoredAuthData();

      if (storedAuth && storedAuth.accessToken) {
        setAuthState({
          userId: storedAuth.userId || null,
          username: storedAuth.username || null,
          accessToken: storedAuth.accessToken,
          refreshToken: storedAuth.refreshToken || null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { userID, username, accessToken, refreshToken } = response;

      // Update state
      setAuthState({
        userId: userID,
        username,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store all auth data in single localStorage key
      setStoredAuthData({
        userId: userID,
        username,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.register(name, email, password);
      const { userID, username, accessToken, refreshToken } = response;

      // Update state
      setAuthState({
        userId: userID,
        username,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store all auth data in single localStorage key
      setStoredAuthData({
        userId: userID,
        username,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state
      setAuthState({
        userId: null,
        username: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Clear all auth data from localStorage
      setStoredAuthData(null);

      // Navigate to login
      navigate('/login');
    }
  };

  const refreshToken = async (): Promise<string> => {
    if (!authState.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Note: This assumes the backend has a refresh endpoint
      // You may need to implement this in your backend
      const response = await authAPI.refreshToken(authState.refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response;

      // Update state
      setAuthState(prev => ({
        ...prev,
        accessToken,
        refreshToken: newRefreshToken,
      }));

      // Update stored auth data with new tokens
      const currentAuth = getStoredAuthData();
      if (currentAuth) {
        setStoredAuthData({
          ...currentAuth,
          accessToken,
          refreshToken: newRefreshToken,
        });
      }

      return accessToken;
    } catch (error) {
      // If refresh fails, logout
      await logout();
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshAccessToken: refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};