// Types pour le module de topologie réseau

export interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  mac?: string;
  type: DeviceType;
  status: DeviceStatus;
  vendor?: string;
  model?: string;
  os?: string;
  location?: DeviceLocation;
  ports: DevicePort[];
  services: NetworkService[];
  snmpData?: SNMPData;
  lastSeen: Date;
  discoveredBy: DiscoveryMethod;
  metadata: Record<string, any>;
}

export interface DevicePort {
  id: string;
  name: string;
  number: number;
  type: PortType;
  status: PortStatus;
  speed?: number; // Mbps
  duplex?: 'full' | 'half' | 'auto';
  vlan?: number;
  connectedTo?: string; // ID du device connecté
  connectedPort?: string; // ID du port connecté
}

export interface NetworkConnection {
  id: string;
  sourceDeviceId: string;
  sourcePortId: string;
  targetDeviceId: string;
  targetPortId: string;
  type: ConnectionType;
  status: ConnectionStatus;
  bandwidth?: number;
  latency?: number;
  packetLoss?: number;
  discoveredAt: Date;
  lastChecked: Date;
}

export interface NetworkService {
  id: string;
  name: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  status: 'running' | 'stopped' | 'unknown';
  version?: string;
  banner?: string;
}

export interface SNMPData {
  community?: string;
  version: '1' | '2c' | '3';
  oids: Record<string, any>;
  systemDescription?: string;
  uptime?: number;
  interfaces?: SNMPInterface[];
}

export interface SNMPInterface {
  index: number;
  name: string;
  description: string;
  type: number;
  speed: number;
  status: 'up' | 'down' | 'testing';
  inOctets: number;
  outOctets: number;
  inErrors: number;
  outErrors: number;
}

export interface DeviceLocation {
  building?: string;
  floor?: string;
  room?: string;
  rack?: string;
  coordinates?: {
    x: number;
    y: number;
    z?: number;
  };
}

export interface NetworkTopology {
  id: string;
  name: string;
  description?: string;
  devices: NetworkDevice[];
  connections: NetworkConnection[];
  subnets: TopologySubnet[];
  discoveryConfig: DiscoveryConfig;
  lastUpdate: Date;
  statistics: TopologyStatistics;
}

export interface TopologySubnet {
  id: string;
  network: string;
  cidr: number;
  gateway?: string;
  vlan?: number;
  deviceIds: string[];
  color?: string;
}

export interface DiscoveryConfig {
  methods: DiscoveryMethod[];
  ipRanges: string[];
  ports: number[];
  timeout: number;
  maxThreads: number;
  snmpCommunities: string[];
  credentials?: DiscoveryCredentials[];
  schedule?: DiscoverySchedule;
}

export interface DiscoveryCredentials {
  type: 'ssh' | 'telnet' | 'snmp' | 'wmi';
  username?: string;
  password?: string;
  privateKey?: string;
  community?: string;
}

export interface DiscoverySchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string;
  days?: number[];
}

export interface TopologyStatistics {
  totalDevices: number;
  totalConnections: number;
  devicesByType: Record<DeviceType, number>;
  devicesByStatus: Record<DeviceStatus, number>;
  connectionsByType: Record<ConnectionType, number>;
  averageLatency: number;
  networkHealth: number; // 0-100%
}

export interface DiscoveryResult {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: DiscoveryStatus;
  devicesFound: number;
  connectionsFound: number;
  errors: DiscoveryError[];
  newDevices: NetworkDevice[];
  updatedDevices: NetworkDevice[];
  newConnections: NetworkConnection[];
}

export interface DiscoveryError {
  type: 'timeout' | 'auth' | 'network' | 'parse' | 'unknown';
  message: string;
  target?: string;
  timestamp: Date;
}

// Types énumérés
export type DeviceType = 
  | 'router' 
  | 'switch' 
  | 'firewall' 
  | 'server' 
  | 'workstation' 
  | 'printer' 
  | 'access-point' 
  | 'camera' 
  | 'phone' 
  | 'iot' 
  | 'unknown';

export type DeviceStatus = 
  | 'online' 
  | 'offline' 
  | 'warning' 
  | 'critical' 
  | 'maintenance' 
  | 'unknown';

export type PortType = 
  | 'ethernet' 
  | 'fiber' 
  | 'wifi' 
  | 'serial' 
  | 'usb' 
  | 'other';

export type PortStatus = 
  | 'up' 
  | 'down' 
  | 'disabled' 
  | 'testing' 
  | 'unknown';

export type ConnectionType = 
  | 'wired' 
  | 'wireless' 
  | 'virtual' 
  | 'tunnel' 
  | 'trunk';

export type ConnectionStatus = 
  | 'active' 
  | 'inactive' 
  | 'error' 
  | 'unknown';

export type DiscoveryMethod = 
  | 'ping' 
  | 'arp' 
  | 'snmp' 
  | 'nmap' 
  | 'cdp' 
  | 'lldp' 
  | 'ssh' 
  | 'wmi';

export type DiscoveryStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

// Types pour l'API
export interface TopologyApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface DiscoveryRequest {
  name?: string;
  ipRanges: string[];
  methods: DiscoveryMethod[];
  timeout?: number;
  credentials?: DiscoveryCredentials[];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  groups: GraphGroup[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip: string;
  x?: number;
  y?: number;
  fx?: number; // fixed x position
  fy?: number; // fixed y position
  group?: string;
  size?: number;
  color?: string;
  icon?: string;
  metadata: NetworkDevice;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: ConnectionType;
  status: ConnectionStatus;
  bandwidth?: number;
  latency?: number;
  width?: number;
  color?: string;
  metadata: NetworkConnection;
}

export interface GraphGroup {
  id: string;
  name: string;
  color: string;
  nodeIds: string[];
  subnet?: TopologySubnet;
}

// Types pour les filtres et recherche
export interface TopologyFilter {
  deviceTypes?: DeviceType[];
  deviceStatuses?: DeviceStatus[];
  connectionTypes?: ConnectionType[];
  subnets?: string[];
  searchTerm?: string;
}

export interface TopologyLayout {
  type: 'force' | 'hierarchical' | 'circular' | 'grid' | 'custom';
  options: Record<string, any>;
}

// Types pour l'export
export interface TopologyExport {
  format: 'json' | 'xml' | 'csv' | 'pdf' | 'png' | 'svg';
  includeDevices: boolean;
  includeConnections: boolean;
  includeStatistics: boolean;
}

// Présets de découverte
export interface DiscoveryPreset {
  id: string;
  name: string;
  description: string;
  config: DiscoveryConfig;
  category: 'basic' | 'advanced' | 'enterprise' | 'custom';
  tags: string[];
}