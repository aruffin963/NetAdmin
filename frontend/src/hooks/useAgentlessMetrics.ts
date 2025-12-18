import { useState, useCallback } from 'react';
import { AGENTLESS_API } from '../config/api';

export interface MetricData {
  id: number;
  monitored_device_id: number;
  hostname: string;
  dns_name?: string;
  cpu_usage: number | null;
  memory_usage: number | null;
  memory_total: number | null;
  disk_usage: number | null;
  disk_total: number | null;
  uptime: number | null;
  status: 'online' | 'offline';
  response_time: number;
  source: 'snmp' | 'ssh' | 'wmi' | 'ping' | 'local';
  collected_at: string;
  created_at: string;
  ip_address?: string;
  device_hostname?: string;
  device_type?: string;
}

export interface MetricsResponse {
  success: boolean;
  data: MetricData[];
  device?: {
    id: number;
    ip_address: string;
  };
  message?: string;
}

/**
 * Hook pour récupérer les métriques par adresse IP
 * @param ip - Adresse IP de l'équipement
 * @param limit - Nombre de métriques à récupérer (par défaut 50)
 * @param hours - Nombre d'heures à remonter (par défaut 24)
 */
export const useMetricsByIP = (
  ip: string | null | undefined,
  limit: number = 50,
  hours: number = 24
) => {
  const [data, setData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!ip) {
      setError('Adresse IP requise');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${AGENTLESS_API}/metrics/by-ip/${encodeURIComponent(ip)}?limit=${limit}&hours=${hours}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des métriques');
      }

      const result: MetricsResponse = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Erreur lors de la récupération des métriques');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
      console.error('Erreur fetch métriques:', err);
    } finally {
      setLoading(false);
    }
  }, [ip, limit, hours]);

  return { data, loading, error, fetchMetrics };
};

/**
 * Hook pour récupérer les métriques par ID d'équipement
 * @param deviceId - ID de l'équipement
 * @param limit - Nombre de métriques à récupérer (par défaut 50)
 * @param hours - Nombre d'heures à remonter (par défaut 24)
 */
export const useMetricsById = (
  deviceId: number | null | undefined,
  limit: number = 50,
  hours: number = 24
) => {
  const [data, setData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!deviceId) {
      setError('ID d\'équipement requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${AGENTLESS_API}/metrics/${deviceId}?limit=${limit}&hours=${hours}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des métriques');
      }

      const result: MetricsResponse = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Erreur lors de la récupération des métriques');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
      console.error('Erreur fetch métriques:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, limit, hours]);

  return { data, loading, error, fetchMetrics };
};
