import apiClient from '../utils/api';

export interface LogFilter {
  search?: string;
  level?: string;
  category?: string;
  username?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'level' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface LogResponse {
  success: boolean;
  data: any[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface LogStats {
  total: number;
  byLevel: {
    error: number;
    warning: number;
    info: number;
    debug: number;
  };
  byCategory: {
    [key: string]: number;
  };
}

export const LogsService = {
  /**
   * Récupère les logs avec filtres
   */
  async getLogs(filters: LogFilter): Promise<LogResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.level && filters.level !== 'all') params.append('status', filters.level);
    if (filters.category && filters.category !== 'all') params.append('resource_type', filters.category);
    if (filters.username) params.append('username', filters.username);
    if (filters.resourceType) params.append('resource_type', filters.resourceType);
    if (filters.startDate) params.append('start_date', filters.startDate.toISOString());
    if (filters.endDate) params.append('end_date', filters.endDate.toISOString());
    
    params.append('limit', String(filters.limit || 50));
    params.append('offset', String(filters.offset || 0));

    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.sortOrder) params.append('sort_order', filters.sortOrder);

    const response = await apiClient.get('/api/logs', { params });
    
    // Transformar datos del backend para correspondencia correcta
    const transformedData = response.data.data.map((log: any) => ({
      id: log.id,
      timestamp: log.created_at || log.timestamp,
      level: log.status || log.level || 'info',
      category: log.resource_type || log.category || 'unknown',
      message: log.action || log.resource_name || log.message || 'N/A',
      details: log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : null,
      source: log.action || 'system',
      username: log.username,
      deviceName: log.resource_name,
      deviceId: log.resource_id,
      ...log // Spread original data para incluir otros campos
    }));

    return {
      success: response.data.success,
      data: transformedData,
      total: response.data.total,
      pagination: response.data.pagination
    };
  },

  /**
   * Récupère les logs récents
   */
  async getRecentLogs(limit: number = 20): Promise<any[]> {
    const response = await apiClient.get('/api/logs/recent', { 
      params: { limit } 
    });
    return response.data.data || [];
  },

  /**
   * Récupère les statistiques des logs
   */
  async getStats(filters?: Partial<LogFilter>): Promise<LogStats> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('start_date', filters.startDate.toISOString());
      if (filters?.endDate) params.append('end_date', filters.endDate.toISOString());
      
      const response = await apiClient.get('/api/logs/stats', { params });
      return response.data.data || {
        total: 0,
        byLevel: { error: 0, warning: 0, info: 0, debug: 0 },
        byCategory: {}
      };
    } catch {
      return {
        total: 0,
        byLevel: { error: 0, warning: 0, info: 0, debug: 0 },
        byCategory: {}
      };
    }
  },

  /**
   * Archive les logs
   */
  async archiveLogs(filters: LogFilter): Promise<any> {
    const response = await apiClient.post('/api/logs/archive', filters);
    return response.data;
  },

  /**
   * Exporte les logs en CSV
   */
  async exportLogs(filters: LogFilter): Promise<Blob> {
    const response = await apiClient.get('/api/logs/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Supprime les logs
   */
  async deleteLogs(filters: LogFilter): Promise<any> {
    const response = await apiClient.post('/api/logs/delete', filters);
    return response.data;
  },

  /**
   * Récupère les catégories disponibles
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get('/api/logs/categories');
      return response.data.data || [];
    } catch {
      return ['device', 'authentication', 'alert', 'configuration', 'request', 'user', 'discovery'];
    }
  },

  /**
   * Récupère les sources disponibles
   */
  async getSources(): Promise<string[]> {
    try {
      const response = await apiClient.get('/api/logs/sources');
      return response.data.data || [];
    } catch {
      return ['system', 'api', 'scheduled_task', 'webhook', 'manual'];
    }
  }
};
