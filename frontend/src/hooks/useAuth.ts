import { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  lastLogin?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

const API_URL = 'http://localhost:5000/api';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // Check authentication status from backend
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include', // Important for cookies/sessions
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.user) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: result.data.user,
          });
          return;
        }
      }

      // Not authenticated
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Refresh session every 10 minutes (before 15min timeout)
    const refreshInterval = setInterval(async () => {
      try {
        await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Session refresh error:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies/sessions
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Login successful, user:', result.user);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: result.user,
        });
        
        // Petit délai pour que React re-render, puis redirection
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
        
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: result.message || 'Identifiants invalides',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
      
      // Redirection vers la page de login
      window.location.href = '/';
    }
  };

  return {
    ...authState,
    login,
    logout,
  };
};