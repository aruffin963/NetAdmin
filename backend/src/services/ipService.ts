/**
 * Services utilitaires pour la gestion IP et calculs réseau
 * Fonctions pour validation, conversion CIDR, calculs de sous-réseaux
 */

export interface NetworkCalculation {
  network: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
  networkClass: 'A' | 'B' | 'C' | 'D' | 'E' | 'Private' | 'Loopback';
}

export interface IpValidationResult {
  isValid: boolean;
  type: 'ipv4' | 'ipv6' | 'invalid';
  isPrivate: boolean;
  isLoopback: boolean;
  isMulticast: boolean;
  errors: string[];
}

export interface CidrValidationResult {
  isValid: boolean;
  network: string;
  prefix: number;
  errors: string[];
}

export class IpService {
  
  /**
   * Valide une adresse IP
   */
  static validateIpAddress(ip: string): IpValidationResult {
    const result: IpValidationResult = {
      isValid: false,
      type: 'invalid',
      isPrivate: false,
      isLoopback: false,
      isMulticast: false,
      errors: []
    };

    if (!ip || typeof ip !== 'string') {
      result.errors.push('Adresse IP requise');
      return result;
    }

    // Validation IPv4
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = ip.match(ipv4Regex);

    if (ipv4Match) {
      const octets = ipv4Match.slice(1).map(Number);
      
      // Vérifier que chaque octet est entre 0 et 255
      if (octets.every(octet => octet >= 0 && octet <= 255)) {
        result.isValid = true;
        result.type = 'ipv4';
        
        // Déterminer le type d'adresse
        const firstOctet = octets[0];
        const secondOctet = octets[1];
        
        // Adresses privées (RFC 1918)
        if (
          (firstOctet === 10) || // 10.0.0.0/8
          (firstOctet === 172 && typeof secondOctet === 'number' && secondOctet >= 16 && secondOctet <= 31) || // 172.16.0.0/12
          (firstOctet === 192 && secondOctet === 168) // 192.168.0.0/16
        ) {
          result.isPrivate = true;
        }
        
        // Adresse de loopback
        if (firstOctet === 127) {
          result.isLoopback = true;
        }
        
        // Adresses multicast (224.0.0.0/4)
        if (typeof firstOctet === 'number' && firstOctet >= 224 && firstOctet <= 239) {
          result.isMulticast = true;
        }
      } else {
        result.errors.push('Les octets doivent être entre 0 et 255');
      }
    } else {
      // Validation IPv6 basique
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      if (ipv6Regex.test(ip)) {
        result.isValid = true;
        result.type = 'ipv6';
      } else {
        result.errors.push('Format d\'adresse IP invalide');
      }
    }

    return result;
  }

  /**
   * Valide une notation CIDR
   */
  static validateCidr(cidr: string): CidrValidationResult {
    const result: CidrValidationResult = {
      isValid: false,
      network: '',
      prefix: 0,
      errors: []
    };

    if (!cidr || typeof cidr !== 'string') {
      result.errors.push('Notation CIDR requise');
      return result;
    }

    const cidrRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/;
    const match = cidr.match(cidrRegex);

    if (!match) {
      result.errors.push('Format CIDR invalide (ex: 192.168.1.0/24)');
      return result;
    }

    const [, network, prefixStr] = match;
    
    if (!network || !prefixStr) {
      result.errors.push('Format CIDR invalide');
      return result;
    }
    
    const prefix = parseInt(prefixStr);

    // Valider l'adresse réseau
    const ipValidation = this.validateIpAddress(network);
    if (!ipValidation.isValid) {
      result.errors.push('Adresse réseau invalide');
      return result;
    }

    // Valider le préfixe
    if (prefix < 0 || prefix > 32) {
      result.errors.push('Le préfixe doit être entre 0 et 32');
      return result;
    }

    // Vérifier que l'adresse est bien une adresse réseau
    const networkCalculation = this.calculateNetwork(cidr);
    if (networkCalculation && network !== networkCalculation.network) {
      result.errors.push('L\'adresse doit être une adresse réseau valide');
      return result;
    }

    result.isValid = true;
    result.network = network;
    result.prefix = prefix;

    return result;
  }

