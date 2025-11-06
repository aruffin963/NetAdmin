import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface ScanResult {
  ip: string;
  hostname: string;
  status: 'online' | 'offline' | 'reserved' | 'timeout';
  responseTime?: number;
  mac?: string;
  vendor?: string;
  deviceType?: string;
  lastSeen?: string;
  note?: string;
}

export interface ScanConfig {
  network: string;
  timeout?: number;
  skipPing?: boolean;
  resolveDNS?: boolean;
  detectDevice?: boolean;
  updateDatabase?: boolean;
}

export interface NetworkScan {
  id: string;
  network: string;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  hostsScanned: number;
  hostsFound: number;
  config: ScanConfig;
  results: ScanResult[];
}

// Hook pour démarrer un scan
export const useStartScan = () => {
  return useMutation({
    mutationFn: async (config: ScanConfig) => {
      const response = await axios.post(`${API_BASE_URL}/scan/start`, config);
      return response.data;
    },
  });
};

// Hook pour obtenir les résultats d'un scan
export const useScanResults = (scanId?: string) => {
  return useQuery({
    queryKey: ['scanResults', scanId],
    queryFn: async () => {
      if (!scanId) throw new Error('Scan ID is required');
      const response = await axios.get(`${API_BASE_URL}/scan/results/${scanId}`);
      return response.data;
    },
    enabled: !!scanId,
    refetchInterval: 2000, // Rafraîchir toutes les 2 secondes si le scan est en cours
    refetchIntervalInBackground: false,
  });
};

// Hook pour obtenir l'historique des scans
export const useScanHistory = () => {
  return useQuery({
    queryKey: ['scanHistory'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/scan/history`);
      return response.data;
    }
  });
};

// Hook pour arrêter un scan en cours
export const useStopScan = () => {
  return useMutation({
    mutationFn: async (scanId: string) => {
      await axios.post(`${API_BASE_URL}/scan/stop/${scanId}`);
    },
  });
};