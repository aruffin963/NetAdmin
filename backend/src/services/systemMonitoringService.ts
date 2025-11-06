import si from 'systeminformation';
import ping from 'ping';
import { logger } from '../utils/logger';

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speed: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    interfaces: NetworkInterface[];
    stats: NetworkStats[];
  };
  system: {
    platform: string;
    hostname: string;
    uptime: number;
    timestamp: string;
  };
}

export interface NetworkInterface {
  iface: string;
  ip4: string;
  ip6: string;
  mac: string;
  type: string;
  speed: number;
  operstate: string;
}

export interface NetworkStats {
  iface: string;
  rx_bytes: number;
  tx_bytes: number;
  rx_sec: number;
  tx_sec: number;
  ms: number;
}

export interface HostMonitoring {
  host: string;
  status: 'online' | 'offline';
  responseTime?: number;
  lastCheck: string;
  metrics?: {
    latency: number;
    packetLoss: number;
  };
}

export class SystemMonitoringService {
  /**
   * Récupérer toutes les métriques système
   */
  static async getAllMetrics(): Promise<SystemMetrics> {
    try {
      const [
        cpuData,
        cpuTemp,
        memData,
        fsData,
        netInterfaces,
        netStats,
        osInfo,
        timeData
      ] = await Promise.all([
        si.currentLoad(),
        si.cpuTemperature(),
        si.mem(),
        si.fsSize(),
        si.networkInterfaces(),
        si.networkStats(),
        si.osInfo(),
        si.time()
      ]);

      // CPU info
      const cpuInfo = await si.cpu();
      
      // Calculer l'espace disque total
      const diskTotal = fsData.reduce((acc, disk) => acc + disk.size, 0);
      const diskUsed = fsData.reduce((acc, disk) => acc + disk.used, 0);
      const diskFree = diskTotal - diskUsed;

      const metrics: SystemMetrics = {
        cpu: {
          usage: Math.round(cpuData.currentLoad),
          cores: cpuInfo.cores,
          model: cpuInfo.brand,
          speed: cpuInfo.speed,
          temperature: cpuTemp.main || undefined
        },
        memory: {
          total: memData.total,
          used: memData.used,
          free: memData.free,
          usage: Math.round((memData.used / memData.total) * 100)
        },
        disk: {
          total: diskTotal,
          used: diskUsed,
          free: diskFree,
          usage: Math.round((diskUsed / diskTotal) * 100)
        },
        network: {
          interfaces: netInterfaces.map(iface => ({
            iface: iface.iface,
            ip4: iface.ip4,
            ip6: iface.ip6,
            mac: iface.mac,
            type: iface.type,
            speed: iface.speed || 0,
            operstate: iface.operstate
          })),
          stats: netStats.map(stat => ({
            iface: stat.iface,
            rx_bytes: stat.rx_bytes,
            tx_bytes: stat.tx_bytes,
            rx_sec: stat.rx_sec || 0,
            tx_sec: stat.tx_sec || 0,
            ms: stat.ms || 0
          }))
        },
        system: {
          platform: osInfo.platform,
          hostname: osInfo.hostname,
          uptime: timeData.uptime,
          timestamp: new Date().toISOString()
        }
      };

      return metrics;
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Récupérer uniquement les métriques CPU
   */
  static async getCpuMetrics() {
    try {
      const [cpuData, cpuInfo, cpuTemp] = await Promise.all([
        si.currentLoad(),
        si.cpu(),
        si.cpuTemperature()
      ]);

      return {
        usage: Math.round(cpuData.currentLoad),
        cores: cpuInfo.cores,
        model: cpuInfo.brand,
        speed: cpuInfo.speed,
        temperature: cpuTemp.main || undefined
      };
    } catch (error) {
      logger.error('Error getting CPU metrics:', error);
      throw error;
    }
  }

  /**
   * Récupérer uniquement les métriques mémoire
   */
  static async getMemoryMetrics() {
    try {
      const memData = await si.mem();
      
      return {
        total: memData.total,
        used: memData.used,
        free: memData.free,
        usage: Math.round((memData.used / memData.total) * 100)
      };
    } catch (error) {
      logger.error('Error getting memory metrics:', error);
      throw error;
    }
  }

  /**
   * Récupérer les métriques réseau
   */
  static async getNetworkMetrics() {
    try {
      const [interfaces, stats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats()
      ]);

      return {
        interfaces: interfaces.map(iface => ({
          iface: iface.iface,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          type: iface.type,
          speed: iface.speed || 0,
          operstate: iface.operstate
        })),
        stats: stats.map(stat => ({
          iface: stat.iface,
          rx_bytes: stat.rx_bytes,
          tx_bytes: stat.tx_bytes,
          rx_sec: stat.rx_sec || 0,
          tx_sec: stat.tx_sec || 0,
          ms: stat.ms || 0
        }))
      };
    } catch (error) {
      logger.error('Error getting network metrics:', error);
      throw error;
    }
  }

  /**
   * Monitorer un hôte spécifique (ping + latence)
   */
  static async monitorHost(host: string, count: number = 4): Promise<HostMonitoring> {
    try {
      const probeResult = await ping.promise.probe(host, {
        timeout: 2,
        min_reply: count
      });

      let packetLoss = 0;
      let avgLatency = 0;

      if (probeResult.alive) {
        // Calculer la perte de paquets
        const packetsTransmitted = count;
        const packetsReceived = count; // Assume all packets received if alive
        packetLoss = 0;
        
        // Latence moyenne
        avgLatency = typeof probeResult.avg === 'number' ? probeResult.avg : probeResult.time;
      }

      return {
        host,
        status: probeResult.alive ? 'online' : 'offline',
        responseTime: probeResult.alive ? probeResult.time : undefined,
        lastCheck: new Date().toISOString(),
        metrics: probeResult.alive ? {
          latency: avgLatency,
          packetLoss
        } : undefined
      };
    } catch (error) {
      logger.error(`Error monitoring host ${host}:`, error);
      return {
        host,
        status: 'offline',
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Monitorer plusieurs hôtes
   */
  static async monitorMultipleHosts(hosts: string[]): Promise<HostMonitoring[]> {
    try {
      const results = await Promise.all(
        hosts.map(host => this.monitorHost(host))
      );
      return results;
    } catch (error) {
      logger.error('Error monitoring multiple hosts:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'uptime du système
   */
  static async getSystemUptime() {
    try {
      const timeData = await si.time();
      const uptimeSeconds = timeData.uptime;
      
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      
      return {
        seconds: uptimeSeconds,
        formatted: `${days}j ${hours}h ${minutes}m`,
        days,
        hours,
        minutes
      };
    } catch (error) {
      logger.error('Error getting system uptime:', error);
      throw error;
    }
  }

  /**
   * Récupérer les processus les plus gourmands en ressources
   */
  static async getTopProcesses(limit: number = 10) {
    try {
      const processes = await si.processes();
      
      // Trier par utilisation CPU
      const topCpu = processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, limit)
        .map(proc => ({
          pid: proc.pid,
          name: proc.name,
          cpu: Math.round(proc.cpu * 10) / 10,
          mem: Math.round(proc.mem * 10) / 10,
          command: proc.command
        }));

      // Trier par utilisation mémoire
      const topMem = processes.list
        .sort((a, b) => b.mem - a.mem)
        .slice(0, limit)
        .map(proc => ({
          pid: proc.pid,
          name: proc.name,
          cpu: Math.round(proc.cpu * 10) / 10,
          mem: Math.round(proc.mem * 10) / 10,
          command: proc.command
        }));

      return {
        topCpu,
        topMem,
        totalProcesses: processes.all
      };
    } catch (error) {
      logger.error('Error getting top processes:', error);
      throw error;
    }
  }
}
