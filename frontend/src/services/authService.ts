/**
 * Authentication Service - Handles JWT login/logout and token management
 */

import axios from 'axios';
import { TokenManager, TokenPair } from './tokenManager';

const API_URL = 'http://localhost:5000/api';

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    tokens: TokenPair;
    userId?: number;
  };
  message?: string;
  requires2FA?: boolean;
}

export interface VerifyTokenResponse {
  success: boolean;
  data: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
  message?: string;
}

export class AuthService {
  /**
   * Login with username and password (JWT)
   */
  static async loginWithJWT(username: string, password: string): Promise<any> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/jwt/login`,
        { username, password },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
          // Don't throw on 403 - we handle 2FA specially
          validateStatus: (status) => status < 500,
        }
      );

      // Handle 403 with requires2FA
      if (response.status === 403 && response.data.requires2FA) {
        return {
          success: false,
          requires2FA: true,
          userId: response.data.data?.userId, // Include userId for 2FA verification
          message: response.data.message || 'Two-factor authentication required',
          data: response.data.data,
        };
      }

      if (response.data.success && response.data.data?.tokens) {
        // Store tokens
        TokenManager.storeTokens(response.data.data.tokens);
      }

      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || error.message || 'Login failed',
        status: error.response?.status,
        error,
      };
    }
  }

  /**
   * Verify current JWT token
   */
  static async verifyToken(token?: string): Promise<VerifyTokenResponse> {
    try {
      const accessToken = token || TokenManager.getAccessToken();

      if (!accessToken) {
        throw new Error('No token available');
      }

      const response = await axios.post<VerifyTokenResponse>(
        `${API_URL}/auth/jwt/verify`,
        { token: accessToken },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      TokenManager.clearTokens();
      throw {
        message: error.response?.data?.message || error.message || 'Token verification failed',
        status: error.response?.status,
        error,
      };
    }
  }

  /**
   * Logout - clear tokens
   */
  static logout(): void {
    TokenManager.clearTokens();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return TokenManager.hasValidTokens();
  }

  /**
   * Get current user info from stored token
   */
  static getCurrentUser() {
    return TokenManager.getUserInfo();
  }

  /**
   * Get access token for manual use
   */
  static getAccessToken(): string | null {
    return TokenManager.getAccessToken();
  }
}

export default AuthService;
