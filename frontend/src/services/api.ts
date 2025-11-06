import axios, { AxiosInstance, AxiosResponse } from 'axios';

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

  constructor() {
    this.instance = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'Une erreur est survenue',
          status: error.response?.status,
          code: error.response?.data?.code,
          details: error.response?.data?.details,
        };

        // Handle specific status codes
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }

        return Promise.reject(apiError);
      }
    );
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