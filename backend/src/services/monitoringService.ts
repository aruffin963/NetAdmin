import * as snmp from 'net-snmp';
import { Client as SSHClient } from 'ssh2';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface DeviceMetrics {
  deviceId?: string;
  hostname?: string;
  dnsName?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  memoryTotal?: number;
  diskUsage?: number;
  diskTotal?: number;
  uptime?: number;
  status: 'online' | 'offline';
  responseTime: number;
  timestamp: Date;
  source: 'snmp' | 'ssh' | 'wmi' | 'ping' | 'local';
}

export interface DeviceConfig {
  id: string;
  ip: string;
  hostname: string;
  type: 'linux' | 'windows' | 'network' | 'unknown';
  snmpEnabled?: boolean;
  snmpVersion?: '1' | '2c' | '3';
  snmpCommunity?: string;
  sshEnabled?: boolean;
  sshUser?: string;
  sshPassword?: string;
  sshKey?: string;
  sshPort?: number;
  wmiEnabled?: boolean;
}

export class MonitoringService {
  /**
   * Détecter le type d'équipement via ping et bannière
   */
  static async detectDeviceType(ip: string): Promise<'linux' | 'windows' | 'network' | 'unknown'> {
    try {
      // Ping pour vérifier si l'hôte répond
      const isWindows = process.platform === 'win32';
      const pingCmd = isWindows ? `ping -n 1 ${ip}` : `ping -c 1 ${ip}`;
      
      try {
        await execAsync(pingCmd, { timeout: 3000 });
      } catch {
        return 'unknown';
      }

      // Essayer SSH pour détecter Linux
      try {
        const isLinux = await this.detectLinux(ip, '', '', 22);
        if (isLinux) return 'linux';
      } catch (e) {
        // SSH échoué, continuer
      }

      // Essayer SNMP pour détecter équipement réseau
      try {
        const isNetworkDevice = await this.detectSNMP(ip);
        if (isNetworkDevice) return 'network';
      } catch (e) {
        // SNMP échoué, continuer
      }

      // Essayer WMI pour Windows
      try {
        const isWindows = await this.detectWindows(ip);
        if (isWindows) return 'windows';
      } catch (e) {
        // WMI échoué
      }

      return 'unknown';
    } catch (error) {
      logger.error('Erreur lors de la détection du type d\'équipement:', error);
      return 'unknown';
    }
  }

