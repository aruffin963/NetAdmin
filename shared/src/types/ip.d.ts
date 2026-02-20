export declare enum IpStatus {
    AVAILABLE = "available",
    ALLOCATED = "allocated",
    RESERVED = "reserved",
    BLOCKED = "blocked"
}
export declare enum PoolType {
    PUBLIC = "public",
    PRIVATE = "private",
    MANAGEMENT = "management",
    DMZ = "dmz"
}
export declare enum SubnetType {
    LAN = "lan",
    WAN = "wan",
    VLAN = "vlan",
    MANAGEMENT = "management",
    GUEST = "guest"
}
export interface IpAddress {
    id: string;
    address: string;
    status: IpStatus;
    poolId: string;
    subnetId?: string;
    hostname?: string;
    macAddress?: string;
    description?: string;
    allocatedAt?: Date;
    allocatedTo?: string;
    lastSeen?: Date;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IpPool {
    id: string;
    name: string;
    description?: string;
    network: string;
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
export interface Subnet {
    id: string;
    name: string;
    description?: string;
    network: string;
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
export interface CreateIpAddressDto {
    address?: string;
    poolId: string;
    subnetId?: string;
    hostname?: string;
    macAddress?: string;
    description?: string;
    allocatedTo?: string;
}
export interface UpdateIpAddressDto {
    status?: IpStatus;
    hostname?: string;
    macAddress?: string;
    description?: string;
    allocatedTo?: string;
}
export interface CreateIpPoolDto {
    name: string;
    description?: string;
    network: string;
    gateway?: string;
    dnsServers?: string[];
    type: PoolType;
    vlanId?: number;
}
export interface UpdateIpPoolDto {
    name?: string;
    description?: string;
    gateway?: string;
    dnsServers?: string[];
    type?: PoolType;
    vlanId?: number;
    isActive?: boolean;
}
export interface CreateSubnetDto {
    name: string;
    description?: string;
    network: string;
    gateway?: string;
    dnsServers?: string[];
    type: SubnetType;
    vlanId?: number;
    poolId?: string;
}
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
export interface IpAddressFilters {
    status?: IpStatus[];
    poolId?: string;
    subnetId?: string;
    search?: string;
}
export interface IpPoolFilters {
    type?: PoolType[];
    isActive?: boolean;
    search?: string;
}
export interface SubnetFilters {
    type?: SubnetType[];
    poolId?: string;
    isActive?: boolean;
    search?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface IpAddressResponse extends PaginatedResponse<IpAddress> {
}
export interface IpPoolResponse extends PaginatedResponse<IpPool> {
}
export interface SubnetResponse extends PaginatedResponse<Subnet> {
}
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
export interface IpConflict {
    type: 'address_conflict' | 'network_overlap' | 'gateway_conflict';
    message: string;
    affectedResources: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export type IpVersion = 4 | 6;
export type SortDirection = 'asc' | 'desc';
export interface SortOptions {
    field: string;
    direction: SortDirection;
}
//# sourceMappingURL=ip.d.ts.map