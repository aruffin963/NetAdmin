import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import MetricChart from '../components/Monitoring/MetricChart';
import DeviceCard from '../components/Monitoring/DeviceCard';
import { AddDeviceModal, type NewDeviceData } from '../components/Monitoring/AddDeviceModal';
import { DeleteDeviceModal } from '../components/Monitoring/DeleteDeviceModal';
import {
  useDashboard,
  useDevices,
  useAllDevicesMetrics,
  useMetricHistory,
  useAddDevice,
  useDeleteDevice
} from '../hooks/useMonitoringApi';
import { MetricType, ChartDataPoint, NetworkDevice } from '../types/monitoring';

const Monitoring: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<number>(1); // heures
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showDeleteDeviceModal, setShowDeleteDeviceModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<NetworkDevice | null>(null);
  
  // Hooks pour les données
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: devicesMetrics = [] } = useAllDevicesMetrics();
  const addDevice = useAddDevice();
  const deleteDevice = useDeleteDevice();

  // Historique des métriques pour le device sélectionné
  const { data: cpuHistory } = useMetricHistory(
    selectedDeviceId || '',
    MetricType.CPU_USAGE,
    selectedTimeRange,
    !!selectedDeviceId
  );
  
  const { data: memoryHistory } = useMetricHistory(
    selectedDeviceId || '',
    MetricType.MEMORY_USAGE,
    selectedTimeRange,
    !!selectedDeviceId
  );

  // Transformer les données d'historique pour les graphiques
  const chartData = useMemo(() => {
    const formatHistoryData = (history?: any): ChartDataPoint[] => {
      if (!history?.dataPoints) return [];
      
      return history.dataPoints.map((point: any) => ({
        timestamp: point.timestamp,
        value: point.value,
        formattedTime: new Date(point.timestamp).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    };

    return {
      cpu: formatHistoryData(cpuHistory),
      memory: formatHistoryData(memoryHistory)
    };
  }, [cpuHistory, memoryHistory]);

  // Métriques du device sélectionné
  const selectedDeviceMetrics = selectedDeviceId 
    ? devicesMetrics.find(m => m.deviceId === selectedDeviceId)
    : null;

  // Gestionnaire pour ajouter un équipement
  const handleAddDevice = async (deviceData: NewDeviceData) => {
    try {
      await addDevice.mutateAsync(deviceData);
      setShowAddDeviceModal(false);
      // Notification de succès pourrait être ajoutée ici
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'équipement:', error);
      // Notification d'erreur pourrait être ajoutée ici
    }
  };

  // Gestion de la suppression d'équipement
  const handleDeleteDevice = (device: NetworkDevice) => {
    setDeviceToDelete(device);
    setShowDeleteDeviceModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deviceToDelete) return;
    
    try {
      await deleteDevice.mutateAsync(deviceToDelete.id);
      setShowDeleteDeviceModal(false);
      setDeviceToDelete(null);
      // Si l'équipement supprimé était sélectionné, désélectionner
      if (selectedDeviceId === deviceToDelete.id) {
        setSelectedDeviceId(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'équipement:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDeviceModal(false);
    setDeviceToDelete(null);
  };

  if (dashboardLoading || devicesLoading) {
    return (
      <Container>
        <ContentWrapper>
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>Chargement du monitoring réseau...</LoadingText>
          </LoadingContainer>
        </ContentWrapper>
      </Container>
    );
  }

  return (
    <Container>
      <ContentWrapper>
        <Header>
          <Title>
             Monitoring Réseau
          </Title>
        </Header>

        {/* Dashboard Overview */}
        {dashboard && (
          <DashboardSection>
            <SectionTitle>Vue d'ensemble</SectionTitle>
            <StatsGrid>
              <StatCard>
                <StatIcon>🖥️</StatIcon>
                <StatInfo>
                  <StatValue>{dashboard.totalDevices}</StatValue>
                  <StatLabel>Équipements</StatLabel>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>✅</StatIcon>
                <StatInfo>
                  <StatValue>{dashboard.onlineDevices}</StatValue>
                  <StatLabel>En ligne</StatLabel>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>⚠️</StatIcon>
                <StatInfo>
                  <StatValue>{dashboard.devicesWithWarnings}</StatValue>
                  <StatLabel>Warnings</StatLabel>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>🚨</StatIcon>
                <StatInfo>
                  <StatValue>{dashboard.unacknowledgedAlerts}</StatValue>
                  <StatLabel>Alertes</StatLabel>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>⚡</StatIcon>
                <StatInfo>
                  <StatValue>{dashboard.averageNetworkLatency.toFixed(1)}ms</StatValue>
                  <StatLabel>Latence moy.</StatLabel>
                </StatInfo>
              </StatCard>
              
              <StatCard>
                <StatIcon>📈</StatIcon>
                <StatInfo>
                  <StatValue>{dashboard.totalBandwidthUsage.toFixed(1)}%</StatValue>
                  <StatLabel>Bande passante</StatLabel>
                </StatInfo>
              </StatCard>
            </StatsGrid>
          </DashboardSection>
        )}

        <MainContent>
          {/* Section des équipements */}
          <DevicesSection>
            <SectionHeader>
              <SectionTitle>Équipements Surveillés</SectionTitle>
              <DeviceActions>
                <DeviceCount>{devices.length} équipements</DeviceCount>
                <AddDeviceButton onClick={() => setShowAddDeviceModal(true)}>
                  ➕ Ajouter un équipement
                </AddDeviceButton>
              </DeviceActions>
            </SectionHeader>
            
            <DevicesGrid>
              {devices.map(device => {
                const metrics = devicesMetrics.find(m => m.deviceId === device.id);
                return (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    metrics={metrics}
                    onClick={() => setSelectedDeviceId(device.id)}
                    onDelete={() => handleDeleteDevice(device)}
                  />
                );
              })}
            </DevicesGrid>
          </DevicesSection>

          {/* Section des graphiques détaillés */}
          {selectedDeviceId && (
            <ChartsSection>
              <SectionHeader>
                <SectionTitle>
                  Métriques détaillées - {devices.find(d => d.id === selectedDeviceId)?.name}
                </SectionTitle>
                <TimeRangeSelector>
                  <TimeRangeLabel>Période:</TimeRangeLabel>
                  <TimeRangeSelect 
                    value={selectedTimeRange} 
                    onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
                  >
                    <option value={1}>1 heure</option>
                    <option value={6}>6 heures</option>
                    <option value={24}>24 heures</option>
                    <option value={168}>7 jours</option>
                  </TimeRangeSelect>
                </TimeRangeSelector>
              </SectionHeader>
              
              <ChartsGrid>
                <MetricChart
                  title="Utilisation CPU"
                  data={chartData.cpu}
                  metric={selectedDeviceMetrics?.metrics.cpu}
                  color="#3b82f6"
                  height={250}
                  warningThreshold={80}
                  criticalThreshold={90}
                />
                
                <MetricChart
                  title="Utilisation Mémoire"
                  data={chartData.memory}
                  metric={selectedDeviceMetrics?.metrics.memory}
                  color="#10b981"
                  height={250}
                  warningThreshold={85}
                  criticalThreshold={95}
                />
              </ChartsGrid>
              
              <CloseChartsButton 
                onClick={() => setSelectedDeviceId(null)}
              >
                ✕ Fermer les graphiques détaillés
              </CloseChartsButton>
            </ChartsSection>
          )}
        </MainContent>

        {/* Modal d'ajout d'équipement */}
        <AddDeviceModal
          isOpen={showAddDeviceModal}
          onClose={() => setShowAddDeviceModal(false)}
          onSubmit={handleAddDevice}
          isLoading={addDevice.isPending}
        />

        {/* Modal de suppression d'équipement */}
        <DeleteDeviceModal
          device={deviceToDelete}
          isOpen={showDeleteDeviceModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteDevice.isPending}
        />
      </ContentWrapper>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e8f0ff 100%);
  padding: 0;
`;

const ContentWrapper = styled.div`
  padding: 40px 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  padding: 32px 40px;
  border-radius: 24px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  gap: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 24px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.1);
  margin: 32px;
`;

const LoadingSpinner = styled.div`
  width: 64px;
  height: 64px;
  border: 4px solid rgba(0, 102, 255, 0.15);
  border-top: 4px solid #0066ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 18px;
  color: #0066ff;
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const DashboardSection = styled.section`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 28px 0;
  display: flex;
  align-items: center;
  gap: 14px;
  letter-spacing: -0.3px;

  &::before {
    content: '';
    width: 5px;
    height: 28px;
    background: linear-gradient(180deg, #0066ff 0%, #10b981 100%);
    border-radius: 3px;
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  backdrop-filter: blur(20px);
  padding: 32px;
  border-radius: 20px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 8px 32px rgba(0, 102, 255, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #0066ff 0%, #10b981 100%);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(0, 102, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 50px rgba(0, 102, 255, 0.15);
    border-color: #0066ff;
  }
`;

const StatIcon = styled.div`
  font-size: 32px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%);
  border-radius: 18px;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 102, 255, 0.35);
  flex-shrink: 0;
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
`;

const StatValue = styled.span`
  font-size: 32px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.1;
  letter-spacing: -0.5px;
`;

const StatLabel = styled.span`
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;
`;

const DevicesSection = styled.section`
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  padding: 40px;
  border-radius: 24px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.08);
  backdrop-filter: blur(10px);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(0, 102, 255, 0.1);
  flex-wrap: wrap;
  gap: 16px;
`;

const DeviceActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const DeviceCount = styled.span`
  font-size: 15px;
  color: #0066ff;
  font-weight: 700;
  background: rgba(0, 102, 255, 0.12);
  padding: 10px 18px;
  border-radius: 14px;
  border: 1px solid rgba(0, 102, 255, 0.25);
  letter-spacing: 0.2px;
`;

const AddDeviceButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
  letter-spacing: 0.2px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const DevicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 28px;
`;

const ChartsSection = styled.section`
  margin-top: 48px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  padding: 40px;
  border-radius: 24px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.08);
  backdrop-filter: blur(10px);
`;

const TimeRangeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(0, 102, 255, 0.08);
  padding: 14px 24px;
  border-radius: 14px;
  border: 1.5px solid rgba(0, 102, 255, 0.2);
  flex-wrap: wrap;
`;

const TimeRangeLabel = styled.span`
  font-size: 16px;
  color: #1f2937;
  font-weight: 700;
  letter-spacing: 0.2px;
`;

const TimeRangeSelect = styled.select`
  padding: 12px 18px;
  border: 2px solid rgba(0, 102, 255, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  background: white;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.1);

  &:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
  }

  &:hover {
    border-color: #0066ff;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
  gap: 28px;
  margin-top: 32px;
`;

const CloseChartsButton = styled.button`
  margin-top: 32px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 2px solid rgba(0, 102, 255, 0.2);
  border-radius: 14px;
  color: #374151;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.2px;

  &:hover {
    background: linear-gradient(135deg, #0066ff 0%, #10b981 100%);
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0, 102, 255, 0.3);
    border-color: transparent;
  }
`;

export default Monitoring;