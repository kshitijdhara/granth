import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../features/auth/services/authApi';
import { setAuthToken, setRefreshCallback, setLogoutHandler } from '../../services/baseApi';

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
  isHydrated?: boolean;
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

  // Initialize state from storage (and set axios header if token exists)
  const getInitialState = (): AuthState => {
    const stored = getStoredAuthData();
    if (stored && stored.accessToken) {
      setAuthToken(stored.accessToken);
      return {
        userId: stored.userId || null,
        username: stored.username || null,
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      };
    }

    return {
      userId: null,
      username: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
    };
  };

  const [authState, setAuthState] = useState<AuthState>(getInitialState);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setIsHydrated(true);
  }, []);

  // Helper to update auth state, localStorage, and axios header in one place
  const updateAuthState = (data: StoredAuthData | null) => {
    if (data && data.accessToken) {
      const next: AuthState = {
        userId: data.userId || null,
        username: data.username || null,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
      };
      setAuthState(next);
      setStoredAuthData(data);
      setAuthToken(data.accessToken);
    } else {
      setAuthState({
        userId: null,
        username: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      setStoredAuthData(null);
      setAuthToken(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { userID, username, accessToken, refreshToken } = response;

      // Update state + storage + header via helper
      updateAuthState({
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

      // Update state + storage + header via helper
      updateAuthState({
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

  const refreshAccessToken = async (): Promise<string> => {
    // Read refresh token from storage to avoid stale closures
    const stored = getStoredAuthData();
    const currentRefresh = stored?.refreshToken;
    const currentUserId = stored?.userId;

    if (!currentRefresh || !currentUserId) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authAPI.refreshToken(currentRefresh);
      const { accessToken, refreshToken: newRefreshToken } = response;

      // Update everything via helper
      updateAuthState({
        userId: currentUserId,
        username: stored?.username ?? '',
        accessToken,
        refreshToken: newRefreshToken,
      });

      return accessToken;
    } catch (error) {
      await logout();
      throw error;
    }
  };

  // Register refresh and logout handlers with baseApi so interceptors can call them
  useEffect(() => {
    setRefreshCallback(refreshAccessToken);
    setLogoutHandler(() => {
      void logout();
    });
  }, [refreshAccessToken, logout]);

  const contextValue: AuthContextType = {
    ...authState,
    isHydrated,
    login,
    register,
    logout,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};