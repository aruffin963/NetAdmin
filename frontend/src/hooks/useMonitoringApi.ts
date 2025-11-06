import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  NetworkDevice,
  DeviceMetrics,
  Alert,
  MonitoringDashboard,
  MetricHistory,
  MetricType,
  ApiResponse
} from '../types/monitoring';

const API_BASE_URL = 'http://localhost:5000/api/monitoring';

// ========== HOOKS POUR LES ÉQUIPEMENTS ==========

// Hook pour récupérer tous les équipements
export const useDevices = () => {
  return useQuery<NetworkDevice[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/devices`);
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      const data: ApiResponse<NetworkDevice[]> = await response.json();
      return data.data;
    },
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Refetch toutes les minutes
  });
};

// Hook pour récupérer un équipement spécifique
export const useDevice = (deviceId: string) => {
  return useQuery<NetworkDevice>({
    queryKey: ['device', deviceId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch device');
      }
      const data: ApiResponse<NetworkDevice> = await response.json();
      return data.data;
    },
    enabled: !!deviceId,
    staleTime: 60000, // 1 minute
  });
};

// Hook pour récupérer les métriques temps réel d'un équipement
export const useDeviceMetrics = (deviceId: string, enabled: boolean = true) => {
  return useQuery<DeviceMetrics>({
    queryKey: ['deviceMetrics', deviceId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch device metrics');
      }
      const data: ApiResponse<DeviceMetrics> = await response.json();
      return data.data;
    },
    enabled: enabled && !!deviceId,
    staleTime: 10000, // 10 secondes pour les métriques temps réel
    refetchInterval: 30000, // Refetch toutes les 30 secondes
  });
};

// Hook pour ajouter un nouvel équipement
export const useAddDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceData: {
      name: string;
      ipAddress: string;
      type: string;
      location: string;
      description?: string;
      credentials?: {
        username: string;
        password: string;
        snmpCommunity?: string;
      };
    }) => {
      // Transformer les données pour l'API (camelCase -> snake_case)
      const apiData = {
        name: deviceData.name,
        ip_address: deviceData.ipAddress,
        type: deviceData.type,
        location: deviceData.location,
        description: deviceData.description,
        credentials: deviceData.credentials
      };

      const response = await fetch(`${API_BASE_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add device');
      }

      const data: ApiResponse<NetworkDevice> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      // Invalider les caches pour forcer le rechargement des données
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['devicesMetrics'] });
    },
    onError: (error) => {
      console.error('Error adding device:', error);
    },
  });
};