  /**
   * Monitorer un équipement avec la meilleure méthode disponible
   */
  static async monitorDevice(config: DeviceConfig): Promise<DeviceMetrics> {
    const startTime = Date.now();

    try {
      // Résoudre le DNS en parallèle
      const dnsName = await this.resolveDNS(config.ip).catch(() => undefined);
      logger.info(`Monitoring ${config.ip} (type: ${config.type})`);

      // Vérifier si c'est localhost/127.0.0.1 - utiliser les métriques locales
      const isLocalhost = config.ip === '127.0.0.1' || config.ip === 'localhost' || config.ip === '::1';
      if (isLocalhost) {
        try {
          logger.info(`Collecte locale pour ${config.ip}`);
          const metrics = await this.getLocalMetrics();
          if (metrics) {
            logger.info(`✓ Métriques locales succès`, metrics);
            return {
              ...metrics,
              deviceId: config.id,
              hostname: config.hostname || metrics.hostname,
              dnsName,
              responseTime: Date.now() - startTime,
              source: 'local',
              timestamp: new Date(),
              status: 'online'
            };
          }
        } catch (e) {
          logger.warn(`✗ Métriques locales échouées:`, (e as Error).message);
        }
      }

      // 1. Essayer SNMP pour équipements réseau
      if (config.snmpEnabled || config.type === 'network') {
        try {
          logger.info(`Tentative SNMP pour ${config.ip}`);
          const metrics = await this.getMetricsSNMP(
            config.ip,
            config.snmpCommunity || 'public',
            config.snmpVersion || '2c'
          );
          if (metrics) {
            logger.info(`✓ SNMP succès pour ${config.ip}`, metrics);
            return {
              ...metrics,
              deviceId: config.id,
              dnsName,
              responseTime: Date.now() - startTime,
              source: 'snmp',
              timestamp: new Date(),
              status: metrics.status || 'online'
            };
          }
        } catch (e) {
          logger.warn(`✗ SNMP échoué pour ${config.ip}:`, (e as Error).message);
        }
      }

      // 2. Essayer SSH pour Linux
      if (config.sshEnabled || config.type === 'linux') {
        try {
          logger.info(`Tentative SSH pour ${config.ip}`);
          const metrics = await this.getMetricsSSH(
            config.ip,
            config.sshUser || 'root',
            config.sshPassword || '',
            config.sshKey || '',
            config.sshPort || 22
          );
          if (metrics) {
            logger.info(`✓ SSH succès pour ${config.ip}`, metrics);
            return {
              ...metrics,
              deviceId: config.id,
              dnsName,
              responseTime: Date.now() - startTime,
              source: 'ssh',
              timestamp: new Date(),
              status: metrics.status || 'online'
            };
          }
        } catch (e) {
          logger.warn(`✗ SSH échoué pour ${config.ip}:`, (e as Error).message);
        }
      }

      // 3. Essayer WMI pour Windows
      if (config.wmiEnabled || config.type === 'windows') {
        try {
          logger.info(`Tentative WMI pour ${config.ip}`);
          const metrics = await this.getMetricsWMI(config.ip);
          if (metrics) {
            logger.info(`✓ WMI succès pour ${config.ip}`, metrics);
            return {
              ...metrics,
              deviceId: config.id,
              dnsName,
              responseTime: Date.now() - startTime,
              source: 'wmi',
              timestamp: new Date(),
              status: metrics.status || 'online'
            };
          }
        } catch (e) {
          logger.warn(`✗ WMI échoué pour ${config.ip}:`, (e as Error).message);
        }
      }

      // 4. Fallback: juste vérifier le ping
      logger.info(`Fallback: Ping uniquement pour ${config.ip}`);
      const isPing = await this.pingDevice(config.ip);
      const result: DeviceMetrics = {
        hostname: config.hostname || 'unknown',
        dnsName,
        status: isPing ? 'online' : 'offline',
        responseTime: Date.now() - startTime,
        source: 'ping',
        timestamp: new Date()
      };
      logger.info(`Résultat final pour ${config.ip}:`, result);
      return result;
    } catch (error) {
      logger.error(`Erreur monitoring ${config.ip}:`, error);
      return {
        hostname: config.hostname,
        status: 'offline',
        responseTime: Date.now() - startTime,
        source: 'ping',
        timestamp: new Date()
      };
    }
  }

  /**
   * Récupérer métriques du système local
   */
  static async getLocalMetrics(): Promise<Partial<DeviceMetrics> | null> {
    try {
      const os = require('os');
      
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const hostname = os.hostname();

      // Calculer CPU usage (moyenne des cores)
      let totalIdle = 0, totalTick = 0;
      cpus.forEach((cpu: any) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);

      // Récupérer uptime
      const uptime = os.uptime();

      // Essayer récupérer info disque
      let diskUsage = 0, diskTotal = 0;
      try {
        const { stdout } = await execAsync(
          process.platform === 'win32' 
            ? 'wmic logicaldisk get size,freespace /format:csv' 
            : 'df -B1 / | tail -1'
        );
        
        if (process.platform === 'win32') {
          const lines = stdout.split('\n');
          if (lines.length > 1) {
            const values = lines[1].split(',');
            diskTotal = parseInt(values[1]) || 0;
            diskUsage = (diskTotal - parseInt(values[0])) || 0;
          }
        } else {
          const parts = stdout.trim().split(/\s+/);
          diskTotal = parseInt(parts[1]) || 0;
          diskUsage = parseInt(parts[2]) || 0;
        }
      } catch (e) {
        logger.warn('Impossible de récupérer les infos disque:', (e as Error).message);
      }

      return {
        hostname,
        cpuUsage,
        memoryUsage: usedMem,
        memoryTotal: totalMem,
        diskUsage,
        diskTotal,
        uptime: Math.floor(uptime),
        status: 'online'
      };
    } catch (error) {
      logger.error('Erreur collecte métriques locales:', error);
      return null;
    }
  }

