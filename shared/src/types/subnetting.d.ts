export interface IPAddress {
    ip: string;
    cidr: number;
    subnet?: string;
    isValid: boolean;
}
export interface Subnet {
    id: string;
    name?: string;
    network: string;
    cidr: number;
    mask: string;
    wildcard: string;
    broadcast: string;
    firstHost: string;
    lastHost: string;
    totalHosts: number;
    usableHosts: number;
    binaryNetwork: string;
    binaryMask: string;
    usage?: SubnetUsage;
    vlanId?: number;
    description?: string;
    color?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface SubnetUsage {
    type: 'lan' | 'dmz' | 'management' | 'guests' | 'servers' | 'voip' | 'storage' | 'backup' | 'custom';
    label: string;
    estimatedHosts: number;
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    priority: number;
}
export interface NetworkPlan {
    id: string;
    name: string;
    baseNetwork: string;
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
export interface SegmentationRequirement {
    id: string;
    name: string;
    type: SubnetUsage['type'];
    requiredHosts: number;
    securityLevel: SubnetUsage['securityLevel'];
    priority: number;
    vlanId?: number;
    allowOverlap?: boolean;
    customCidr?: number;
    mustBeContiguous?: boolean;
    color?: string;
    notes?: string;
}
export interface AutoCalculationResult {
    success: boolean;
    baseNetwork: string;
    baseCidr: number;
    requirements: SegmentationRequirement[];
    allocatedSubnets: Subnet[];
    unallocatedRequirements: SegmentationRequirement[];
    wastedAddresses: number;
    efficiency: number;
    recommendations: string[];
    warnings: string[];
    errors: string[];
}
export interface NetworkValidation {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: string[];
    conflicts: SubnetConflict[];
}
export interface ValidationError {
    type: 'invalid_ip' | 'invalid_cidr' | 'overlap' | 'insufficient_space' | 'invalid_range';
    message: string;
    field?: string;
    subnet?: string;
    conflictWith?: string;
}
export interface ValidationWarning {
    type: 'efficiency' | 'security' | 'best_practice' | 'waste';
    message: string;
    subnet?: string;
    recommendation?: string;
}
export interface SubnetConflict {
    subnet1: Subnet;
    subnet2: Subnet;
    type: 'overlap' | 'contains' | 'adjacent';
    severity: 'error' | 'warning' | 'info';
    resolution?: string;
}
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
export interface VLSMResult {
    requirement: SegmentationRequirement;
    allocatedSubnet?: Subnet;
    status: 'allocated' | 'failed' | 'pending';
    reason?: string;
}
export interface IPRange {
    start: string;
    end: string;
    count: number;
    type: 'used' | 'available' | 'reserved' | 'broadcast';
    subnet?: Subnet;
    color?: string;
    label?: string;
}
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
    subnetsByType: {
        [key in SubnetUsage['type']]?: number;
    };
}
export interface SubnetCalculator {
    ip: string;
    cidr: number;
    customMask?: string;
    result?: Subnet;
    isValid: boolean;
}
export interface SubnetSplitter {
    parentNetwork: string;
    parentCidr: number;
    targetSubnets: number;
    newCidr?: number;
    results: Subnet[];
    isValid: boolean;
}
export interface SubnetAggregator {
    subnets: string[];
    result?: string;
    canAggregate: boolean;
    savings: number;
}
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
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
    timestamp: Date;
}
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
export declare enum IPClass {
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E"
}
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
//# sourceMappingURL=subnetting.d.ts.map