// Hook pour récupérer les métriques de tous les équipements en ligne
export const useAllDevicesMetrics = () => {
  const { data: devices = [] } = useDevices();
  
  // Filtrer les équipements en ligne
  const onlineDevices = devices.filter(device => 
    device.status === 'online' && device.monitoringEnabled
  );

  return useQuery<DeviceMetrics[]>({
    queryKey: ['allDevicesMetrics', onlineDevices.map(d => d.id)],
    queryFn: async () => {
      const promises = onlineDevices.map(async (device) => {
        try {
          const response = await fetch(`${API_BASE_URL}/devices/${device.id}/metrics`);
          if (!response.ok) return null;
          const data: ApiResponse<DeviceMetrics> = await response.json();
          return data.data;
        } catch {
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      return results.filter((metric): metric is DeviceMetrics => metric !== null);
    },
    enabled: onlineDevices.length > 0,
    staleTime: 10000,
    refetchInterval: 20000, // Refetch toutes les 20 secondes
  });
};

// ========== HOOKS POUR L'HISTORIQUE DES MÉTRIQUES ==========

// Hook pour récupérer l'historique d'une métrique
export const useMetricHistory = (
  deviceId: string,
  metricType: MetricType,
  hours: number = 24,
  enabled: boolean = true
) => {
  return useQuery<MetricHistory>({
    queryKey: ['metricHistory', deviceId, metricType, hours],
    queryFn: async () => {
      const params = new URLSearchParams({
        deviceId,
        metricType,
        hours: hours.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/metrics/history?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metric history');
      }
      const data: ApiResponse<MetricHistory> = await response.json();
      return data.data;
    },
    enabled: enabled && !!deviceId && !!metricType,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch toutes les 5 minutes
  });
};

// ========== HOOKS POUR LES ALERTES ==========

// Hook pour récupérer toutes les alertes
export const useAlerts = (filters?: {
  level?: string;
  acknowledged?: boolean;
  resolved?: boolean;
}) => {
  return useQuery<Alert[]>({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.level) params.append('level', filters.level);
      if (filters?.acknowledged !== undefined) params.append('acknowledged', filters.acknowledged.toString());
      if (filters?.resolved !== undefined) params.append('resolved', filters.resolved.toString());
      
      const response = await fetch(`${API_BASE_URL}/alerts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data: ApiResponse<Alert[]> = await response.json();
      return data.data;
    },
    staleTime: 30000, // 30 secondes
    refetchInterval: 45000, // Refetch toutes les 45 secondes
  });
};

// Hook pour récupérer les alertes non acquittées
export const useUnacknowledgedAlerts = () => {
  return useAlerts({ acknowledged: false, resolved: false });
};

// Hook pour récupérer les alertes récentes
export const useRecentAlerts = (limit: number = 10) => {
  const { data: allAlerts = [] } = useAlerts();
  
  // Trier par date et limiter
  const recentAlerts = allAlerts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
    
  return { data: recentAlerts };
};

// ========== HOOKS POUR LE DASHBOARD ==========

// Hook pour récupérer les données du dashboard
export const useDashboard = () => {
  return useQuery<MonitoringDashboard>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data: ApiResponse<MonitoringDashboard> = await response.json();
      return data.data;
    },
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Refetch toutes les minutes
  });
};

// ========== MUTATIONS ==========

// Hook pour acquitter une alerte
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }
      
      const data: ApiResponse<Alert> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      // Invalider les caches des alertes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Hook pour ajouter un nouvel équipement
export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deviceData: Partial<NetworkDevice>) => {
      const response = await fetch(`${API_BASE_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create device');
      }
      
      const data: ApiResponse<NetworkDevice> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Hook pour mettre à jour un équipement
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deviceId, deviceData }: { 
      deviceId: string; 
      deviceData: Partial<NetworkDevice> 
    }) => {
      const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update device');
      }
      
      const data: ApiResponse<NetworkDevice> = await response.json();
      return data.data;
    },
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Hook pour supprimer un équipement
export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete device');
      }
      
      const data: ApiResponse<{ deleted: boolean }> = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// ========== HOOKS UTILITAIRES ==========

// Hook pour obtenir les statistiques des équipements
export const useDeviceStats = () => {
  const { data: devices = [] } = useDevices();
  
  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    warning: devices.filter(d => d.status === 'warning').length,
    critical: devices.filter(d => d.status === 'critical').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length,
  };
  
  return stats;
};

// Hook pour obtenir les statistiques des alertes
export const useAlertStats = () => {
  const { data: alerts = [] } = useAlerts();
  
  const stats = {
    total: alerts.length,
    unacknowledged: alerts.filter(a => !a.acknowledged && !a.resolved).length,
    critical: alerts.filter(a => a.level === 'critical' && !a.resolved).length,
    warning: alerts.filter(a => a.level === 'warning' && !a.resolved).length,
    info: alerts.filter(a => a.level === 'info' && !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length,
  };
  
  return stats;
};

// Hook pour surveiller la santé générale du réseau
export const useNetworkHealth = () => {
  const deviceStats = useDeviceStats();
  const alertStats = useAlertStats();
  
  // Calcul simple du score de santé (0-100)
  const healthScore = Math.max(0, Math.min(100, 
    100 - 
    (alertStats.critical * 20) - 
    (alertStats.warning * 10) - 
    (deviceStats.offline * 15) - 
    (deviceStats.critical * 25)
  ));
  
  return {
    score: healthScore,
    status: healthScore >= 80 ? 'good' : healthScore >= 60 ? 'warning' : 'critical',
    deviceStats,
    alertStats
  };
};