import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { TokenManager } from './tokenManager';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add JWT token or session cookie
    this.instance.interceptors.request.use(
      (config) => {
        // Try JWT first
        const jwtToken = TokenManager.getAccessToken();
        if (jwtToken) {
          config.headers.Authorization = `Bearer ${jwtToken}`;
        } else {
          // Fall back to session-based auth (cookies)
          config.withCredentials = true;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh on 401
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalConfig = error.config as any;

        // Only retry if it's a 401 and we haven't already retried this request
        if (error.response?.status === 401 && !originalConfig._retry && TokenManager.hasRefreshToken()) {
          originalConfig._retry = true;

          try {
            // Avoid multiple refresh requests in parallel
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken();
            }

            const newAccessToken = await this.refreshPromise;
            this.refreshPromise = null;

            // Update authorization header with new token
            originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;

            // Retry original request
            return this.instance(originalConfig);
          } catch (refreshError) {
            // Refresh failed - redirect to login
            this.handleAuthError();
            this.refreshPromise = null;
            return Promise.reject(refreshError);
          }
        }

        // Handle other 401 responses (no refresh token available)
        if (error.response?.status === 401) {
          this.handleAuthError();
        }

        const apiError: ApiError = {
          message: (error.response?.data as any)?.message || error.message || 'Une erreur est survenue',
          status: error.response?.status,
          code: (error.response?.data as any)?.code,
          details: (error.response?.data as any)?.details,
        };

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        (import.meta as any).env?.VITE_API_URL 
          ? `${(import.meta as any).env.VITE_API_URL}/auth/jwt/refresh`
          : 'http://localhost:5000/api/auth/jwt/refresh',
        { refreshToken },
        { timeout: 5000 }
      );

      const { accessToken, expiresIn } = response.data.data;
      
      // Update stored access token
      TokenManager.updateAccessToken(accessToken, expiresIn);
      
      return accessToken;
    } catch (error) {
      // Refresh failed - clear tokens and redirect to login
      TokenManager.clearTokens();
      throw error;
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    TokenManager.clearTokens();
    window.location.href = '/login';
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.instance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.instance.delete(url, config);
    return response.data;
  }
}

// Export par défaut et nommé
const apiClient = new ApiClient();
export default apiClient;
export { apiClient };
export const createApiClient = () => new ApiClient();