  /**
   * Récupérer métriques via SNMP
   */
  static async getMetricsSNMP(
    ip: string,
    community: string,
    version: '1' | '2c' | '3'
  ): Promise<Partial<DeviceMetrics> | null> {
    return new Promise((resolve, reject) => {
      const session = snmp.createSession(ip, community, { version: snmp.Version2c });

      const oids = [
        '1.3.6.1.2.1.1.5.0', // sysName (hostname)
        '1.3.6.1.2.1.25.3.2.1.5.1', // CPU usage
        '1.3.6.1.2.1.25.2.3.1.5.1', // Memory Total
        '1.3.6.1.2.1.25.2.3.1.6.1', // Memory Used
        '1.3.6.1.2.1.1.3.0', // Uptime
        '1.3.6.1.2.1.25.2.3.1.5.2', // Disk Total
        '1.3.6.1.2.1.25.2.3.1.6.2'  // Disk Used
      ];

      session.get(oids, (error: any, varbinds: any) => {
        if (error) {
          session.close();
          reject(error);
          return;
        }

        try {
          const result: Partial<DeviceMetrics> = {
            hostname: varbinds[0]?.value?.toString() || 'unknown',
            cpuUsage: parseInt(varbinds[1]?.value?.toString() || '0'),
            memoryTotal: parseInt(varbinds[2]?.value?.toString() || '0') * 1024, // Convertir en bytes
            memoryUsage: parseInt(varbinds[3]?.value?.toString() || '0') * 1024,
            uptime: parseInt(varbinds[4]?.value?.toString() || '0'),
            diskTotal: parseInt(varbinds[5]?.value?.toString() || '0') * 1024,
            diskUsage: parseInt(varbinds[6]?.value?.toString() || '0') * 1024,
            status: 'online'
          };
          session.close();
          resolve(result);
        } catch (e) {
          session.close();
          reject(e);
        }
      });

      setTimeout(() => {
        session.close();
        reject(new Error('SNMP timeout'));
      }, 5000);
    });
  }

