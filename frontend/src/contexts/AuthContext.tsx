'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, tokenManager } from '@/lib/api/client';
import type { User } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const isAuthenticated = user !== null;

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const { user: userData, tokens } = response.data;

      // Save tokens to localStorage
      tokenManager.saveTokens(tokens.access_token, tokens.refresh_token);

      // Update user state
      setUser(userData);
    } catch (error) {
      // Re-throw error to be handled by the component
      throw error;
    }
  };

  const logout = () => {
    // Clear tokens from localStorage
    tokenManager.clearTokens();

    // Clear user state
    setUser(null);
  };

  const checkAuth = async () => {
    const token = tokenManager.getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Verify token by fetching current user
      const response = await authApi.getMe();
      setUser(response.data);
    } catch (error) {
      // Token is invalid or expired, clear it
      tokenManager.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
