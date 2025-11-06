import { useQuery } from '@tanstack/react-query';
import { LogEntry, LogFilters, LogStats, ApiResponse } from '../types/monitoring';

const API_BASE_URL = 'http://localhost:3000/api';

// Hook pour récupérer tous les logs avec filtres
export const useLogs = (filters?: LogFilters) => {
  return useQuery<LogEntry[]>({
    queryKey: ['logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.level && filters.level !== 'all') {
        params.append('level', filters.level);
      }
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.source) {
        params.append('source', filters.source);
      }
      if (filters?.timeRange) {
        params.append('timeRange', filters.timeRange);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.deviceId) {
        params.append('deviceId', filters.deviceId);
      }
      if (filters?.userId) {
        params.append('userId', filters.userId);
      }
      
      const response = await fetch(`${API_BASE_URL}/logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data: ApiResponse<LogEntry[]> = await response.json();
      return data.data;
    },
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Refetch toutes les minutes
  });
};

// Hook pour récupérer les logs récents
export const useRecentLogs = (limit: number = 50) => {
  return useQuery<LogEntry[]>({
    queryKey: ['recentLogs', limit],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/logs/recent?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent logs');
      }
      
      const data: ApiResponse<LogEntry[]> = await response.json();
      return data.data;
    },
    staleTime: 15000, // 15 secondes
    refetchInterval: 30000, // Refetch toutes les 30 secondes
  });
};

// Hook pour récupérer les statistiques des logs
export const useLogStats = (filters?: LogFilters) => {
  return useQuery<LogStats>({
    queryKey: ['logStats', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.level && filters.level !== 'all') {
        params.append('level', filters.level);
      }
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.source) {
        params.append('source', filters.source);
      }
      if (filters?.timeRange) {
        params.append('timeRange', filters.timeRange);
      }
      if (filters?.deviceId) {
        params.append('deviceId', filters.deviceId);
      }
      if (filters?.userId) {
        params.append('userId', filters.userId);
      }
      
      const response = await fetch(`${API_BASE_URL}/logs/stats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch log stats');
      }
      
      const data: ApiResponse<LogStats> = await response.json();
      return data.data;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch toutes les 2 minutes
  });
};

// Hook pour récupérer un log spécifique
export const useLog = (logId: string) => {
  return useQuery<LogEntry>({
    queryKey: ['log', logId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/logs/${logId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch log');
      }
      
      const data: ApiResponse<LogEntry> = await response.json();
      return data.data;
    },
    enabled: !!logId,
    staleTime: 300000, // 5 minutes
  });
};

// Hook pour récupérer les logs d'un équipement spécifique
export const useDeviceLogs = (deviceId: string, limit: number = 100) => {
  return useQuery<LogEntry[]>({
    queryKey: ['deviceLogs', deviceId, limit],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/logs/device/${deviceId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch device logs');
      }
      
      const data: ApiResponse<LogEntry[]> = await response.json();
      return data.data;
    },
    enabled: !!deviceId,
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Refetch toutes les minutes
  });
};

// Hook pour récupérer les logs d'un utilisateur spécifique
export const useUserLogs = (userId: string, limit: number = 100) => {
  return useQuery<LogEntry[]>({
    queryKey: ['userLogs', userId, limit],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/logs/user/${userId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user logs');
      }
      
      const data: ApiResponse<LogEntry[]> = await response.json();
      return data.data;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch toutes les 2 minutes
  });
};

// Hook pour récupérer les catégories de logs disponibles
export const useLogCategories = () => {
  return useQuery<string[]>({
    queryKey: ['logCategories'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/logs/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch log categories');
      }
      
      const data: ApiResponse<string[]> = await response.json();
      return data.data;
    },
    staleTime: 300000, // 5 minutes
  });
};

// Hook pour récupérer les sources de logs disponibles
export const useLogSources = () => {
  return useQuery<string[]>({
    queryKey: ['logSources'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/logs/sources`);
      if (!response.ok) {
        throw new Error('Failed to fetch log sources');
      }
      
      const data: ApiResponse<string[]> = await response.json();
      return data.data;
    },
    staleTime: 300000, // 5 minutes
  });
};