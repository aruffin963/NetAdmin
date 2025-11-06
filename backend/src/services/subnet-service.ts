import { logger } from '../utils/logger';
import {
  Subnet,
  NetworkPlan,
  VLSMCalculation,
  VLSMResult,
  SegmentationRequirement,
  AutoCalculationResult,
  IPAddress,
  NetworkValidation,
  ValidationError,
  ValidationWarning,
  IPAnalysis,
  IPClass,
  SubnetUsage
} from '@shared/types/subnetting';

// Interface locale pour les résultats de calcul
interface IPCalculationResult {
  networkAddress: string;
  subnetMask: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  wildcard: string;
  cidr: number;
  networkClass: 'A' | 'B' | 'C' | 'D' | 'E';
  isPrivate: boolean;
}

export class SubnetService {
  /**
   * Convertit une adresse IP en nombre 32-bit
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * Convertit un nombre 32-bit en adresse IP
   */
  private numberToIp(num: number): string {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');
  }

  /**
   * Calcule le masque de sous-réseau à partir du CIDR
   */
  private cidrToMask(cidr: number): string {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return this.numberToIp(mask);
  }

  /**
   * Calcule l'adresse réseau
   */
  private getNetworkAddress(ip: string, cidr: number): string {
    const ipNum = this.ipToNumber(ip);
    const maskNum = (0xffffffff << (32 - cidr)) >>> 0;
    const networkNum = (ipNum & maskNum) >>> 0;
    return this.numberToIp(networkNum);
  }

  /**
   * Calcule l'adresse de broadcast
   */
  private getBroadcastAddress(networkIp: string, cidr: number): string {
    const networkNum = this.ipToNumber(networkIp);
    const hostBits = 32 - cidr;
    const broadcastNum = (networkNum | ((1 << hostBits) - 1)) >>> 0;
    return this.numberToIp(broadcastNum);
  }

