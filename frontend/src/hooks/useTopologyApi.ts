import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface NetworkDevice {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  mac?: string;
  type: 'router' | 'switch' | 'firewall' | 'server' | 'workstation' | 'access_point' | 'printer' | 'unknown';
  status: 'online' | 'offline' | 'warning' | 'critical';
  vendor?: string;
  discoveredAt: Date;
  lastSeen: Date;
  ports: any[];
  location: string;
}

export interface NetworkConnection {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourcePort?: string;
  targetPort?: string;
  type: 'ethernet' | 'wifi' | 'fiber' | 'vpn';
  bandwidth?: number;
  status: 'active' | 'inactive' | 'error';
  latency?: number;
}

export interface NetworkTopologyData {
  devices: NetworkDevice[];
  connections: NetworkConnection[];
  subnets: Array<{
    id: string;
    network: string;
    name: string;
    deviceCount: number;
  }>;
  statistics: {
    totalDevices: number;
    activeConnections: number;
    networkSegments: number;
    deviceTypes: number;
    lastDiscovery: Date;
  };
}

// Hook pour récupérer la topologie complète du réseau
export const useNetworkTopology = () => {
  return useQuery({
    queryKey: ['networkTopology'],
    queryFn: async (): Promise<NetworkTopologyData> => {
      const response = await axios.get(`${API_BASE_URL}/monitoring/topology`);
      return response.data;
    },
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });
};

// Hook pour récupérer les détails d'un device spécifique
export const useDeviceDetails = (deviceId?: string) => {
  return useQuery({
    queryKey: ['deviceDetails', deviceId],
    queryFn: async (): Promise<NetworkDevice> => {
      if (!deviceId) throw new Error('Device ID is required');
      const response = await axios.get(`${API_BASE_URL}/monitoring/devices/${deviceId}`);
      return response.data;
    },
    enabled: !!deviceId,
  });
};

// Hook pour déclencher une découverte de réseau
export const useDiscoverNetwork = () => {
  return useMutation({
    mutationFn: async (networks: string[]) => {
      const response = await axios.post(`${API_BASE_URL}/monitoring/discover`, { networks });
      return response.data;
    },
  });
};

// Hook pour récupérer les statistiques de réseau
export const useNetworkStatistics = () => {
  return useQuery({
    queryKey: ['networkStatistics'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/monitoring/statistics`);
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
};

// Hook pour obtenir l'historique des connexions d'un device
export const useDeviceConnections = (deviceId?: string) => {
  return useQuery({
    queryKey: ['deviceConnections', deviceId],
    queryFn: async () => {
      if (!deviceId) throw new Error('Device ID is required');
      const response = await axios.get(`${API_BASE_URL}/monitoring/devices/${deviceId}/connections`);
      return response.data;
    },
    enabled: !!deviceId,
  });
};