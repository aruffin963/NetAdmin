import { 
  NetworkDevice, 
  NetworkConnection, 
  NetworkTopology, 
  DiscoveryConfig, 
  DiscoveryResult, 
  DiscoveryMethod,
  DeviceType,
  DeviceStatus,
  ConnectionType,
  ConnectionStatus,
  GraphData,
  GraphNode,
  GraphLink,
  GraphGroup,
  TopologyStatistics,
  DiscoveryRequest
} from '@shared/types/topology';
import { logger } from '../utils/logger';

class TopologyService {
  private topologies: Map<string, NetworkTopology> = new Map();
  private discoveryResults: Map<string, DiscoveryResult> = new Map();

  constructor() {
    this.initializeDemoData();
  }

  /**
   * Initialise des données de démonstration
   */
  private initializeDemoData(): void {
    const demoTopology = this.createDemoTopology();
    this.topologies.set(demoTopology.id, demoTopology);
  }

  /**
   * Crée une topologie de démonstration
   */
  private createDemoTopology(): NetworkTopology {
    const devices: NetworkDevice[] = [
      {
        id: 'router-main',
        name: 'Router Principal',
        ip: '192.168.1.1',
        mac: '00:1B:44:11:3A:B7',
        type: 'router',
        status: 'online',
        vendor: 'Cisco',
        model: 'ISR4331',
        os: 'IOS 15.6',
        location: { building: 'Bâtiment A', floor: 'RDC', room: 'Salle serveur' },
        ports: [
          { id: 'p1', name: 'GigabitEthernet0/0/0', number: 1, type: 'ethernet', status: 'up', speed: 1000, duplex: 'full' },
          { id: 'p2', name: 'GigabitEthernet0/0/1', number: 2, type: 'ethernet', status: 'up', speed: 1000, duplex: 'full' },
          { id: 'p3', name: 'GigabitEthernet0/0/2', number: 3, type: 'ethernet', status: 'down', speed: 1000, duplex: 'full' }
        ],
        services: [
          { id: 's1', name: 'SSH', port: 22, protocol: 'TCP', status: 'running', version: 'OpenSSH 7.4' },
          { id: 's2', name: 'SNMP', port: 161, protocol: 'UDP', status: 'running' }
        ],
        snmpData: {
          version: '2c',
          community: 'public',
          systemDescription: 'Cisco IOS Software, ISR4300 Software',
          uptime: 2592000, // 30 jours
          oids: {},
          interfaces: []
        },
        lastSeen: new Date(),
        discoveredBy: 'snmp',
        metadata: {}
      },
      {
        id: 'switch-core',
        name: 'Switch Core',
        ip: '192.168.1.10',
        mac: '00:1B:44:11:3A:C8',
        type: 'switch',
        status: 'online',
        vendor: 'Cisco',
        model: 'Catalyst 2960',
        os: 'IOS 15.2',
        location: { building: 'Bâtiment A', floor: 'RDC', room: 'Salle serveur' },
        ports: this.generateSwitchPorts(24),
        services: [
          { id: 's1', name: 'SSH', port: 22, protocol: 'TCP', status: 'running' },
          { id: 's2', name: 'SNMP', port: 161, protocol: 'UDP', status: 'running' },
          { id: 's3', name: 'HTTP', port: 80, protocol: 'TCP', status: 'running' }
        ],
        lastSeen: new Date(),
        discoveredBy: 'snmp',
        metadata: {}
      },
      {
        id: 'firewall-main',
        name: 'Firewall Principal',
        ip: '192.168.1.254',
        mac: '00:1B:44:11:3A:D9',
        type: 'firewall',
        status: 'online',
        vendor: 'Fortinet',
        model: 'FortiGate 60F',
        os: 'FortiOS 7.0',
        location: { building: 'Bâtiment A', floor: 'RDC', room: 'Salle serveur' },
        ports: [
          { id: 'p1', name: 'wan1', number: 1, type: 'ethernet', status: 'up', speed: 1000 },
          { id: 'p2', name: 'lan', number: 2, type: 'ethernet', status: 'up', speed: 1000 },
          { id: 'p3', name: 'dmz', number: 3, type: 'ethernet', status: 'up', speed: 1000 }
        ],
        services: [
          { id: 's1', name: 'HTTPS', port: 443, protocol: 'TCP', status: 'running' },
          { id: 's2', name: 'SSH', port: 22, protocol: 'TCP', status: 'running' }
        ],
        lastSeen: new Date(),
        discoveredBy: 'snmp',
        metadata: {}
      },
      {
        id: 'server-web',
        name: 'Serveur Web',
        ip: '192.168.1.100',
        mac: '00:1B:44:11:3A:EA',
        type: 'server',
        status: 'online',
        vendor: 'Dell',
        model: 'PowerEdge R740',
        os: 'Ubuntu Server 22.04',
        location: { building: 'Bâtiment A', floor: 'RDC', room: 'Salle serveur' },
        ports: [
          { id: 'p1', name: 'eth0', number: 1, type: 'ethernet', status: 'up', speed: 1000 }
        ],
        services: [
          { id: 's1', name: 'HTTP', port: 80, protocol: 'TCP', status: 'running', version: 'Apache 2.4' },
          { id: 's2', name: 'HTTPS', port: 443, protocol: 'TCP', status: 'running', version: 'Apache 2.4' },
          { id: 's3', name: 'SSH', port: 22, protocol: 'TCP', status: 'running' }
        ],
        lastSeen: new Date(),
        discoveredBy: 'ping',
        metadata: {}
      },
      {
        id: 'ap-bureau',
        name: 'Access Point Bureau',
        ip: '192.168.1.200',
        mac: '00:1B:44:11:3A:FB',
        type: 'access-point',
        status: 'online',
        vendor: 'Ubiquiti',
        model: 'UniFi AC Pro',
        os: 'UniFi 6.5.55',
        location: { building: 'Bâtiment A', floor: '1er étage', room: 'Bureau principal' },
        ports: [
          { id: 'p1', name: 'eth0', number: 1, type: 'ethernet', status: 'up', speed: 1000 },
          { id: 'p2', name: 'wlan0', number: 2, type: 'wifi', status: 'up' }
        ],
        services: [
          { id: 's1', name: 'HTTPS', port: 443, protocol: 'TCP', status: 'running' },
          { id: 's2', name: 'SSH', port: 22, protocol: 'TCP', status: 'running' }
        ],
        lastSeen: new Date(),
        discoveredBy: 'snmp',
        metadata: {}
      },
      {
        id: 'workstation-1',
        name: 'Poste Administrateur',
        ip: '192.168.1.50',
        mac: '00:1B:44:11:3A:0C',
        type: 'workstation',
        status: 'online',
        vendor: 'Dell',
        model: 'OptiPlex 7090',
        os: 'Windows 11 Pro',
        location: { building: 'Bâtiment A', floor: '1er étage', room: 'Bureau admin' },
        ports: [
          { id: 'p1', name: 'Ethernet', number: 1, type: 'ethernet', status: 'up', speed: 1000 }
        ],
        services: [
          { id: 's1', name: 'RDP', port: 3389, protocol: 'TCP', status: 'running' }
        ],
        lastSeen: new Date(),
        discoveredBy: 'arp',
        metadata: {}
      }
    ];

    const connections: NetworkConnection[] = [
      {
        id: 'conn-1',
        sourceDeviceId: 'router-main',
        sourcePortId: 'p1',
        targetDeviceId: 'switch-core',
        targetPortId: 'p1',
        type: 'wired',
        status: 'active',
        bandwidth: 1000,
        latency: 1,
        packetLoss: 0,
        discoveredAt: new Date(),
        lastChecked: new Date()
      },
      {
        id: 'conn-2',
        sourceDeviceId: 'router-main',
        sourcePortId: 'p2',
        targetDeviceId: 'firewall-main',
        targetPortId: 'p2',
        type: 'wired',
        status: 'active',
        bandwidth: 1000,
        latency: 2,
        packetLoss: 0,
        discoveredAt: new Date(),
        lastChecked: new Date()
      },
      {
        id: 'conn-3',
        sourceDeviceId: 'switch-core',
        sourcePortId: 'p2',
        targetDeviceId: 'server-web',
        targetPortId: 'p1',
        type: 'wired',
        status: 'active',
        bandwidth: 1000,
        latency: 1,
        packetLoss: 0,
        discoveredAt: new Date(),
        lastChecked: new Date()
      },
      {
        id: 'conn-4',
        sourceDeviceId: 'switch-core',
        sourcePortId: 'p3',
        targetDeviceId: 'ap-bureau',
        targetPortId: 'p1',
        type: 'wired',
        status: 'active',
        bandwidth: 1000,
        latency: 1,
        packetLoss: 0,
        discoveredAt: new Date(),
        lastChecked: new Date()
      },
      {
        id: 'conn-5',
        sourceDeviceId: 'switch-core',
        sourcePortId: 'p4',
        targetDeviceId: 'workstation-1',
        targetPortId: 'p1',
        type: 'wired',
        status: 'active',
        bandwidth: 1000,
        latency: 2,
        packetLoss: 0,
        discoveredAt: new Date(),
        lastChecked: new Date()
      }
    ];

    const topology: NetworkTopology = {
      id: 'demo-topology',
      name: 'Réseau de Démonstration',
      description: 'Topologie réseau de démonstration pour NetAdmin Pro',
      devices,
      connections,
      subnets: [
        {
          id: 'lan-main',
          network: '192.168.1.0',
          cidr: 24,
          gateway: '192.168.1.1',
          vlan: 1,
          deviceIds: devices.map(d => d.id),
          color: '#3498db'
        }
      ],
      discoveryConfig: {
        methods: ['ping', 'arp', 'snmp'],
        ipRanges: ['192.168.1.0/24'],
        ports: [22, 23, 80, 443, 161],
        timeout: 5000,
        maxThreads: 10,
        snmpCommunities: ['public', 'private']
      },
      lastUpdate: new Date(),
      statistics: this.calculateStatistics(devices, connections)
    };

    return topology;
  }

