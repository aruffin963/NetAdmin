import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

/**
 * Service d'intégration avec l'API Zabbix
 * Pour connecter un serveur Zabbix et récupérer les données de monitoring
 */

export interface ZabbixAuthResponse {
  jsonrpc: string;
  result: string; // authtoken
  id: number;
}

export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: string;
  lastaccess?: string;
  description?: string;
}

export interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  hostid: string;
  value_type: string;
  lastclock?: string;
  lastvalue?: string;
  prevvalue?: string;
}

export interface ZabbixHistory {
  itemid: string;
  clock: string;
  value: string;
  ns?: string;
}

export interface ZabbixMetrics {
  hostid: string;
  hostname: string;
  cpu?: number;
  memory?: number;
  memoryTotal?: number;
  disk?: number;
  diskTotal?: number;
  uptime?: number;
  lastUpdate?: Date;
  status: 'online' | 'offline';
}

export class ZabbixService {
  private static instance: ZabbixService;
  private apiClient: AxiosInstance | null = null;
  private authToken: string | null = null;
  private zabbixUrl: string;
  private zabbixUser: string;
  private zabbixPassword: string;
  private isEnabled: boolean;

  private constructor() {
    this.zabbixUrl = process.env.ZABBIX_URL || 'http://localhost/zabbix';
    this.zabbixUser = process.env.ZABBIX_USER || 'Admin';
    this.zabbixPassword = process.env.ZABBIX_PASSWORD || 'zabbix';
    this.isEnabled = process.env.ZABBIX_ENABLED === 'true';

    if (this.isEnabled) {
      this.initApiClient();
    }
  }

  static getInstance(): ZabbixService {
    if (!ZabbixService.instance) {
      ZabbixService.instance = new ZabbixService();
    }
    return ZabbixService.instance;
  }