  /**
   * Récupérer métriques via SSH (Linux)
   */
  static async getMetricsSSH(
    ip: string,
    user: string,
    password: string,
    privateKey: string,
    port: number
  ): Promise<Partial<DeviceMetrics> | null> {
    return new Promise((resolve, reject) => {
      const conn = new SSHClient();

      const connConfig: any = {
        host: ip,
        port,
        username: user,
        readyTimeout: 5000
      };

      if (privateKey) {
        connConfig.privateKey = privateKey;
      } else if (password) {
        connConfig.password = password;
      }

      conn.on('ready', () => {
        conn.shell((err: any, stream: any) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }

          let cpuOutput = '';
          let memOutput = '';
          let diskOutput = '';
          let hostnameOutput = '';
          let uptimeOutput = '';

          stream.on('close', () => {
            try {
              const metrics = this.parseLinuxMetrics(cpuOutput, memOutput, diskOutput, hostnameOutput, uptimeOutput);
              resolve(metrics);
            } catch (e) {
              reject(e);
            }
            conn.end();
          });

          stream.write('hostname\n');
          stream.write('top -bn1 | grep "Cpu(s)"\n');
          stream.write('free | grep Mem\n');
          stream.write('df -B1 / | tail -1\n');
          stream.write('uptime\n');
          stream.write('exit\n');

          stream.on('data', (chunk: Buffer) => {
            const output = chunk.toString();
            if (output.includes('%Cpu')) cpuOutput = output;
            if (output.includes('Mem:')) memOutput = output;
            if (output.includes('%')) diskOutput = output;
            if (output.includes('load average')) uptimeOutput = output;
            if (!output.includes('>') && !output.includes('%') && !output.includes('Mem') && output.trim().length < 50) {
              hostnameOutput = output.trim();
            }
          });
        });
      });

      conn.on('error', (err: any) => reject(err));
      conn.connect(connConfig);

      setTimeout(() => {
        conn.end();
        reject(new Error('SSH timeout'));
      }, 10000);
    });
  }

  /**
   * Récupérer métriques via WMI (Windows)
   */
  static async getMetricsWMI(ip: string): Promise<Partial<DeviceMetrics> | null> {
    try {
      const { stdout } = await execAsync(
        `wmic /node:${ip} os get TotalVisibleMemorySize,FreePhysicalMemory,SystemUpTime /format:csv`,
        { timeout: 10000 }
      );

      const lines = stdout.split('\n');
      if (lines.length < 2) return null;

      const values = lines[1].split(',');
      const totalMem = parseInt(values[0]) || 0;
      const freeMem = parseInt(values[1]) || 0;
      const usedMem = totalMem - freeMem;

      // Récupérer CPU via WMI
      const cpuOutput = await execAsync(
        `wmic /node:${ip} cpu get LoadPercentage /format:csv`,
        { timeout: 10000 }
      );
      const cpuValue = parseInt(cpuOutput.stdout.split(',')[1]) || 0;

      return {
        hostname: ip,
        cpuUsage: cpuValue,
        memoryTotal: totalMem * 1024, // Convertir KB en bytes
        memoryUsage: usedMem * 1024,
        status: 'online'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Résoudre le nom DNS d'une adresse IP
   */
  private static resolveDNS(ip: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const dns = require('dns').promises;
      dns.reverse(ip)
        .then((hostnames: string[]) => resolve(hostnames[0]))
        .catch(() => resolve(undefined));
    });
  }

  /**
   * Vérifier disponibilité via ping
   */
  static async pingDevice(ip: string): Promise<boolean> {
    try {
      const isWindows = process.platform === 'win32';
      const pingCmd = isWindows ? `ping -n 1 -w 2000 ${ip}` : `ping -c 1 -W 2000 ${ip}`;
      
      await execAsync(pingCmd, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Détecter si le device supporte SNMP
   */
  private static async detectSNMP(ip: string): Promise<boolean> {
    return new Promise((resolve) => {
      const session = snmp.createSession(ip, 'public', { version: snmp.Version2c });
      let resolved = false;
      
      session.get(['1.3.6.1.2.1.1.1.0'], (error: any) => {
        if (!resolved) {
          resolved = true;
          try {
            session.close();
          } catch (e) {
            // Ignore errors when closing
          }
          resolve(!error);
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try {
            session.close();
          } catch (e) {
            // Ignore errors when closing
          }
          resolve(false);
        }
      }, 3000);
    });
  }

  /**
   * Détecter si le device est Linux
   */
  private static async detectLinux(
    ip: string,
    user: string,
    password: string,
    port: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const conn = new SSHClient();

      conn.on('ready', () => {
        conn.end();
        resolve(true);
      });

      conn.on('error', () => {
        resolve(false);
      });

      conn.connect({
        host: ip,
        port,
        username: user || 'root',
        password: password || 'root',
        readyTimeout: 3000
      });

      setTimeout(() => {
        conn.end();
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Détecter si le device est Windows
   */
  private static async detectWindows(ip: string): Promise<boolean> {
    try {
      await execAsync(`wmic /node:${ip} os get name`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parser métriques Linux
   */
  private static parseLinuxMetrics(
    cpuOutput: string,
    memOutput: string,
    diskOutput: string,
    hostnameOutput: string,
    uptimeOutput: string
  ): Partial<DeviceMetrics> {
    const cpuMatch = cpuOutput.match(/(\d+\.\d+)%us/);
    const memMatch = memOutput.match(/(\d+)\s+(\d+)\s+(\d+)/);
    const diskMatch = diskOutput.match(/(\d+)\s+(\d+)\s+(\d+)/);
    
    return {
      hostname: hostnameOutput.trim() || 'unknown',
      cpuUsage: cpuMatch ? parseFloat(cpuMatch[1]) : 0,
      memoryUsage: memMatch ? parseInt(memMatch[2]) * 1024 * 1024 : 0, // MB to bytes
      memoryTotal: memMatch ? parseInt(memMatch[1]) * 1024 * 1024 : 0,
      diskUsage: diskMatch ? parseInt(diskMatch[2]) : 0,
      diskTotal: diskMatch ? parseInt(diskMatch[1]) : 0,
      status: 'online'
    };
  }
}

export default MonitoringService;