  /**
   * Génère des ports pour un switch
   */
  private generateSwitchPorts(count: number): any[] {
    const ports = [];
    for (let i = 1; i <= count; i++) {
      ports.push({
        id: `p${i}`,
        name: `FastEthernet0/${i}`,
        number: i,
        type: 'ethernet',
        status: i <= 8 ? 'up' : 'down', // 8 premiers ports actifs
        speed: 100,
        duplex: 'full'
      });
    }
    return ports;
  }

  /**
   * Calcule les statistiques de topologie
   */
  private calculateStatistics(devices: NetworkDevice[], connections: NetworkConnection[]): TopologyStatistics {
    const devicesByType: Record<string, number> = {};
    const devicesByStatus: Record<string, number> = {};
    const connectionsByType: Record<string, number> = {};

    devices.forEach(device => {
      devicesByType[device.type] = (devicesByType[device.type] || 0) + 1;
      devicesByStatus[device.status] = (devicesByStatus[device.status] || 0) + 1;
    });

    connections.forEach(connection => {
      connectionsByType[connection.type] = (connectionsByType[connection.type] || 0) + 1;
    });

    const activeConnections = connections.filter(c => c.status === 'active');
    const averageLatency = activeConnections.length > 0 
      ? activeConnections.reduce((sum, c) => sum + (c.latency || 0), 0) / activeConnections.length 
      : 0;

    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const networkHealth = Math.round((onlineDevices / devices.length) * 100);

    return {
      totalDevices: devices.length,
      totalConnections: connections.length,
      devicesByType: devicesByType as any,
      devicesByStatus: devicesByStatus as any,
      connectionsByType: connectionsByType as any,
      averageLatency,
      networkHealth
    };
  }