  /**
   * Initialiser le client API Zabbix
   */
  private initApiClient(): void {
    this.apiClient = axios.create({
      baseURL: `${this.zabbixUrl}/api_jsonrpc.php`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('Zabbix API client initialized');
  }

  /**
   * Authentifier auprès de Zabbix
   */
  async authenticate(): Promise<boolean> {
    if (!this.isEnabled || !this.apiClient) {
      logger.warn('Zabbix is not enabled');
      return false;
    }

    try {
      const response = await this.apiClient.post('', {
        jsonrpc: '2.0',
        method: 'user.login',
        params: {
          username: this.zabbixUser,
          password: this.zabbixPassword,
        },
        auth: null,
        id: 0,
      });

      if (response.data.result) {
        this.authToken = response.data.result;
        logger.info('✅ Zabbix authentication successful');
        return true;
      } else {
        logger.error('❌ Zabbix authentication failed:', response.data.error);
        return false;
      }
    } catch (error) {
      logger.error('❌ Zabbix authentication error:', error);
      return false;
    }
  }

  /**
   * Récupérer tous les hôtes monitorés
   */
  async getHosts(): Promise<ZabbixHost[]> {
    if (!this.authToken || !this.apiClient) {
      logger.warn('Zabbix not authenticated');
      return [];
    }

    try {
      const response = await this.apiClient.post('', {
        jsonrpc: '2.0',
        method: 'host.get',
        params: {
          output: ['hostid', 'host', 'name', 'status', 'description'],
          selectInterfaces: ['ip', 'dns', 'type'],
          sortfield: 'name',
        },
        auth: this.authToken,
        id: 1,
      });

      if (response.data.result) {
        logger.info(`✅ Retrieved ${response.data.result.length} hosts from Zabbix`);
        return response.data.result;
      }
      return [];
    } catch (error) {
      logger.error('❌ Error fetching Zabbix hosts:', error);
      return [];
    }
  }

  /**
   * Récupérer les items (métriques) d'un hôte
   */
  async getHostItems(hostid: string): Promise<ZabbixItem[]> {
    if (!this.authToken || !this.apiClient) {
      logger.warn('Zabbix not authenticated');
      return [];
    }

    try {
      const response = await this.apiClient.post('', {
        jsonrpc: '2.0',
        method: 'item.get',
        params: {
          hostids: [hostid],
          output: ['itemid', 'name', 'key_', 'lastclock', 'lastvalue', 'prevvalue'],
          sortfield: 'name',
        },
        auth: this.authToken,
        id: 2,
      });

      if (response.data.result) {
        return response.data.result;
      }
      return [];
    } catch (error) {
      logger.error(`❌ Error fetching items for host ${hostid}:`, error);
      return [];
    }
  }

  /**
   * Récupérer l'historique d'une métrique
   */
  async getItemHistory(itemid: string, limit: number = 100): Promise<ZabbixHistory[]> {
    if (!this.authToken || !this.apiClient) {
      logger.warn('Zabbix not authenticated');
      return [];
    }

    try {
      const response = await this.apiClient.post('', {
        jsonrpc: '2.0',
        method: 'history.get',
        params: {
          itemids: [itemid],
          output: ['itemid', 'clock', 'value', 'ns'],
          limit,
          sortfield: 'clock',
          sortorder: 'DESC',
        },
        auth: this.authToken,
        id: 3,
      });

      if (response.data.result) {
        return response.data.result;
      }
      return [];
    } catch (error) {
      logger.error(`❌ Error fetching history for item ${itemid}:`, error);
      return [];
    }
  }

  /**
   * Récupérer les dernières valeurs pour des items spécifiques
   */
  async getLatestValues(itemids: string[]): Promise<ZabbixItem[]> {
    if (!this.authToken || !this.apiClient) {
      logger.warn('Zabbix not authenticated');
      return [];
    }

    try {
      const response = await this.apiClient.post('', {
        jsonrpc: '2.0',
        method: 'item.get',
        params: {
          itemids,
          output: ['itemid', 'name', 'key_', 'lastclock', 'lastvalue', 'prevvalue'],
        },
        auth: this.authToken,
        id: 4,
      });

      if (response.data.result) {
        return response.data.result;
      }
      return [];
    } catch (error) {
      logger.error('❌ Error fetching latest values:', error);
      return [];
    }
  }

  /**
   * Parser les métriques Zabbix en format standardisé
   * Cherche automatiquement les items pour CPU, Mémoire, Disque, etc.
   */
  async parseHostMetrics(hostid: string, hostname: string): Promise<ZabbixMetrics> {
    try {
      const items = await this.getHostItems(hostid);

      // Chercher les items correspondant aux métriques
      const cpuItem = items.find(item => 
        item.key_.toLowerCase().includes('cpu') || 
        item.name.toLowerCase().includes('cpu')
      );

      const memItem = items.find(item => 
        item.key_.toLowerCase().includes('memory') || 
        item.name.toLowerCase().includes('memory')
      );

      const diskItem = items.find(item => 
        item.key_.toLowerCase().includes('disk') || 
        item.name.toLowerCase().includes('disk')
      );

      const uptimeItem = items.find(item => 
        item.key_.toLowerCase().includes('uptime') || 
        item.name.toLowerCase().includes('uptime')
      );

      const metrics: ZabbixMetrics = {
        hostid,
        hostname,
        cpu: cpuItem ? parseFloat(cpuItem.lastvalue || '0') : undefined,
        memory: memItem ? parseFloat(memItem.lastvalue || '0') : undefined,
        disk: diskItem ? parseFloat(diskItem.lastvalue || '0') : undefined,
        uptime: uptimeItem ? parseInt(uptimeItem.lastvalue || '0') : undefined,
        lastUpdate: new Date(),
        status: 'online',
      };

      return metrics;
    } catch (error) {
      logger.error(`❌ Error parsing metrics for host ${hostid}:`, error);
      return {
        hostid,
        hostname,
        lastUpdate: new Date(),
        status: 'offline',
      };
    }
  }

  /**
   * Récupérer toutes les métriques pour tous les hôtes
   */
  async getAllMetrics(): Promise<ZabbixMetrics[]> {
    try {
      const hosts = await this.getHosts();
      const metricsPromises = hosts.map(host => 
        this.parseHostMetrics(host.hostid, host.name)
      );

      const allMetrics = await Promise.all(metricsPromises);
      return allMetrics;
    } catch (error) {
      logger.error('❌ Error fetching all metrics:', error);
      return [];
    }
  }

  /**
   * Déconnexion Zabbix
   */
  async logout(): Promise<boolean> {
    if (!this.authToken || !this.apiClient) {
      return false;
    }

    try {
      await this.apiClient.post('', {
        jsonrpc: '2.0',
        method: 'user.logout',
        params: {},
        auth: this.authToken,
        id: 5,
      });

      this.authToken = null;
      logger.info('✅ Zabbix logout successful');
      return true;
    } catch (error) {
      logger.error('❌ Error logging out from Zabbix:', error);
      return false;
    }
  }

  /**
   * Vérifier l'état de la connexion
   */
  isConnected(): boolean {
    return this.isEnabled && this.authToken !== null;
  }

  /**
   * Obtenir le statut du service
   */
  getStatus(): {
    enabled: boolean;
    connected: boolean;
    url: string;
    user: string;
  } {
    return {
      enabled: this.isEnabled,
      connected: this.isConnected(),
      url: this.zabbixUrl,
      user: this.zabbixUser,
    };
  }
}

export default ZabbixService.getInstance();
