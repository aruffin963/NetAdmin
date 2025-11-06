import ping from 'ping';
import { logger } from '../utils/logger';

export interface ScanResult {
  ip: string;
  status: 'online' | 'offline';
  responseTime?: number;
  error?: string;
}

export class NetworkScanService {
  /**
   * Scanner un sous-réseau et retourner les hôtes actifs
   */
  static async scanSubnet(networkCIDR: string): Promise<ScanResult[]> {
    try {
      const { baseIP, hosts } = this.parseSubnet(networkCIDR);
      const results: ScanResult[] = [];

      logger.info(`Starting network scan for ${networkCIDR}`);
      
      // Scanner chaque IP du sous-réseau
      const scanPromises = hosts.map(async (hostNumber) => {
        const ip = `${baseIP}.${hostNumber}`;
        try {
          const result = await this.pingHost(ip);
          return result;
        } catch (error) {
          return {
            ip,
            status: 'offline' as const,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      // Attendre tous les pings avec un timeout global
      const scanResults = await Promise.allSettled(scanPromises);
      
      scanResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });

      logger.info(`Network scan completed: ${results.filter(r => r.status === 'online').length}/${results.length} hosts online`);
      
      return results.sort((a, b) => {
        const aNum = parseInt(a.ip.split('.').pop() || '0');
        const bNum = parseInt(b.ip.split('.').pop() || '0');
        return aNum - bNum;
      });
    } catch (error) {
      logger.error('Error scanning network:', error);
      throw error;
    }
  }

  /**
   * Ping une adresse IP unique
   */
  static async pingHost(ip: string, timeout: number = 2): Promise<ScanResult> {
    try {
      const res = await ping.promise.probe(ip, {
        timeout,
        min_reply: 1
      });

      return {
        ip,
        status: res.alive ? 'online' : 'offline',
        responseTime: res.alive ? parseFloat(res.time.toString()) : undefined
      };
    } catch (error) {
      logger.error(`Error pinging ${ip}:`, error);
      return {
        ip,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Ping failed'
      };
    }
  }

  /**
   * Parser un sous-réseau CIDR et retourner la liste des hôtes à scanner
   */
  private static parseSubnet(networkCIDR: string): { baseIP: string; hosts: number[] } {
    const [ipAddress, cidrStr] = networkCIDR.split('/');
    const cidr = parseInt(cidrStr);

    if (!ipAddress || !cidr || cidr < 0 || cidr > 32) {
      throw new Error('Invalid CIDR notation');
    }

    // Calculer le nombre d'hôtes disponibles
    const hostBits = 32 - cidr;
    const totalHosts = Math.pow(2, hostBits);

    // Limiter le scan pour éviter de surcharger (max 254 hôtes pour un /24)
    if (totalHosts > 256) {
      throw new Error('Subnet too large. Maximum /24 (254 hosts) supported for scanning');
    }

    // Extraire l'adresse de base (première partie de l'IP)
    const parts = ipAddress.split('.');
    const baseIP = parts.slice(0, 3).join('.');
    const startOctet = parseInt(parts[3]);

    // Générer la liste des hôtes à scanner (exclure adresse réseau et broadcast)
    const hosts: number[] = [];
    const maxHosts = Math.min(totalHosts - 2, 254); // -2 pour exclure réseau et broadcast
    
    for (let i = 1; i <= maxHosts; i++) {
      const hostNumber = startOctet + i - 1;
      if (hostNumber > 0 && hostNumber < 255) {
        hosts.push(hostNumber);
      }
    }

    return { baseIP, hosts };
  }

  /**
   * Vérifier si une adresse IP est valide
   */
  static isValidIP(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255 && part === num.toString();
    });
  }

  /**
   * Scanner une liste spécifique d'IPs
   */
  static async scanIPList(ips: string[]): Promise<ScanResult[]> {
    logger.info(`Scanning ${ips.length} specific IP addresses`);
    
    const scanPromises = ips.map(ip => {
      if (!this.isValidIP(ip)) {
        return Promise.resolve({
          ip,
          status: 'offline' as const,
          error: 'Invalid IP address'
        });
      }
      return this.pingHost(ip);
    });

    const results = await Promise.allSettled(scanPromises);
    
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<ScanResult>).value);
  }
}
