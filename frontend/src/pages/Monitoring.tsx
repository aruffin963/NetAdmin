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
            📊 Monitoring Réseau
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
  padding: 0;
  background: #ffffff;
  min-height: 100vh;
`;

const ContentWrapper = styled.div`
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  background: white;
  padding: 24px 32px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
  background: white;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin: 32px;
`;

const LoadingSpinner = styled.div`
  width: 56px;
  height: 56px;
  border: 5px solid rgba(96, 165, 250, 0.2);
  border-top: 5px solid #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 18px;
  color: #60a5fa;
  margin: 0;
  font-weight: 500;
`;

const DashboardSection = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;

  &::before {
    content: '';
    width: 4px;
    height: 24px;
    background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
    border-radius: 2px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  gap: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 28px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #60a5fa 0%, #34d399 100%);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div`
  font-size: 28px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const StatValue = styled.span`
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 600;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const DevicesSection = styled.section`
  background: white;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(96, 165, 250, 0.1);
`;

const DeviceActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const DeviceCount = styled.span`
  font-size: 16px;
  color: #60a5fa;
  font-weight: 600;
  background: rgba(96, 165, 250, 0.1);
  padding: 8px 16px;
  border-radius: 12px;
`;

const AddDeviceButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const DevicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const ChartsSection = styled.section`
  margin-top: 40px;
  background: white;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const TimeRangeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(96, 165, 250, 0.05);
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.2);
`;

const TimeRangeLabel = styled.span`
  font-size: 16px;
  color: #374151;
  font-weight: 600;
`;

const TimeRangeSelect = styled.select`
  padding: 10px 16px;
  border: 2px solid rgba(96, 165, 250, 0.2);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }

  &:hover {
    border-color: #60a5fa;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const CloseChartsButton = styled.button`
  margin-top: 24px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 2px solid rgba(96, 165, 250, 0.2);
  border-radius: 12px;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(96, 165, 250, 0.3);
  }
`;

export default Monitoring;