  /**
   * Valide une adresse IP
   */
  private isValidIPv4(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255 && part === num.toString();
    });
  }

  /**
   * Valide un CIDR
   */
  private isValidCIDR(cidr: number): boolean {
    return cidr >= 0 && cidr <= 32;
  }

  /**
   * Calcule les informations d'un sous-réseau
   */
  public calculateSubnet(ip: string, cidr: number): IPCalculationResult {
    try {
      if (!this.isValidIPv4(ip)) {
        throw new Error('Adresse IP invalide');
      }
      
      if (!this.isValidCIDR(cidr)) {
        throw new Error('CIDR invalide (doit être entre 0 et 32)');
      }

      const networkAddress = this.getNetworkAddress(ip, cidr);
      const subnetMask = this.cidrToMask(cidr);
      const broadcastAddress = this.getBroadcastAddress(networkAddress, cidr);
      
      const totalHosts = Math.pow(2, 32 - cidr);
      const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0; // Moins réseau et broadcast
      
      const firstUsableIp = cidr < 31 ? 
        this.numberToIp(this.ipToNumber(networkAddress) + 1) : 
        networkAddress;
      
      const lastUsableIp = cidr < 31 ? 
        this.numberToIp(this.ipToNumber(broadcastAddress) - 1) : 
        broadcastAddress;

      const wildcard = this.numberToIp(~this.ipToNumber(subnetMask) >>> 0);

      return {
        networkAddress,
        subnetMask,
        broadcastAddress,
        firstUsableIp,
        lastUsableIp,
        totalHosts,
        usableHosts,
        wildcard,
        cidr,
        networkClass: this.getNetworkClass(networkAddress),
        isPrivate: this.isPrivateIP(networkAddress)
      };
    } catch (error) {
      logger.error('Erreur lors du calcul de sous-réseau:', error);
      throw error;
    }
  }

  /**
   * Détermine la classe du réseau
   */
  private getNetworkClass(ip: string): 'A' | 'B' | 'C' | 'D' | 'E' {
    const parts = ip.split('.');
    const firstOctet = parts[0] ? parseInt(parts[0], 10) : 0;
    
    if (firstOctet <= 127) return 'A';
    if (firstOctet <= 191) return 'B';
    if (firstOctet <= 223) return 'C';
    if (firstOctet <= 239) return 'D';
    return 'E';
  }

  /**
   * Vérifie si l'IP est privée
   */
  private isPrivateIP(ip: string): boolean {
    const num = this.ipToNumber(ip);
    
    // 10.0.0.0/8
    if (num >= this.ipToNumber('10.0.0.0') && num <= this.ipToNumber('10.255.255.255')) {
      return true;
    }
    
    // 172.16.0.0/12
    if (num >= this.ipToNumber('172.16.0.0') && num <= this.ipToNumber('172.31.255.255')) {
      return true;
    }
    
    // 192.168.0.0/16
    if (num >= this.ipToNumber('192.168.0.0') && num <= this.ipToNumber('192.168.255.255')) {
      return true;
    }
    
    return false;
  }

  /**
   * Calcul VLSM (Variable Length Subnet Masking)
   */
  public calculateVLSM(networkIp: string, cidr: number, requirements: SegmentationRequirement[]): VLSMCalculation {
    try {
      // Trier les besoins par nombre d'hôtes décroissant
      const sortedRequirements = [...requirements].sort((a, b) => b.requiredHosts - a.requiredHosts);
      
      const results: VLSMResult[] = [];
      let currentNetwork = this.ipToNumber(networkIp);
      const originalNetworkNum = currentNetwork;
      const originalBroadcast = this.ipToNumber(this.getBroadcastAddress(networkIp, cidr));
      
      let totalRequiredHosts = 0;
      let totalAllocatedHosts = 0;
      
      for (const requirement of sortedRequirements) {
        totalRequiredHosts += requirement.requiredHosts;
        
        // Calculer le CIDR nécessaire
        const hostsNeeded = requirement.requiredHosts + 2; // +2 pour réseau et broadcast
        const bits = Math.ceil(Math.log2(hostsNeeded));
        const subnetCidr = 32 - bits;
        
        if (subnetCidr < cidr) {
          results.push({
            requirement,
            status: 'failed',
            reason: `Pas assez d'espace pour le sous-réseau ${requirement.name}`
          });
          continue;
        }
        
        // Vérifier si on dépasse l'espace disponible
        const subnetSize = Math.pow(2, bits);
        if (currentNetwork + subnetSize - 1 > originalBroadcast) {
          results.push({
            requirement,
            status: 'failed',
            reason: `Espace insuffisant pour le sous-réseau ${requirement.name}`
          });
          continue;
        }
        
        const subnetIp = this.numberToIp(currentNetwork);
        const calculation = this.calculateSubnet(subnetIp, subnetCidr);
        
        const subnet: Subnet = {
          id: `subnet-${requirement.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: requirement.name,
          network: calculation.networkAddress,
          cidr: subnetCidr,
          mask: calculation.subnetMask,
          wildcard: calculation.wildcard,
          broadcast: calculation.broadcastAddress,
          firstHost: calculation.firstUsableIp,
          lastHost: calculation.lastUsableIp,
          totalHosts: calculation.totalHosts,
          usableHosts: calculation.usableHosts,
          binaryNetwork: this.ipToBinary(calculation.networkAddress),
          binaryMask: this.ipToBinary(calculation.subnetMask),
          usage: {
            type: requirement.type,
            label: requirement.name,
            estimatedHosts: requirement.requiredHosts,
            securityLevel: requirement.securityLevel,
            priority: requirement.priority
          },
          ...(requirement.vlanId !== undefined && { vlanId: requirement.vlanId }),
          description: requirement.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        results.push({
          requirement,
          allocatedSubnet: subnet,
          status: 'allocated'
        });
        
        totalAllocatedHosts += subnet.usableHosts;
        currentNetwork += subnetSize;
      }
      
      // Calculer les statistiques
      const totalUsedSpace = currentNetwork - originalNetworkNum;
      const totalAvailableSpace = originalBroadcast - originalNetworkNum + 1;
      const wastedHosts = totalAvailableSpace - totalUsedSpace;
      const efficiency = (totalRequiredHosts / totalAllocatedHosts) * 100;
      
      return {
        baseNetwork: networkIp,
        baseCidr: cidr,
        requirements: sortedRequirements,
        results,
        summary: {
          totalRequiredHosts,
          totalAllocatedHosts,
          totalWastedHosts: wastedHosts,
          efficiency: parseFloat(efficiency.toFixed(2)),
          largestAvailableBlock: this.numberToIp(currentNetwork)
        }
      };
    } catch (error) {
      logger.error('Erreur lors du calcul VLSM:', error);
      throw error;
    }
  }

  /**
   * Convertit une IP en binaire
   */
  private ipToBinary(ip: string): string {
    return ip.split('.').map(octet => {
      return parseInt(octet, 10).toString(2).padStart(8, '0');
    }).join('.');
  }

  /**
   * Calcul automatique de segmentation
   */
  public autoCalculateSegmentation(networkIp: string, cidr: number, hostCounts: number[]): AutoCalculationResult {
    try {
      const requirements: SegmentationRequirement[] = hostCounts.map((count, index) => ({
        id: `auto-${index + 1}`,
        name: `Segment ${index + 1}`,
        type: 'custom',
        requiredHosts: count,
        securityLevel: 'medium',
        priority: index + 1,
        notes: `Segment automatique nécessitant ${count} hôtes`
      }));
      
      const vlsmResult = this.calculateVLSM(networkIp, cidr, requirements);
      const allocatedSubnets = vlsmResult.results
        .filter(r => r.status === 'allocated' && r.allocatedSubnet)
        .map(r => r.allocatedSubnet!);
      
      const unallocatedRequirements = vlsmResult.results
        .filter(r => r.status === 'failed')
        .map(r => r.requirement);

      return {
        success: unallocatedRequirements.length === 0,
        baseNetwork: networkIp,
        baseCidr: cidr,
        requirements,
        allocatedSubnets,
        unallocatedRequirements,
        wastedAddresses: vlsmResult.summary.totalWastedHosts,
        efficiency: vlsmResult.summary.efficiency,
        recommendations: this.generateRecommendations(vlsmResult),
        warnings: [],
        errors: vlsmResult.results.filter(r => r.status === 'failed').map(r => r.reason || '')
      };
    } catch (error) {
      logger.error('Erreur lors du calcul automatique:', error);
      throw error;
    }
  }

  /**
   * Génère des recommandations d'optimisation
   */
  private generateRecommendations(vlsmResult: VLSMCalculation): string[] {
    const recommendations: string[] = [];
    
    if (vlsmResult.summary.efficiency < 70) {
      recommendations.push('Efficacité faible - considérez un découpage différent');
    }
    
    if (vlsmResult.summary.totalWastedHosts > 1000) {
      recommendations.push('Beaucoup d\'adresses gaspillées - optimisez la taille des sous-réseaux');
    }
    
    if (vlsmResult.results.length > 10) {
      recommendations.push('Nombreux sous-réseaux - considérez une hiérarchie');
    }
    
    const allocatedSubnets = vlsmResult.results
      .filter(r => r.allocatedSubnet)
      .map(r => r.allocatedSubnet!);
    
    const smallSubnets = allocatedSubnets.filter(s => s.usableHosts < 10);
    if (smallSubnets.length > 0) {
      recommendations.push(`${smallSubnets.length} sous-réseaux très petits détectés`);
    }
    
    return recommendations;
  }

  /**
   * Valide une configuration réseau
   */
  public validateNetworkConfiguration(config: NetworkPlan): NetworkValidation {
    try {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      
      // Validation des sous-réseaux
      for (const subnet of config.subnets) {
        if (!this.isValidIPv4(subnet.network)) {
          errors.push({
            type: 'invalid_ip',
            message: `Adresse réseau invalide: ${subnet.network}`,
            subnet: subnet.name || subnet.id
          });
        }
        
        if (!this.isValidCIDR(subnet.cidr)) {
          errors.push({
            type: 'invalid_cidr',
            message: `CIDR invalide: ${subnet.cidr}`,
            subnet: subnet.name || subnet.id
          });
        }
        
        if (subnet.usage && subnet.usage.estimatedHosts > subnet.usableHosts) {
          warnings.push({
            type: 'efficiency',
            message: `Sous-réseau ${subnet.name || subnet.id} surpeuplé`,
            subnet: subnet.name || subnet.id,
            recommendation: 'Augmentez la taille du sous-réseau'
          });
        }
      }
      
      // Vérification des chevauchements
      for (let i = 0; i < config.subnets.length; i++) {
        for (let j = i + 1; j < config.subnets.length; j++) {
          const subnet1 = config.subnets[i];
          const subnet2 = config.subnets[j];
          if (subnet1 && subnet2 && this.subnetsOverlap(subnet1, subnet2)) {
            errors.push({
              type: 'overlap',
              message: `Chevauchement entre ${subnet1.name || subnet1.id} et ${subnet2.name || subnet2.id}`,
              subnet: subnet1.name || subnet1.id,
              conflictWith: subnet2.name || subnet2.id
            });
          }
        }
      }
      
      const isValid = errors.length === 0;
      
      return {
        isValid,
        errors,
        warnings,
        suggestions: this.generateSuggestions(config, warnings),
        conflicts: []
      };
    } catch (error) {
      logger.error('Erreur lors de la validation:', error);
      throw error;
    }
  }

  /**
   * Vérifie si deux sous-réseaux se chevauchent
   */
  private subnetsOverlap(subnet1: Subnet, subnet2: Subnet): boolean {
    const net1Start = this.ipToNumber(subnet1.network);
    const net1End = this.ipToNumber(subnet1.broadcast);
    const net2Start = this.ipToNumber(subnet2.network);
    const net2End = this.ipToNumber(subnet2.broadcast);
    
    return !(net1End < net2Start || net2End < net1Start);
  }

  /**
   * Génère des suggestions d'amélioration
   */
  private generateSuggestions(config: NetworkPlan, warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];
    
    if (warnings.length > 0) {
      suggestions.push('Considérez redimensionner les sous-réseaux surpeuplés');
    }
    
    const unusedSubnets = config.subnets.filter(s => 
      s.usage?.estimatedHosts === 0 || !s.usage
    );
    if (unusedSubnets.length > 0) {
      suggestions.push(`${unusedSubnets.length} sous-réseaux inutilisés peuvent être supprimés`);
    }
    
    return suggestions;
  }

  /**
   * Créer un template de sous-réseau
   */
  public createSubnetTemplate(name: string, description: string, cidr: number, tags: string[]) {
    return {
      id: `template-${Date.now()}`,
      name,
      description,
      defaultCidr: cidr,
      tags,
      configuration: {
        autoAssignGateway: true,
        autoAssignDns: false,
        allowDhcp: true,
        reservedIps: 5
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Calcul de la prochaine adresse IP disponible
   */
  public getNextAvailableIp(subnet: Subnet, allocatedIps: string[]): string | null {
    const firstUsable = this.ipToNumber(subnet.firstHost);
    const lastUsable = this.ipToNumber(subnet.lastHost);
    const allocated = new Set(allocatedIps.map(ip => this.ipToNumber(ip)));
    
    for (let ip = firstUsable; ip <= lastUsable; ip++) {
      if (!allocated.has(ip)) {
        return this.numberToIp(ip);
      }
    }
    
    return null; // Aucune IP disponible
  }

  /**
   * Statistiques d'utilisation d'un sous-réseau
   */
  public getSubnetUtilization(subnet: Subnet, allocatedIps: string[]): {
    utilizationPercent: number;
    availableIps: number;
    allocatedIps: number;
    reservedIps: number;
  } {
    const totalUsable = subnet.usableHosts;
    const allocated = allocatedIps.length;
    const reserved = 2; // Gateway et réservé
    const available = totalUsable - allocated - reserved;
    
    return {
      utilizationPercent: (allocated / totalUsable) * 100,
      availableIps: available,
      allocatedIps: allocated,
      reservedIps: reserved
    };
  }

  /**
   * Analyse une adresse IP
   */
  public analyzeIP(ip: string): IPAnalysis {
    try {
      const isValid = this.isValidIPv4(ip);
      if (!isValid) {
        throw new Error('Adresse IP invalide');
      }

      const networkClass = this.getNetworkClass(ip);
      const isPrivate = this.isPrivateIP(ip);
      const ipNum = this.ipToNumber(ip);
      
      return {
        ip,
        class: networkClass as IPClass,
        isPrivate,
        isReserved: this.isReservedIP(ip),
        isLoopback: ip.startsWith('127.'),
        isMulticast: networkClass === 'D',
        isBroadcast: ip.endsWith('.255'),
        isValid,
        binaryRepresentation: this.ipToBinary(ip),
        hexRepresentation: this.ipToHex(ip),
        defaultMask: this.getDefaultMask(networkClass),
        defaultCidr: this.getDefaultCidr(networkClass),
        description: this.getIPDescription(ip)
      };
    } catch (error) {
      logger.error('Erreur lors de l\'analyse IP:', error);
      throw error;
    }
  }

  private isReservedIP(ip: string): boolean {
    // RFC 3927 - Link-Local
    if (ip.startsWith('169.254.')) return true;
    // RFC 5737 - Documentation
    if (ip.startsWith('192.0.2.') || ip.startsWith('198.51.100.') || ip.startsWith('203.0.113.')) return true;
    return false;
  }

  private ipToHex(ip: string): string {
    return '0x' + ip.split('.').map(octet => 
      parseInt(octet, 10).toString(16).padStart(2, '0').toUpperCase()
    ).join('');
  }

  private getDefaultMask(networkClass: string): string {
    switch (networkClass) {
      case 'A': return '255.0.0.0';
      case 'B': return '255.255.0.0';
      case 'C': return '255.255.255.0';
      default: return '255.255.255.255';
    }
  }

  private getDefaultCidr(networkClass: string): number {
    switch (networkClass) {
      case 'A': return 8;
      case 'B': return 16;
      case 'C': return 24;
      default: return 32;
    }
  }

  private getIPDescription(ip: string): string {
    if (this.isPrivateIP(ip)) return 'Adresse IP privée (RFC 1918)';
    if (ip.startsWith('127.')) return 'Adresse de bouclage (localhost)';
    if (ip.startsWith('169.254.')) return 'Adresse link-local (APIPA)';
    if (this.isReservedIP(ip)) return 'Adresse réservée pour documentation';
    return 'Adresse IP publique';
  }
}

export const subnetService = new SubnetService();