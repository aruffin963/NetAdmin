import axios from 'axios';
import { 
  NetworkTopology, 
  DiscoveryRequest, 
  DiscoveryResult, 
  GraphData, 
  TopologyApiResponse,
  TopologyStatistics,
  DeviceStatus 
} from '../types/topology';

// Client API simple intégré
const createApiClient = () => {
  return axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

class TopologyService {
  private api = createApiClient();
  private baseUrl = '/topology';

  /**
   * Récupère toutes les topologies
   */
  async getAllTopologies(): Promise<NetworkTopology[]> {
    const response = await this.api.get<TopologyApiResponse>(`${this.baseUrl}/topologies`);
    return (response.data as any).data as NetworkTopology[];
  }

  /**
   * Récupère une topologie par ID
   */
  async getTopologyById(id: string): Promise<NetworkTopology | null> {
    try {
      const response = await this.api.get<TopologyApiResponse>(`${this.baseUrl}/topologies/${id}`);
      return (response.data as any).data as NetworkTopology;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Génère les données de graphe pour visualisation
   */
  async getGraphData(topologyId: string): Promise<GraphData | null> {
    try {
      const response = await this.api.get<TopologyApiResponse>(`${this.baseUrl}/graph/${topologyId}`);
      return (response.data as any).data as GraphData;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Lance une découverte réseau
   */
  async startDiscovery(request: DiscoveryRequest): Promise<DiscoveryResult> {
    const response = await this.api.post<TopologyApiResponse>(
      `${this.baseUrl}/discovery/start`,
      request
    );
    return (response.data as any).data as DiscoveryResult;
  }

  /**
   * Récupère le résultat d'une découverte
   */
  async getDiscoveryResult(id: string): Promise<DiscoveryResult | null> {
    try {
      const response = await this.api.get<TopologyApiResponse>(`${this.baseUrl}/discovery/${id}`);
      return (response.data as any).data as DiscoveryResult;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un appareil
   */
  async updateDeviceStatus(
    topologyId: string, 
    deviceId: string, 
    status: DeviceStatus
  ): Promise<void> {
    await this.api.put(`${this.baseUrl}/devices/${topologyId}/${deviceId}/status`, {
      status
    });
  }

  /**
   * Supprime un appareil de la topologie
   */
  async removeDevice(topologyId: string, deviceId: string): Promise<void> {
    await this.api.delete(`${this.baseUrl}/devices/${topologyId}/${deviceId}`);
  }

  /**
   * Récupère les presets de découverte
   */
  async getDiscoveryPresets(): Promise<any[]> {
    const response = await this.api.get<TopologyApiResponse>(`${this.baseUrl}/discovery/presets`);
    return (response.data as any).data as any[];
  }

  /**
   * Récupère les statistiques d'une topologie
   */
  async getStatistics(topologyId: string): Promise<TopologyStatistics | null> {
    try {
      const response = await this.api.get<TopologyApiResponse>(`${this.baseUrl}/statistics/${topologyId}`);
      return (response.data as any).data as TopologyStatistics;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Surveille l'état d'une découverte
   */
  async monitorDiscovery(
    discoveryId: string, 
    onUpdate: (result: DiscoveryResult) => void,
    intervalMs: number = 2000
  ): Promise<() => void> {
    const interval = setInterval(async () => {
      try {
        const result = await this.getDiscoveryResult(discoveryId);
        if (result) {
          onUpdate(result);
          
          // Arrêter la surveillance si terminé
          if (result.status === 'completed' || result.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Erreur monitoring découverte:', error);
      }
    }, intervalMs);

    // Retourne fonction de nettoyage
    return () => clearInterval(interval);
  }
}

export const topologyService = new TopologyService();