/**
 * Types pour le module de monitoring réseau - Frontend
 * Types partagés pour les composants React
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

// Enum pour les niveaux de logs
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
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
  uptime?: number;
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
  networkHealthScore: number;
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

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

// Helpers pour l'UI
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  formattedTime?: string;
}

export interface StatusColors {
  [DeviceStatus.ONLINE]: string;
  [DeviceStatus.OFFLINE]: string;
  [DeviceStatus.WARNING]: string;
  [DeviceStatus.CRITICAL]: string;
  [DeviceStatus.MAINTENANCE]: string;
  [DeviceStatus.UNKNOWN]: string;
}

export interface AlertColors {
  [AlertLevel.INFO]: string;
  [AlertLevel.WARNING]: string;
  [AlertLevel.CRITICAL]: string;
  [AlertLevel.EMERGENCY]: string;
}

// ========== INTERFACES POUR LES LOGS ==========

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  category: string;
  message: string;
  details?: string;
  deviceId?: string;
  deviceName?: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface LogFilters {
  level?: LogLevel | 'all';
  category?: string;
  source?: string;
  timeRange?: string;
  search?: string;
  deviceId?: string;
  userId?: string;
}

export interface LogStats {
  total: number;
  error: number;
  warning: number;
  info: number;
  debug: number;
}