import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types/auth';
import { loginApi, registerApi, getProfileApi } from '../api/auth';
import {
  getStoredAccessToken,
  setStoredTokens,
  clearStoredTokens,
} from '../api/client';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await getProfileApi();
      setUser(profile);
    } catch {
      clearStoredTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthLogout = () => {
      clearStoredTokens();
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [fetchCurrentUser]);

  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    try {
      const tokens = await loginApi(credentials);
      setStoredTokens(tokens.access, tokens.refresh);
      const profile = await getProfileApi();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await registerApi(payload);
      const tokens = await loginApi({
        username: payload.username,
        password: payload.password,
      });
      setStoredTokens(tokens.access, tokens.refresh);
      const profile = await getProfileApi();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredTokens();
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await getProfileApi();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh user profile', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth';