  /**
   * Récupère toutes les topologies
   */
  getAllTopologies(): NetworkTopology[] {
    return Array.from(this.topologies.values());
  }

  /**
   * Récupère une topologie par ID
   */
  getTopologyById(id: string): NetworkTopology | null {
    return this.topologies.get(id) || null;
  }

  /**
   * Lance une découverte réseau
   */
  async startDiscovery(request: DiscoveryRequest): Promise<DiscoveryResult> {
    const discoveryId = `discovery-${Date.now()}`;
    
    const result: DiscoveryResult = {
      id: discoveryId,
      startTime: new Date(),
      status: 'running',
      devicesFound: 0,
      connectionsFound: 0,
      errors: [],
      newDevices: [],
      updatedDevices: [],
      newConnections: []
    };

    this.discoveryResults.set(discoveryId, result);

    // Simulation de découverte asynchrone
    setTimeout(() => {
      this.simulateDiscovery(discoveryId, request);
    }, 1000);

    return result;
  }

  /**
   * Simule une découverte réseau
   */
  private simulateDiscovery(discoveryId: string, request: DiscoveryRequest): void {
    const result = this.discoveryResults.get(discoveryId);
    if (!result) return;

    try {
      // Simulation de découverte de nouveaux appareils
      const newDevices: NetworkDevice[] = [
        {
          id: `printer-${Date.now()}`,
          name: 'Imprimante HP LaserJet',
          ip: '192.168.1.150',
          mac: '00:1B:44:11:3A:XX',
          type: 'printer',
          status: 'online',
          vendor: 'HP',
          model: 'LaserJet Pro M404n',
          ports: [
            { id: 'p1', name: 'eth0', number: 1, type: 'ethernet', status: 'up', speed: 100 }
          ],
          services: [
            { id: 's1', name: 'HTTP', port: 80, protocol: 'TCP', status: 'running' },
            { id: 's2', name: 'SNMP', port: 161, protocol: 'UDP', status: 'running' }
          ],
          lastSeen: new Date(),
          discoveredBy: request.methods[0] || 'ping',
          metadata: {}
        }
      ];

      result.status = 'completed';
      result.endTime = new Date();
      result.devicesFound = newDevices.length;
      result.newDevices = newDevices;
      result.connectionsFound = 0;

      logger.info(`Découverte ${discoveryId} terminée: ${newDevices.length} nouveaux appareils trouvés`);
    } catch (error) {
      result.status = 'failed';
      result.endTime = new Date();
      result.errors.push({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
      
      logger.error(`Erreur lors de la découverte ${discoveryId}:`, error);
    }
  }

  /**
   * Récupère le résultat d'une découverte
   */
  getDiscoveryResult(id: string): DiscoveryResult | null {
    return this.discoveryResults.get(id) || null;
  }

  /**
   * Génère les données de graphe pour visualisation
   */
  generateGraphData(topologyId: string): GraphData | null {
    const topology = this.getTopologyById(topologyId);
    if (!topology) return null;

    const nodes: GraphNode[] = topology.devices.map(device => ({
      id: device.id,
      name: device.name,
      type: device.type,
      status: device.status,
      ip: device.ip,
      group: device.type,
      size: this.getNodeSize(device.type),
      color: this.getNodeColor(device.status),
      icon: this.getDeviceIcon(device.type),
      metadata: device
    }));

    const links: GraphLink[] = topology.connections.map(connection => ({
      id: connection.id,
      source: connection.sourceDeviceId,
      target: connection.targetDeviceId,
      type: connection.type,
      status: connection.status,
      bandwidth: connection.bandwidth,
      latency: connection.latency,
      width: this.getLinkWidth(connection.bandwidth),
      color: this.getLinkColor(connection.status),
      metadata: connection
    }));

    const groups: GraphGroup[] = [
      { id: 'router', name: 'Routeurs', color: '#e74c3c', nodeIds: nodes.filter(n => n.type === 'router').map(n => n.id) },
      { id: 'switch', name: 'Commutateurs', color: '#3498db', nodeIds: nodes.filter(n => n.type === 'switch').map(n => n.id) },
      { id: 'server', name: 'Serveurs', color: '#27ae60', nodeIds: nodes.filter(n => n.type === 'server').map(n => n.id) },
      { id: 'workstation', name: 'Postes', color: '#f39c12', nodeIds: nodes.filter(n => n.type === 'workstation').map(n => n.id) },
      { id: 'other', name: 'Autres', color: '#95a5a6', nodeIds: nodes.filter(n => !['router', 'switch', 'server', 'workstation'].includes(n.type)).map(n => n.id) }
    ];

    return { nodes, links, groups };
  }

  /**
   * Utilitaires pour la visualisation
   */
  private getNodeSize(type: DeviceType): number {
    const sizes: Record<DeviceType, number> = {
      router: 20,
      switch: 18,
      firewall: 16,
      server: 15,
      workstation: 12,
      printer: 10,
      'access-point': 14,
      camera: 8,
      phone: 8,
      iot: 6,
      unknown: 10
    };
    return sizes[type] || 10;
  }

  private getNodeColor(status: DeviceStatus): string {
    const colors: Record<DeviceStatus, string> = {
      online: '#27ae60',
      offline: '#e74c3c',
      warning: '#f39c12',
      critical: '#c0392b',
      maintenance: '#9b59b6',
      unknown: '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  }

  private getDeviceIcon(type: DeviceType): string {
    const icons: Record<DeviceType, string> = {
      router: '🔀',
      switch: '📊',
      firewall: '🛡️',
      server: '🖥️',
      workstation: '💻',
      printer: '🖨️',
      'access-point': '📶',
      camera: '📷',
      phone: '☎️',
      iot: '🌐',
      unknown: '❓'
    };
    return icons[type] || '❓';
  }

  private getLinkWidth(bandwidth?: number): number {
    if (!bandwidth) return 2;
    if (bandwidth >= 1000) return 4;
    if (bandwidth >= 100) return 3;
    return 2;
  }

  private getLinkColor(status: ConnectionStatus): string {
    const colors: Record<ConnectionStatus, string> = {
      active: '#2ecc71',
      inactive: '#95a5a6',
      error: '#e74c3c',
      unknown: '#bdc3c7'
    };
    return colors[status] || '#bdc3c7';
  }

  /**
   * Met à jour le statut d'un appareil
   */
  updateDeviceStatus(topologyId: string, deviceId: string, status: DeviceStatus): boolean {
    const topology = this.topologies.get(topologyId);
    if (!topology) return false;

    const device = topology.devices.find(d => d.id === deviceId);
    if (!device) return false;

    device.status = status;
    device.lastSeen = new Date();
    topology.lastUpdate = new Date();
    topology.statistics = this.calculateStatistics(topology.devices, topology.connections);

    return true;
  }

  /**
   * Ajoute un nouvel appareil à la topologie
   */
  addDevice(topologyId: string, device: Omit<NetworkDevice, 'id' | 'lastSeen'>): NetworkDevice | null {
    const topology = this.topologies.get(topologyId);
    if (!topology) return null;

    const newDevice: NetworkDevice = {
      ...device,
      id: `device-${Date.now()}`,
      lastSeen: new Date()
    };

    topology.devices.push(newDevice);
    topology.lastUpdate = new Date();
    topology.statistics = this.calculateStatistics(topology.devices, topology.connections);

    return newDevice;
  }

  /**
   * Supprime un appareil de la topologie
   */
  removeDevice(topologyId: string, deviceId: string): boolean {
    const topology = this.topologies.get(topologyId);
    if (!topology) return false;

    const deviceIndex = topology.devices.findIndex(d => d.id === deviceId);
    if (deviceIndex === -1) return false;

    // Supprimer l'appareil
    topology.devices.splice(deviceIndex, 1);

    // Supprimer les connexions associées
    topology.connections = topology.connections.filter(
      c => c.sourceDeviceId !== deviceId && c.targetDeviceId !== deviceId
    );

    topology.lastUpdate = new Date();
    topology.statistics = this.calculateStatistics(topology.devices, topology.connections);

    return true;
  }
}

export const topologyService = new TopologyService();