  /**
   * Calcule les informations d'un réseau à partir d'une notation CIDR
   */
  static calculateNetwork(cidr: string): NetworkCalculation | null {
    const validation = this.validateCidr(cidr);
    if (!validation.isValid) {
      return null;
    }

    const [networkIp, prefixStr] = cidr.split('/');
    
    if (!networkIp || !prefixStr) {
      return null;
    }
    
    const prefix = parseInt(prefixStr);
    
    // Convertir l'IP en nombre 32 bits
    const ipToNumber = (ip: string): number => {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    };

    // Convertir un nombre en IP
    const numberToIp = (num: number): string => {
      return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
    };

    const networkNumber = ipToNumber(networkIp);
    const hostBits = 32 - prefix;
    const subnetMask = ((0xFFFFFFFF << hostBits) >>> 0);
    const wildcardMask = ~subnetMask >>> 0;
    
    const networkAddress = (networkNumber & subnetMask) >>> 0;
    const broadcastAddress = (networkAddress | wildcardMask) >>> 0;
    
    const totalHosts = Math.pow(2, hostBits);
    const usableHosts = hostBits > 1 ? totalHosts - 2 : (hostBits === 1 ? 0 : 1);
    
    const firstUsable = hostBits > 1 ? numberToIp(networkAddress + 1) : numberToIp(networkAddress);
    const lastUsable = hostBits > 1 ? numberToIp(broadcastAddress - 1) : numberToIp(networkAddress);

    // Déterminer la classe réseau
    const firstOctet = (networkAddress >>> 24) & 255;
    let networkClass: NetworkCalculation['networkClass'];
    
    if (firstOctet >= 1 && firstOctet <= 126) networkClass = 'A';
    else if (firstOctet >= 128 && firstOctet <= 191) networkClass = 'B';
    else if (firstOctet >= 192 && firstOctet <= 223) networkClass = 'C';
    else if (firstOctet >= 224 && firstOctet <= 239) networkClass = 'D';
    else if (firstOctet >= 240 && firstOctet <= 255) networkClass = 'E';
    else if (firstOctet === 10 || (firstOctet === 172) || (firstOctet === 192)) networkClass = 'Private';
    else if (firstOctet === 127) networkClass = 'Loopback';
    else networkClass = 'C';

    return {
      network: numberToIp(networkAddress),
      broadcast: numberToIp(broadcastAddress),
      firstUsable,
      lastUsable,
      totalHosts,
      usableHosts,
      subnetMask: numberToIp(subnetMask),
      wildcardMask: numberToIp(wildcardMask),
      networkClass
    };
  }

  /**
   * Vérifie si deux réseaux CIDR se chevauchent
   */
  static networksOverlap(cidr1: string, cidr2: string): boolean {
    const calc1 = this.calculateNetwork(cidr1);
    const calc2 = this.calculateNetwork(cidr2);
    
    if (!calc1 || !calc2) return false;

    const ipToNumber = (ip: string): number => {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    };

    const net1Start = ipToNumber(calc1.network);
    const net1End = ipToNumber(calc1.broadcast);
    const net2Start = ipToNumber(calc2.network);
    const net2End = ipToNumber(calc2.broadcast);

    return !(net1End < net2Start || net2End < net1Start);
  }

  /**
   * Vérifie si une IP appartient à un réseau CIDR
   */
  static ipInNetwork(ip: string, cidr: string): boolean {
    const ipValidation = this.validateIpAddress(ip);
    const networkCalculation = this.calculateNetwork(cidr);
    
    if (!ipValidation.isValid || !networkCalculation) {
      return false;
    }

    const ipToNumber = (ipStr: string): number => {
      return ipStr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    };

    const ipNumber = ipToNumber(ip);
    const networkStart = ipToNumber(networkCalculation.network);
    const networkEnd = ipToNumber(networkCalculation.broadcast);

    return ipNumber >= networkStart && ipNumber <= networkEnd;
  }

  /**
   * Génère la liste des adresses IP disponibles dans un réseau
   */
  static generateIpList(cidr: string, includeNetworkAndBroadcast: boolean = false): string[] {
    const networkCalculation = this.calculateNetwork(cidr);
    if (!networkCalculation) return [];

    const ipToNumber = (ip: string): number => {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    };

    const numberToIp = (num: number): string => {
      return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
    };

    const startIp = ipToNumber(includeNetworkAndBroadcast ? networkCalculation.network : networkCalculation.firstUsable);
    const endIp = ipToNumber(includeNetworkAndBroadcast ? networkCalculation.broadcast : networkCalculation.lastUsable);

    const ips: string[] = [];
    for (let i = startIp; i <= endIp; i++) {
      ips.push(numberToIp(i));
    }

    return ips;
  }

  /**
   * Suggère des sous-réseaux pour diviser un réseau principal
   */
  static suggestSubnets(parentCidr: string, numberOfSubnets: number): string[] {
    const parentCalc = this.calculateNetwork(parentCidr);
    if (!parentCalc) return [];

    const [, parentPrefixStr] = parentCidr.split('/');
    
    if (!parentPrefixStr) {
      return [];
    }
    
    const parentPrefix = parseInt(parentPrefixStr);

    // Calculer le nombre de bits nécessaires pour les sous-réseaux
    const bitsNeeded = Math.ceil(Math.log2(numberOfSubnets));
    const newPrefix = parentPrefix + bitsNeeded;

    if (newPrefix > 30) {
      return []; // Trop de division, pas assez d'adresses hôtes
    }

    const ipToNumber = (ip: string): number => {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    };

    const numberToIp = (num: number): string => {
      return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
    };

    const parentNetworkNumber = ipToNumber(parentCalc.network);
    const subnetSize = Math.pow(2, 32 - newPrefix);
    
    const subnets: string[] = [];
    for (let i = 0; i < numberOfSubnets; i++) {
      const subnetNetwork = parentNetworkNumber + (i * subnetSize);
      subnets.push(`${numberToIp(subnetNetwork)}/${newPrefix}`);
    }

    return subnets;
  }

  /**
   * Trouve la prochaine adresse IP disponible dans un pool
   */
  static findNextAvailableIp(cidr: string, usedIps: string[]): string | null {
    const availableIps = this.generateIpList(cidr, false);
    
    for (const ip of availableIps) {
      if (!usedIps.includes(ip)) {
        return ip;
      }
    }
    
    return null; // Aucune IP disponible
  }
}