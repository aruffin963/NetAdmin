/**
 * Types pour le module de monitoring réseau
 * Gestion des équipements, métriques, alertes et surveillance
 */

// Enum pour les types d'équipements réseau
export enum DeviceType {
  ROUTER = 'router',
  SWITCH = 'switch',
  FIREWALL = 'firewall',
  ACCESS_POINT = 'access_point',
  SERVER = 'server',
  WORKSTATION = 'workstation',
  PRINTER = 'printer',
  UNKNOWN = 'unknown'
}

// Enum pour les statuts d'équipements
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  CRITICAL = 'critical',
  MAINTENANCE = 'maintenance',
  UNKNOWN = 'unknown'
}

// Enum pour les niveaux d'alerte
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

// Interface pour un équipement réseau
export interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  macAddress?: string;
  type: DeviceType;
  vendor?: string;
  model?: string;
  location?: string;
  description?: string;
  status: DeviceStatus;
  lastSeen: Date;
  uptime?: number; // en secondes
  snmpCommunity?: string;
  snmpVersion?: '1' | '2c' | '3';
  monitoringEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour une métrique de performance
export interface PerformanceMetric {
  id: string;
  deviceId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  warning_threshold?: number;
  critical_threshold?: number;
}

// Enum pour les types de métriques
export enum MetricType {
  CPU_USAGE = 'cpu_usage',
  MEMORY_USAGE = 'memory_usage',
  DISK_USAGE = 'disk_usage',
  NETWORK_IN = 'network_in',
  NETWORK_OUT = 'network_out',
  BANDWIDTH_USAGE = 'bandwidth_usage',
  LATENCY = 'latency',
  PACKET_LOSS = 'packet_loss',
  TEMPERATURE = 'temperature',
  POWER_CONSUMPTION = 'power_consumption',
  INTERFACE_STATUS = 'interface_status',
  ERROR_RATE = 'error_rate'
}

// Interface pour les données temps réel d'un équipement
export interface DeviceMetrics {
  deviceId: string;
  deviceName: string;
  status: DeviceStatus;
  lastUpdate: Date;
  metrics: {
    cpu?: PerformanceMetric;
    memory?: PerformanceMetric;
    disk?: PerformanceMetric;
    networkIn?: PerformanceMetric;
    networkOut?: PerformanceMetric;
    latency?: PerformanceMetric;
    packetLoss?: PerformanceMetric;
    temperature?: PerformanceMetric;
  };
  uptime: number;
  interfaces?: NetworkInterface[];
}

// Interface pour une interface réseau
export interface NetworkInterface {
  id: string;
  name: string;
  description?: string;
  type: 'ethernet' | 'wireless' | 'loopback' | 'tunnel' | 'other';
  status: 'up' | 'down' | 'dormant' | 'unknown';
  speed?: number; // en Mbps
  mtu?: number;
  macAddress?: string;
  ipAddresses?: string[];
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  errorsIn: number;
  errorsOut: number;
  dropsIn: number;
  dropsOut: number;
  lastUpdate: Date;
}

// Interface pour une alerte
export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  level: AlertLevel;
  type: string;
  message: string;
  description?: string;
  threshold?: number;
  currentValue?: number;
  metricType?: MetricType;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les seuils d'alerte
export interface AlertThreshold {
  id: string;
  deviceId?: string; // Si null, s'applique à tous les équipements
  metricType: MetricType;
  warningThreshold?: number;
  criticalThreshold?: number;
  enabled: boolean;
  notificationEmails?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les statistiques d'un équipement
export interface DeviceStatistics {
  deviceId: string;
  uptime: number;
  totalAlerts: number;
  criticalAlerts: number;
  averageLatency: number;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  totalBytesTransferred: number;
  lastMonthAvailability: number; // Pourcentage de disponibilité
}

// Interface pour le dashboard de monitoring
export interface MonitoringDashboard {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  devicesWithWarnings: number;
  devicesWithCritical: number;
  unacknowledgedAlerts: number;
  averageNetworkLatency: number;
  totalBandwidthUsage: number;
  topDevicesByLoad: DeviceMetrics[];
  recentAlerts: Alert[];
  networkHealthScore: number; // Score de 0 à 100
}

// Interface pour les données historiques
export interface MetricHistory {
  deviceId: string;
  metricType: MetricType;
  timeRange: {
    start: Date;
    end: Date;
  };
  dataPoints: {
    timestamp: Date;
    value: number;
  }[];
  aggregation: 'raw' | 'average' | 'max' | 'min';
  interval: '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
}

// Interface pour la configuration SNMP
export interface SNMPConfiguration {
  deviceId: string;
  version: '1' | '2c' | '3';
  community?: string; // Pour v1 et v2c
  port: number;
  timeout: number;
  retries: number;
  // Pour SNMPv3
  username?: string;
  authProtocol?: 'MD5' | 'SHA';
  authPassword?: string;
  privProtocol?: 'DES' | 'AES';
  privPassword?: string;
  contextName?: string;
  contextEngineId?: string;
}

// Interface pour les requêtes de surveillance
export interface MonitoringQuery {
  deviceIds?: string[];
  metricTypes?: MetricType[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  aggregation?: 'raw' | 'average' | 'max' | 'min';
  interval?: '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
  limit?: number;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface pour les événements de monitoring en temps réel
export interface MonitoringEvent {
  type: 'device_status' | 'metric_update' | 'alert_created' | 'alert_resolved';
  deviceId: string;
  data: any;
  timestamp: Date;
}

// Interface pour la configuration de polling
export interface PollingConfiguration {
  deviceId: string;
  interval: number; // en secondes
  enabled: boolean;
  metrics: MetricType[];
  snmpOids?: { [key in MetricType]?: string };
}