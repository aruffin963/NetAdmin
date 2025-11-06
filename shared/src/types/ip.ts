/**
 * Types pour le module de gestion IP
 * Interfaces partagées entre frontend et backend
 */

// Statuts des adresses IP
export enum IpStatus {
  AVAILABLE = 'available',
  ALLOCATED = 'allocated',
  RESERVED = 'reserved',
  BLOCKED = 'blocked'
}

// Types de pools IP
export enum PoolType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  MANAGEMENT = 'management',
  DMZ = 'dmz'
}

// Types de sous-réseaux
export enum SubnetType {
  LAN = 'lan',
  WAN = 'wan',
  VLAN = 'vlan',
  MANAGEMENT = 'management',
  GUEST = 'guest'
}

// Interface pour une adresse IP individuelle
export interface IpAddress {
  id: string;
  address: string; // Format: "192.168.1.1"
  status: IpStatus;
  poolId: string;
  subnetId?: string;
  hostname?: string;
  macAddress?: string;
  description?: string;
  allocatedAt?: Date;
  allocatedTo?: string; // User or device name
  lastSeen?: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour un pool d'adresses IP
export interface IpPool {
  id: string;
  name: string;
  description?: string;
  network: string; // Format CIDR: "192.168.1.0/24"
  gateway?: string;
  dnsServers?: string[];
  type: PoolType;
  vlanId?: number;
  totalAddresses: number;
  availableAddresses: number;
  allocatedAddresses: number;
  reservedAddresses: number;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour un sous-réseau
export interface Subnet {
  id: string;
  name: string;
  description?: string;
  network: string; // Format CIDR: "192.168.1.0/24"
  gateway?: string;
  dnsServers?: string[];
  type: SubnetType;
  vlanId?: number;
  poolId?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les statistiques IP
export interface IpStatistics {
  totalPools: number;
  totalAddresses: number;
  availableAddresses: number;
  allocatedAddresses: number;
  reservedAddresses: number;
  utilizationPercentage: number;
  poolsByType: Record<PoolType, number>;
  subnetsByType: Record<SubnetType, number>;
}

// DTOs pour les requêtes API

// Création d'une adresse IP
export interface CreateIpAddressDto {
  address?: string; // Optionnel, auto-assigné si non fourni
  poolId: string;
  subnetId?: string;
  hostname?: string;
  macAddress?: string;
  description?: string;
  allocatedTo?: string;
}

// Mise à jour d'une adresse IP
export interface UpdateIpAddressDto {
  status?: IpStatus;
  hostname?: string;
  macAddress?: string;
  description?: string;
  allocatedTo?: string;
}

// Création d'un pool IP
export interface CreateIpPoolDto {
  name: string;
  description?: string;
  network: string; // CIDR format
  gateway?: string;
  dnsServers?: string[];
  type: PoolType;
  vlanId?: number;
}

// Mise à jour d'un pool IP
export interface UpdateIpPoolDto {
  name?: string;
  description?: string;
  gateway?: string;
  dnsServers?: string[];
  type?: PoolType;
  vlanId?: number;
  isActive?: boolean;
}

// Création d'un sous-réseau
export interface CreateSubnetDto {
  name: string;
  description?: string;
  network: string; // CIDR format
  gateway?: string;
  dnsServers?: string[];
  type: SubnetType;
  vlanId?: number;
  poolId?: string;
}

// Mise à jour d'un sous-réseau
export interface UpdateSubnetDto {
  name?: string;
  description?: string;
  gateway?: string;
  dnsServers?: string[];
  type?: SubnetType;
  vlanId?: number;
  poolId?: string;
  isActive?: boolean;
}

// Filtres pour les requêtes
export interface IpAddressFilters {
  status?: IpStatus[];
  poolId?: string;
  subnetId?: string;
  search?: string; // Recherche dans address, hostname, description
}

export interface IpPoolFilters {
  type?: PoolType[];
  isActive?: boolean;
  search?: string; // Recherche dans name, description
}

export interface SubnetFilters {
  type?: SubnetType[];
  poolId?: string;
  isActive?: boolean;
  search?: string; // Recherche dans name, description
}

// Réponses API avec pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IpAddressResponse extends PaginatedResponse<IpAddress> {}
export interface IpPoolResponse extends PaginatedResponse<IpPool> {}
export interface SubnetResponse extends PaginatedResponse<Subnet> {}

// Validation et calculs réseau
export interface NetworkInfo {
  network: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
}

// Interface pour les conflits détectés
export interface IpConflict {
  type: 'address_conflict' | 'network_overlap' | 'gateway_conflict';
  message: string;
  affectedResources: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Types d'export pour les utilitaires
export type IpVersion = 4 | 6;
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  direction: SortDirection;
}