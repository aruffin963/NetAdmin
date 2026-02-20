import apiClient from './api';

export interface SystemLog {
  id?: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  logType: 'console' | 'application' | 'security' | 'performance' | 'integration';
  category?: string;
  message: string;
  source?: string;
  stackTrace?: string;
  metadata?: any;
  userId?: number;
  username?: string;
  ipAddress?: string;
  sessionId?: string;
  environment?: string;
  version?: string;
  createdAt?: string;
}

interface ApiCreateResponse {
  success: boolean;
  message?: string;
  data?: { id: number };
}

interface ApiListResponse {
  success: boolean;
  message?: string;
  data: SystemLog[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiStatsResponse {
  success: boolean;
  message?: string;
  data: {
    total: number;
    byLevel: { [key: string]: number };
    byType: { [key: string]: number };
  };
}

interface ApiListResponse2 {
  success: boolean;
  data: string[];
}

interface ApiSimpleResponse {
  success: boolean;
  message?: string;
  data?: { [key: string]: any };
}

class SystemLogService {
  /**
   * Enregistrer un nouveau log système
   */
  async log(log: SystemLog): Promise<{ success: boolean; id?: number }> {
    try {
      const response = await apiClient.post<ApiCreateResponse>('/system-logs', {
        logLevel: log.logLevel,
        logType: log.logType,
        category: log.category,
        message: log.message,
        source: log.source,
        stackTrace: log.stackTrace,
        metadata: log.metadata
      });

      if (response?.success) {
        return {
          success: true,
          id: response.data?.id
        };
      }

      throw new Error(response?.message || 'Failed to create log');
    } catch (error: any) {
      console.error('Error creating system log:', error);
      return { success: false };
    }
  }

  /**
   * Récupérer les logs système avec pagination et filtres
   */
  async getLogs(options: {
    page?: number;
    pageSize?: number;
    logLevel?: string;
    logType?: string;
    category?: string;
    username?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<SystemLog[]> {
    try {
      const params = new URLSearchParams();

      if (options.page) params.append('page', String(options.page));
      if (options.pageSize) params.append('pageSize', String(options.pageSize));
      if (options.logLevel) params.append('logLevel', options.logLevel);
      if (options.logType) params.append('logType', options.logType);
      if (options.category) params.append('category', options.category);
      if (options.username) params.append('username', options.username);
      if (options.search) params.append('search', options.search);
      if (options.startDate) params.append('startDate', options.startDate.toISOString());
      if (options.endDate) params.append('endDate', options.endDate.toISOString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await apiClient.get<ApiListResponse>(`/system-logs?${params}`);

      if (response?.success) {
        return response.data || [];
      }

      throw new Error(response?.message || 'Failed to fetch logs');
    } catch (error: any) {
      console.error('Error fetching system logs:', error);
      return [];
    }
  }

  /**
   * Récupérer les logs système récents
   */
  async getRecentLogs(limit: number = 100): Promise<SystemLog[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: SystemLog[] }>(
        `/system-logs/recent/${Math.min(limit, 500)}`
      );

      if (response?.success) {
        return response.data || [];
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching recent system logs:', error);
      return [];
    }
  }

  /**
   * Récupérer les statistiques des logs système
   */
  async getStats(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    try {
      const params = new URLSearchParams();

      if (options.startDate) params.append('startDate', options.startDate.toISOString());
      if (options.endDate) params.append('endDate', options.endDate.toISOString());

      const response = await apiClient.get<ApiStatsResponse>(
        `/system-logs/stats?${params}`
      );

      if (response?.success) {
        return response.data;
      }

      throw new Error(response?.message || 'Failed to fetch stats');
    } catch (error: any) {
      console.error('Error fetching system logs stats:', error);
      return {
        total: 0,
        byLevel: {},
        byType: {}
      };
    }
  }

  /**
   * Récupérer les catégories disponibles
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiListResponse2>(
        '/system-logs/categories'
      );

      if (response?.success) {
        return response.data || [];
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching system log categories:', error);
      return [];
    }
  }

  /**
   * Récupérer les sources disponibles
   */
  async getSources(): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiListResponse2>(
        '/system-logs/sources'
      );

      if (response?.success) {
        return response.data || [];
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching system log sources:', error);
      return [];
    }
  }

  /**
   * Archiver les vieux logs
   */
  async archiveOldLogs(): Promise<{ success: boolean; archived: number }> {
    try {
      const response = await apiClient.post<ApiSimpleResponse>('/system-logs/archive');

      if (response?.success) {
        return {
          success: true,
          archived: response.data?.archived || 0
        };
      }

      throw new Error(response?.message || 'Failed to archive logs');
    } catch (error: any) {
      console.error('Error archiving system logs:', error);
      return { success: false, archived: 0 };
    }
  }

  /**
   * Supprimer les logs selon les critères
   */
  async deleteLogs(options: {
    logLevel?: string;
    logType?: string;
    daysToKeep?: number;
  }): Promise<{ success: boolean; deleted: number }> {
    try {
      const params = new URLSearchParams();

      if (options.logLevel) params.append('logLevel', options.logLevel);
      if (options.logType) params.append('logType', options.logType);
      if (options.daysToKeep) params.append('daysToKeep', String(options.daysToKeep));

      const response = await apiClient.delete<ApiSimpleResponse>(
        `/system-logs?${params}`
      );

      if (response?.success) {
        return {
          success: true,
          deleted: response.data?.deleted || 0
        };
      }

      throw new Error(response?.message || 'Failed to delete logs');
    } catch (error: any) {
      console.error('Error deleting system logs:', error);
      return { success: false, deleted: 0 };
    }
  }
}

export default new SystemLogService();
