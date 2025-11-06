import React from 'react';
import styled from 'styled-components';
import { NetworkDevice, DeviceStatus, DeviceType, DeviceMetrics } from '../../types/monitoring';

interface DeviceCardProps {
  device: NetworkDevice;
  metrics?: DeviceMetrics;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  metrics,
  onClick,
  onEdit,
  onDelete
}) => {
  // Déterminer l'icône selon le type d'équipement
  const getDeviceIcon = (type: DeviceType): string => {
    switch (type) {
      case DeviceType.ROUTER:
        return '🔀';
      case DeviceType.SWITCH:
        return '🔌';
      case DeviceType.FIREWALL:
        return '🛡️';
      case DeviceType.ACCESS_POINT:
        return '📶';
      case DeviceType.SERVER:
        return '🖥️';
      case DeviceType.WORKSTATION:
        return '💻';
      case DeviceType.PRINTER:
        return '🖨️';
      default:
        return '❓';
    }
  };

  // Déterminer la couleur selon le statut
  const getStatusColor = (status: DeviceStatus): string => {
    switch (status) {
      case DeviceStatus.ONLINE:
        return '#10b981';
      case DeviceStatus.WARNING:
        return '#f59e0b';
      case DeviceStatus.CRITICAL:
        return '#ef4444';
      case DeviceStatus.OFFLINE:
        return '#6b7280';
      case DeviceStatus.MAINTENANCE:
        return '#3b82f6';
      default:
        return '#9ca3af';
    }
  };

  // Formater le temps de fonctionnement
  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}j ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Formater la valeur des métriques
  const formatMetricValue = (value?: number, unit?: string): string => {
    if (value === undefined) return 'N/A';
    
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    } else if (unit === 'bytes/s') {
      return formatBytes(value);
    }
    
    return `${value.toFixed(1)} ${unit || ''}`;
  };

  // Formateur pour les bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <CardContainer onClick={onClick} clickable={!!onClick}>
      <CardHeader>
        <DeviceInfo>
          <DeviceIcon>{getDeviceIcon(device.type)}</DeviceIcon>
          <DeviceDetails>
            <DeviceName>{device.name}</DeviceName>
            <DeviceLocation>{device.location || device.ipAddress}</DeviceLocation>
          </DeviceDetails>
        </DeviceInfo>
        
        <StatusIndicator>
          <StatusDot color={getStatusColor(device.status)} />
          <StatusText>{device.status.toUpperCase()}</StatusText>
        </StatusIndicator>
      </CardHeader>

      <DeviceSpecifications>
        <SpecItem>
          <SpecLabel>IP:</SpecLabel>
          <SpecValue>{device.ipAddress}</SpecValue>
        </SpecItem>
        {device.vendor && (
          <SpecItem>
            <SpecLabel>Vendor:</SpecLabel>
            <SpecValue>{device.vendor}</SpecValue>
          </SpecItem>
        )}
        {device.model && (
          <SpecItem>
            <SpecLabel>Model:</SpecLabel>
            <SpecValue>{device.model}</SpecValue>
          </SpecItem>
        )}
      </DeviceSpecifications>

      {metrics && device.status === DeviceStatus.ONLINE && (
        <MetricsSection>
          <MetricsTitle>Métriques Temps Réel</MetricsTitle>
          <MetricsGrid>
            {metrics.metrics.cpu && (
              <MetricItem>
                <MetricLabel>CPU</MetricLabel>
                <MetricValue color={getMetricColor(metrics.metrics.cpu.value, 80, 90)}>
                  {formatMetricValue(metrics.metrics.cpu.value, metrics.metrics.cpu.unit)}
                </MetricValue>
              </MetricItem>
            )}
            
            {metrics.metrics.memory && (
              <MetricItem>
                <MetricLabel>RAM</MetricLabel>
                <MetricValue color={getMetricColor(metrics.metrics.memory.value, 85, 95)}>
                  {formatMetricValue(metrics.metrics.memory.value, metrics.metrics.memory.unit)}
                </MetricValue>
              </MetricItem>
            )}
            
            {metrics.metrics.latency && (
              <MetricItem>
                <MetricLabel>Latency</MetricLabel>
                <MetricValue color={getMetricColor(metrics.metrics.latency.value, 100, 200)}>
                  {formatMetricValue(metrics.metrics.latency.value, metrics.metrics.latency.unit)}
                </MetricValue>
              </MetricItem>
            )}
            
            {metrics.metrics.networkIn && (
              <MetricItem>
                <MetricLabel>Network In</MetricLabel>
                <MetricValue>
                  {formatMetricValue(metrics.metrics.networkIn.value, metrics.metrics.networkIn.unit)}
                </MetricValue>
              </MetricItem>
            )}
          </MetricsGrid>
        </MetricsSection>
      )}

      <CardFooter>
        <UptimeInfo>
          <UptimeLabel>Uptime:</UptimeLabel>
          <UptimeValue>{formatUptime(device.uptime)}</UptimeValue>
        </UptimeInfo>
        
        {(onEdit || onDelete) && (
          <ActionButtons>
            {onEdit && (
              <ActionButton 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                color="#3b82f6"
              >
                ✏️
              </ActionButton>
            )}
            {onDelete && (
              <ActionButton 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                color="#ef4444"
              >
                🗑️
              </ActionButton>
            )}
          </ActionButtons>
        )}
      </CardFooter>
    </CardContainer>
  );
};

// Fonction helper pour déterminer la couleur d'une métrique
const getMetricColor = (value: number, warningThreshold: number, criticalThreshold: number): string => {
  if (value >= criticalThreshold) return '#ef4444';
  if (value >= warningThreshold) return '#f59e0b';
  return '#10b981';
};

// Styled Components
const CardContainer = styled.div<{ clickable: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};

  &:hover {
    ${props => props.clickable && `
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    `}
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const DeviceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DeviceIcon = styled.div`
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
`;

const DeviceDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const DeviceName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const DeviceLocation = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.color};
`;

const StatusText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
`;

const DeviceSpecifications = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const SpecItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SpecLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const SpecValue = styled.span`
  font-size: 12px;
  color: #374151;
  font-weight: 600;
`;

const MetricsSection = styled.div`
  margin-bottom: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const MetricsTitle = styled.h4`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const MetricItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetricLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

const MetricValue = styled.span<{ color?: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.color || '#374151'};
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
`;

const UptimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UptimeLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const UptimeValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ color: string }>`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${props => props.color};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => `${props.color}10`};
  }
`;

export default DeviceCard;