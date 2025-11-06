import React, { useState } from 'react';
import styled from 'styled-components';
import LazyNetworkMap from '../components/NetworkTopology/LazyNetworkMap';
import { AdvancedTopologyTools } from '../components/TopologyTools/AdvancedTopologyTools';
import { LoadingSpinner, ErrorMessage } from '../components/Common';
import { useNetworkTopology, NetworkDevice } from '../hooks/useTopologyApi';

const TopologyPageContainer = styled.div`
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  
  @media (max-width: 1400px) {
    padding: 20px;
  }
  
  @media (max-width: 1200px) {
    padding: 16px;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  
  @media (max-width: 1400px) {
    grid-template-columns: 1fr 350px;
    gap: 20px;
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const MainContent = styled.div``;

const GraphSection = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  overflow: hidden;
  
  @media (max-width: 1200px) {
    margin-top: 24px;
  }
`;

const TabNavigation = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)' : 
    'white'};
  color: ${props => props.active ? 'white' : '#64748b'};
  border: ${props => props.active ? 'none' : '1px solid #e2e8f0'};

  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, #34d399 0%, #60a5fa 100%)' : 
      '#f1f5f9'};
    color: ${props => props.active ? 'white' : '#1e293b'};
  }
`;

const TabContent = styled.div``;

const StatsCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .stat-item {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
      
      .value, .label {
        color: white;
      }
    }
    
    .value {
      display: block;
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      transition: color 0.2s ease;
    }
    
    .label {
      font-size: 13px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: color 0.2s ease;
    }
  }
`;

const DeviceCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .device-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    border-radius: 12px;
    margin-bottom: 12px;
    transition: all 0.2s ease;
    background: #f8fafc;
    
    &:hover {
      background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
      
      .device-info .name,
      .device-info .details {
        color: white;
      }
      
      .device-icon {
        background: white;
        color: #60a5fa;
        transform: scale(1.1);
      }
    }
    
    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .device-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      margin-right: 16px;
      box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
      transition: all 0.2s ease;
    }
    
    .device-info {
      flex: 1;
      
      .name {
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 6px;
        font-size: 15px;
        transition: color 0.2s ease;
      }
      
      .details {
        font-size: 13px;
        color: #64748b;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        transition: color 0.2s ease;
      }
    }
    
    .device-status {
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      
      &.online { 
        background: #dcfce7; 
        color: #166534; 
        border: 1px solid #bbf7d0;
        box-shadow: 0 2px 4px rgba(22, 101, 52, 0.1);
      }
      &.offline { 
        background: #fef2f2; 
        color: #dc2626; 
        border: 1px solid #fecaca;
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
      }
      &.warning { 
        background: #fffbeb; 
        color: #d97706; 
        border: 1px solid #fed7aa;
        box-shadow: 0 2px 4px rgba(217, 119, 6, 0.1);
      }
      &.critical { 
        background: #fef2f2; 
        color: #dc2626; 
        border: 1px solid #fecaca;
        box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
        animation: pulse 2s infinite;
      }
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

export const TopologyPage: React.FC = () => {
  // API hooks
  const { data: topologyData, isLoading, error } = useNetworkTopology();
  
  // State
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [activeTab, setActiveTab] = useState<'topology' | 'tools'>('topology');
  
  // Afficher les détails du device sélectionné dans la console
  React.useEffect(() => {
    if (selectedDevice) {
      console.log('Device sélectionné:', selectedDevice);
    }
  }, [selectedDevice]);

  // Mapper les types d'appareils vers les types acceptés par NetworkNode
  const mapDeviceType = (type: string): 'router' | 'switch' | 'firewall' | 'server' | 'workstation' | 'access_point' | 'cloud' => {
    const typeMap: Record<string, 'router' | 'switch' | 'firewall' | 'server' | 'workstation' | 'access_point' | 'cloud'> = {
      router: 'router',
      switch: 'switch',
      firewall: 'firewall',
      server: 'server',
      workstation: 'workstation',
      access_point: 'access_point',
      printer: 'workstation', // mapper printer vers workstation
      unknown: 'server', // mapper unknown vers server
      cloud: 'cloud'
    };
    return typeMap[type] || 'server';
  };

  // Mapper les types de connexion vers les types acceptés par NetworkLink
  const mapConnectionType = (type: string): 'ethernet' | 'fiber' | 'wireless' => {
    const typeMap: Record<string, 'ethernet' | 'fiber' | 'wireless'> = {
      ethernet: 'ethernet',
      fiber: 'fiber',
      wireless: 'wireless',
      wifi: 'wireless', // mapper wifi vers wireless
      vpn: 'ethernet' // mapper vpn vers ethernet
    };
    return typeMap[type] || 'ethernet';
  };

  // Mapper les status de connexion vers les types acceptés
  const mapConnectionStatus = (status: string): 'active' | 'inactive' => {
    return status === 'active' ? 'active' : 'inactive';
  };

  // Transformation des données pour le composant de carte
  const networkMapData = topologyData ? {
    nodes: topologyData.devices.map(device => ({
      id: device.id,
      name: device.name,
      type: mapDeviceType(device.type),
      ip: device.ip,
      status: device.status
    })),
    links: topologyData.connections.map(connection => ({
      source: connection.sourceDeviceId,
      target: connection.targetDeviceId,
      type: mapConnectionType(connection.type),
      bandwidth: connection.bandwidth || 0,
      status: mapConnectionStatus(connection.status)
    }))
  } : { nodes: [], links: [] };

  // Obtenir l'icône pour un type d'appareil
  const getDeviceIcon = (type: string) => {
    const icons: Record<string, string> = {
      router: '⚡',
      switch: '⧉',
      firewall: '🛡',
      server: '▣',
      access_point: '📶',
      workstation: '🖥',
      printer: '🖨',
      unknown: '?'
    };
    return icons[type] || icons.unknown;
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement de la topologie réseau..." />;
  }

  if (error) {
    return <ErrorMessage message="Erreur lors du chargement de la topologie réseau" />;
  }

  if (!topologyData) {
    return <ErrorMessage message="Aucune donnée de topologie disponible" />;
  }

  return (
    <TopologyPageContainer>
      <Header>
        <Title>
          📊 Topologie Réseau
        </Title>
       
        
        {/* Statistiques globales */}
        <StatsContainer>
          <StatCard>
            <StatValue>{topologyData.statistics.totalDevices}</StatValue>
            <StatLabel>Appareils Découverts</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{topologyData.statistics.activeConnections}</StatValue>
            <StatLabel>Connexions Actives</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{topologyData.statistics.networkSegments}</StatValue>
            <StatLabel>Segments Réseau</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{topologyData.statistics.deviceTypes}</StatValue>
            <StatLabel>Types d'Appareils</StatLabel>
          </StatCard>
        </StatsContainer>
      </Header>

      {/* Navigation par onglets */}
      <TabNavigation>
        <Tab 
          active={activeTab === 'topology'} 
          onClick={() => setActiveTab('topology')}
        >
          🗺️ Cartographie Réseau
        </Tab>
        <Tab 
          active={activeTab === 'tools'} 
          onClick={() => setActiveTab('tools')}
        >
          🛠️ Outils Avancés
        </Tab>
      </TabNavigation>

      <TabContent>
        {activeTab === 'topology' && (
          <ContentGrid>
            <MainContent>
              <GraphSection>
                <SectionTitle>🗺️ Cartographie Interactive</SectionTitle>
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <LazyNetworkMap 
                    data={networkMapData}
                    width={650}
                    height={400}
                    onNodeClick={(node: any) => {
                      const device = topologyData.devices.find(d => d.id === node.id);
                      if (device) {
                        setSelectedDevice(device);
                      }
                    }}
                  />
                </div>
              </GraphSection>
            </MainContent>

        <Sidebar>
          {/* Titre de la sidebar */}
          <div style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)'
          }}>
            <h2 style={{
              color: 'white',
              margin: 0,
              fontSize: '16px',
              fontWeight: '700'
            }}>
              📊 Tableau de Bord
            </h2>
          </div>

          {/* Statistiques détaillées */}
          <StatsCard>
            <h3>📈 Statistiques Détaillées</h3>
            <div className="stat-grid">
              <div className="stat-item">
                <span className="value">{topologyData.statistics.totalDevices}</span>
                <span className="label">Appareils</span>
              </div>
              <div className="stat-item">
                <span className="value">{topologyData.statistics.activeConnections}</span>
                <span className="label">Connexions</span>
              </div>
              <div className="stat-item">
                <span className="value">{topologyData.statistics.networkSegments}</span>
                <span className="label">Segments</span>
              </div>
              <div className="stat-item">
                <span className="value">{topologyData.statistics.deviceTypes}</span>
                <span className="label">Types</span>
              </div>
            </div>
          </StatsCard>

          {/* Appareils */}
          <DeviceCard>
            <h3>💻 Appareils Découverts ({topologyData.devices.length})</h3>
            {topologyData.devices.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#64748b' 
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
                <p>Aucun appareil découvert</p>
                <p style={{ fontSize: '12px' }}>Lancez une découverte réseau pour détecter les appareils</p>
              </div>
            ) : (
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                paddingRight: '8px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}>
                <style>{`
                  div::-webkit-scrollbar {
                    width: 8px;
                  }
                  div::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                `}</style>
                {topologyData.devices.map((device) => (
                  <div 
                    key={device.id} 
                    className="device-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="device-icon">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="device-info">
                      <div className="name">{device.name}</div>
                      <div className="details">{device.ip} • {device.type}</div>
                    </div>
                    <div className={`device-status ${device.status}`}>
                      {device.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DeviceCard>

          {/* Informations supplémentaires */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
            <div style={{ 
              fontSize: '14px', 
              color: '#64748b',
              fontWeight: '600'
            }}>
              Dernière mise à jour
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94a3b8',
              marginTop: '4px'
            }}>
              {topologyData.statistics.lastDiscovery ? 
                new Date(topologyData.statistics.lastDiscovery).toLocaleString('fr-FR') :
                'Jamais'
              }
            </div>
          </div>
        </Sidebar>
          </ContentGrid>
        )}

        {activeTab === 'tools' && (
          <AdvancedTopologyTools />
        )}
      </TabContent>
    </TopologyPageContainer>
  );
};

export default TopologyPage;