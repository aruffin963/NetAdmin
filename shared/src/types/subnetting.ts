/**
 * Types pour le module de subnetting et calculs réseau
 * Gestion des calculs CIDR, planification et segmentation réseau
 */

// Interface pour une adresse IP avec masque
export interface IPAddress {
  ip: string;
  cidr: number;
  subnet?: string;
  isValid: boolean;
}

// Interface pour un sous-réseau calculé
export interface Subnet {
  id: string;
  name?: string;
  network: string;          // Adresse réseau (ex: 192.168.1.0)
  cidr: number;            // CIDR (ex: 24)
  mask: string;            // Masque de sous-réseau (ex: 255.255.255.0)
  wildcard: string;        // Masque générique (ex: 0.0.0.255)
  broadcast: string;       // Adresse de diffusion
  firstHost: string;       // Première adresse hôte utilisable
  lastHost: string;        // Dernière adresse hôte utilisable
  totalHosts: number;      // Nombre total d'adresses
  usableHosts: number;     // Nombre d'adresses hôtes utilisables
  binaryNetwork: string;   // Représentation binaire du réseau
  binaryMask: string;      // Représentation binaire du masque
  usage?: SubnetUsage;     // Utilisation prévue du sous-réseau
  vlanId?: number;         // ID VLAN associé
  description?: string;    // Description du sous-réseau
  color?: string;          // Couleur pour la visualisation
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour l'utilisation d'un sous-réseau
export interface SubnetUsage {
  type: 'lan' | 'dmz' | 'management' | 'guests' | 'servers' | 'voip' | 'storage' | 'backup' | 'custom';
  label: string;
  estimatedHosts: number;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  priority: number; // 1-10, 10 étant la plus haute priorité
}

// Interface pour la planification de segmentation
export interface NetworkPlan {
  id: string;
  name: string;
  baseNetwork: string;     // Réseau de base (ex: 192.168.0.0/16)
  baseCidr: number;
  description?: string;
  subnets: Subnet[];
  totalAllocatedHosts: number;
  totalAvailableHosts: number;
  utilizationPercentage: number;
  isOptimized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les exigences de segmentation
export interface SegmentationRequirement {
  id: string;
  name: string;
  type: SubnetUsage['type'];
  requiredHosts: number;
  securityLevel: SubnetUsage['securityLevel'];
  priority: number;
  vlanId?: number;
  allowOverlap?: boolean;
  customCidr?: number; // CIDR spécifique demandé
  mustBeContiguous?: boolean;
  color?: string;
  notes?: string;
}

// Interface pour les résultats de calcul automatique
export interface AutoCalculationResult {
  success: boolean;
  baseNetwork: string;
  baseCidr: number;
  requirements: SegmentationRequirement[];
  allocatedSubnets: Subnet[];
  unallocatedRequirements: SegmentationRequirement[];
  wastedAddresses: number;
  efficiency: number; // Pourcentage d'efficacité
  recommendations: string[];
  warnings: string[];
  errors: string[];
}

// Interface pour la validation de configuration réseau
export interface NetworkValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  conflicts: SubnetConflict[];
}

// Interface pour les erreurs de validation
export interface ValidationError {
  type: 'invalid_ip' | 'invalid_cidr' | 'overlap' | 'insufficient_space' | 'invalid_range';
  message: string;
  field?: string;
  subnet?: string;
  conflictWith?: string;
}

// Interface pour les avertissements de validation
export interface ValidationWarning {
  type: 'efficiency' | 'security' | 'best_practice' | 'waste';
  message: string;
  subnet?: string;
  recommendation?: string;
}

// Interface pour les conflits de sous-réseaux
export interface SubnetConflict {
  subnet1: Subnet;
  subnet2: Subnet;
  type: 'overlap' | 'contains' | 'adjacent';
  severity: 'error' | 'warning' | 'info';
  resolution?: string;
}

// Interface pour les calculs VLSM (Variable Length Subnet Mask)
export interface VLSMCalculation {
  baseNetwork: string;
  baseCidr: number;
  requirements: SegmentationRequirement[];
  results: VLSMResult[];
  summary: {
    totalRequiredHosts: number;
    totalAllocatedHosts: number;
    totalWastedHosts: number;
    efficiency: number;
    largestAvailableBlock: string;
  };
}

// Interface pour un résultat VLSM
export interface VLSMResult {
  requirement: SegmentationRequirement;
  allocatedSubnet?: Subnet;
  status: 'allocated' | 'failed' | 'pending';
  reason?: string;
}

// Interface pour la visualisation des plages IP
export interface IPRange {
  start: string;
  end: string;
  count: number;
  type: 'used' | 'available' | 'reserved' | 'broadcast';
  subnet?: Subnet;
  color?: string;
  label?: string;
}

// Interface pour les statistiques de segmentation
export interface SegmentationStats {
  totalNetworks: number;
  totalSubnets: number;
  totalHosts: number;
  usedHosts: number;
  availableHosts: number;
  wastedHosts: number;
  efficiency: number;
  averageSubnetSize: number;
  largestSubnet: Subnet;
  smallestSubnet: Subnet;
  subnetsByType: { [key in SubnetUsage['type']]?: number };
}

// Interface pour les outils de calcul
export interface SubnetCalculator {
  ip: string;
  cidr: number;
  customMask?: string;
  result?: Subnet;
  isValid: boolean;
}

// Interface pour les outils de découpage
export interface SubnetSplitter {
  parentNetwork: string;
  parentCidr: number;
  targetSubnets: number;
  newCidr?: number;
  results: Subnet[];
  isValid: boolean;
}

// Interface pour les outils de fusion
export interface SubnetAggregator {
  subnets: string[];
  result?: string;
  canAggregate: boolean;
  savings: number; // Nombre de routes économisées
}

// Interface pour les présets de segmentation
export interface SegmentationPreset {
  id: string;
  name: string;
  description: string;
  category: 'enterprise' | 'soho' | 'datacenter' | 'cloud' | 'custom';
  baseNetwork: string;
  baseCidr: number;
  requirements: SegmentationRequirement[];
  isPublic: boolean;
  author?: string;
  tags: string[];
  rating?: number;
  usageCount?: number;
  createdAt: Date;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

// Interface pour les requêtes de calcul
export interface CalculationRequest {
  type: 'subnet' | 'vlsm' | 'split' | 'aggregate' | 'validate';
  baseNetwork?: string;
  baseCidr?: number;
  ip?: string;
  cidr?: number;
  requirements?: SegmentationRequirement[];
  subnets?: string[];
  targetSubnets?: number;
  options?: {
    optimizeForEfficiency?: boolean;
    allowWaste?: boolean;
    prioritizeSecurity?: boolean;
    preferContiguous?: boolean;
  };
}

// Interface pour l'historique des calculs
export interface CalculationHistory {
  id: string;
  request: CalculationRequest;
  result: any;
  timestamp: Date;
  userId?: string;
  isFavorite?: boolean;
  name?: string;
  tags?: string[];
}

// Enum pour les classes d'adresses IP
export enum IPClass {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D', // Multicast
  E = 'E'  // Experimental
}

// Interface pour l'analyse d'adresse IP
export interface IPAnalysis {
  ip: string;
  class: IPClass;
  isPrivate: boolean;
  isReserved: boolean;
  isLoopback: boolean;
  isMulticast: boolean;
  isBroadcast: boolean;
  isValid: boolean;
  binaryRepresentation: string;
  hexRepresentation: string;
  defaultMask: string;
  defaultCidr: number;
  description?: string;
}

// Interface pour les templates de réseau
export interface NetworkTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  baseNetwork: string;
  baseCidr: number;
  subnets: Omit<Subnet, 'id' | 'createdAt' | 'updatedAt'>[];
  isPublic: boolean;
  tags: string[];
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types utilitaires pour l'interface utilisateur
export interface UIColors {
  lan: string;
  dmz: string;
  management: string;
  guests: string;
  servers: string;
  voip: string;
  storage: string;
  backup: string;
  custom: string;
}

export interface FormattedSubnet extends Subnet {
  formattedRange: string;
  formattedUsage: string;
  efficiencyScore: number;
  statusColor: string;
}