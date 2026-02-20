import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/authService';
import { TokenManager } from '../services/tokenManager';

interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  lastLogin?: string;
  role?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  authMethod?: 'jwt' | 'session'; // Track which auth method is being used
}

const API_URL = 'http://localhost:5000/api';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    authMethod: undefined,
  });

  // Check authentication status from backend or stored JWT
  const checkAuth = useCallback(async () => {
    // First, check if we have valid JWT tokens
    if (TokenManager.hasValidTokens()) {
      try {
        const userInfo = TokenManager.getUserInfo();
        if (userInfo) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: {
              id: userInfo.userId,
              username: userInfo.username,
              email: userInfo.email,
              role: userInfo.role,
            },
            authMethod: 'jwt',
          });
          return;
        }
      } catch (error) {
        console.error('JWT auth check error:', error);
        TokenManager.clearTokens();
      }
    }

    // Fall back to session-based auth check
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
            authMethod: 'session',
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

  /**
   * JWT Login
   */
  const loginWithJWT = async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await AuthService.loginWithJWT(username, password);

      // Check for 2FA requirement (403 status)
      if (response.requires2FA) {
        console.log('2FA verification required');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          requires2FA: true,
          userId: response.data?.userId || null, // Include userId for 2FA verification
          error: response.message || 'Two-factor authentication required',
        };
      }

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          authMethod: 'jwt',
        });

        // Delay redirect to allow state update
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);

        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: response.message || 'Login failed',
        };
      }
    } catch (error: any) {
      console.error('JWT Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error.message || 'Erreur de connexion au serveur',
      };
    }
  };

  /**
   * Session-based Login (legacy)
   */
  const loginWithSession = async (username: string, password: string) => {
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
        console.log('Session login successful, user:', result.user);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: result.user || result.data?.user,
          authMethod: 'session',
        });
        
        // Petit délai pour que React re-render, puis redirection
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
        
        return { success: true };
      } else if (response.status === 403 && result.requires2FA) {
        // 2FA is required - don't set authenticated, return requires2FA flag
        console.log('2FA verification required');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          requires2FA: true,
          userId: result.data?.userId || null, // Include userId for 2FA verification
          error: result.message || 'Two-factor authentication required',
        };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: result.message || 'Identifiants invalides',
        };
      }
    } catch (error) {
      console.error('Session login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  };

  /**
   * Login - Primary method (tries JWT first for modern clients)
   */
  const login = async (username: string, password: string) => {
    // Use JWT for new logins (modern approach)
    return loginWithJWT(username, password);
  };

  const logout = async () => {
    try {
      // Logout from session if authenticated via session
      if (authState.authMethod === 'session') {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear JWT tokens
      TokenManager.clearTokens();

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
    loginWithJWT,
    loginWithSession,
    logout,
  };
};