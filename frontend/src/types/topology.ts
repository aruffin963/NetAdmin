// Types temporaires pour la topologie réseau
// TODO: Remplacer par import depuis @shared/types/topology une fois configuré

export type DeviceType = 
  | 'router' 
  | 'switch' 
  | 'firewall' 
  | 'server' 
  | 'access_point' 
  | 'workstation' 
  | 'printer' 
  | 'phone' 
  | 'camera' 
  | 'sensor' 
  | 'hub' 
  | 'bridge' 
  | 'unknown';

export type DeviceStatus = 
  | 'online' 
  | 'offline' 
  | 'warning' 
  | 'critical' 
  | 'maintenance' 
  | 'unknown';

export type ConnectionType = 
  | 'ethernet' 
  | 'wifi' 
  | 'fiber' 
  | 'serial' 
  | 'virtual' 
  | 'vpn' 
  | 'unknown';

export interface NetworkDevice {
  id: string;
  name?: string;
  hostname?: string;
  ip: string;
  mac?: string;
  type: DeviceType;
  status: DeviceStatus;
  vendor?: string;
  model?: string;
  version?: string;
  description?: string;
  location?: string;
  ports?: DevicePort[];
  discoveredAt: Date;
  lastSeen: Date;
  metadata?: Record<string, any>;
}

export interface DevicePort {
  id: string;
  name: string;
  type: 'ethernet' | 'fiber' | 'serial' | 'usb' | 'other';
  status: 'up' | 'down' | 'unknown';
  speed?: string;
  duplex?: 'full' | 'half' | 'unknown';
  vlan?: number;
  description?: string;
}

export interface NetworkConnection {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  sourcePort?: string;
  targetPort?: string;
  type: ConnectionType;
  status: 'active' | 'inactive' | 'error' | 'unknown';
  bandwidth?: string;
  latency?: number;
  packetLoss?: number;
  discoveredAt: Date;
  metadata?: Record<string, any>;
}

export interface NetworkTopology {
  id: string;
  name: string;
  description?: string;
  devices: NetworkDevice[];
  connections: NetworkConnection[];
  createdAt: Date;
  updatedAt: Date;
  discoveredBy?: string;
  statistics: TopologyStatistics;
}

export interface TopologyStatistics {
  totalDevices: number;
  totalConnections: number;
  devicesByType: Record<DeviceType, number>;
  devicesByStatus: Record<DeviceStatus, number>;
  networkSegments: number;
  averageLatency?: number;
  totalBandwidth?: string;
}

export interface GraphNode {
  id: string;
  device: NetworkDevice;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  connection: NetworkConnection;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface DiscoveryRequest {
  name?: string;
  ipRanges: string[];
  methods: DiscoveryMethod[];
  ports?: number[];
  timeout?: number;
  maxThreads?: number;
  snmpCommunities?: string[];
  credentials?: DiscoveryCredentials;
}

export type DiscoveryMethod = 
  | 'ping' 
  | 'arp' 
  | 'snmp' 
  | 'nmap' 
  | 'cdp' 
  | 'lldp' 
  | 'ssh' 
  | 'wmi';

export interface DiscoveryCredentials {
  ssh?: {
    username: string;
    password?: string;
    privateKey?: string;
  };
  snmp?: {
    community: string;
    version: '1' | '2c' | '3';
    username?: string;
    password?: string;
  };
  wmi?: {
    username: string;
    password: string;
    domain?: string;
  };
}

export interface DiscoveryResult {
  id: string;
  name?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  discoveredDevices: NetworkDevice[];
  discoveredConnections: NetworkConnection[];
  errors: string[];
  config: DiscoveryRequest;
  topologyId?: string;
}

export interface TopologyApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: Date;
}