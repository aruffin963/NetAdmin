import React from 'react';
import styled from 'styled-components';
import { Alert, AlertLevel } from '../../types/monitoring';

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  maxItems?: number;
}

const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onAcknowledge,
  onResolve,
  maxItems = 10
}) => {
  // Trier les alertes par priorité et date
  const sortedAlerts = [...alerts]
    .sort((a, b) => {
      // D'abord par priorité
      const priorityOrder = {
        [AlertLevel.EMERGENCY]: 4,
        [AlertLevel.CRITICAL]: 3,
        [AlertLevel.WARNING]: 2,
        [AlertLevel.INFO]: 1
      };
      
      const priorityDiff = priorityOrder[b.level] - priorityOrder[a.level];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Puis par date (plus récent en premier)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, maxItems);

  // Déterminer la couleur selon le niveau d'alerte
  const getAlertColor = (level: AlertLevel): string => {
    switch (level) {
      case AlertLevel.EMERGENCY:
        return '#991b1b';
      case AlertLevel.CRITICAL:
        return '#dc2626';
      case AlertLevel.WARNING:
        return '#d97706';
      case AlertLevel.INFO:
        return '#2563eb';
      default:
        return '#6b7280';
    }
  };

  // Déterminer l'icône selon le niveau d'alerte
  const getAlertIcon = (level: AlertLevel): string => {
    switch (level) {
      case AlertLevel.EMERGENCY:
        return '🚨';
      case AlertLevel.CRITICAL:
        return '❌';
      case AlertLevel.WARNING:
        return '⚠️';
      case AlertLevel.INFO:
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  // Formater le temps relatif
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes}min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    }
  };

  if (alerts.length === 0) {
    return (
      <AlertContainer>
        <AlertHeader>
          <AlertTitle>
            <AlertIcon>✅</AlertIcon>
            Alertes Système
          </AlertTitle>
          <AlertCount>0</AlertCount>
        </AlertHeader>
        <EmptyState>
          <EmptyIcon>🎉</EmptyIcon>
          <EmptyTitle>Aucune alerte</EmptyTitle>
          <EmptyText>Tous les systèmes fonctionnent normalement</EmptyText>
        </EmptyState>
      </AlertContainer>
    );
  }

  return (
    <AlertContainer>
      <AlertHeader>
        <AlertTitle>
          <AlertIcon>🔔</AlertIcon>
          Alertes Système
        </AlertTitle>
        <AlertCount>{alerts.length}</AlertCount>
      </AlertHeader>

      <AlertList>
        {sortedAlerts.map(alert => (
          <AlertItem 
            key={alert.id}
            color={getAlertColor(alert.level)}
            acknowledged={alert.acknowledged}
            resolved={alert.resolved}
          >
            <AlertItemHeader>
              <AlertItemIcon>{getAlertIcon(alert.level)}</AlertItemIcon>
              <AlertItemInfo>
                <AlertItemTitle>{alert.message}</AlertItemTitle>
                <AlertItemSubtitle>
                  {alert.deviceName} • {formatTimeAgo(alert.createdAt)}
                </AlertItemSubtitle>
              </AlertItemInfo>
              <AlertItemLevel color={getAlertColor(alert.level)}>
                {alert.level.toUpperCase()}
              </AlertItemLevel>
            </AlertItemHeader>

            {alert.description && (
              <AlertItemDescription>{alert.description}</AlertItemDescription>
            )}

            {(alert.threshold && alert.currentValue) && (
              <AlertItemMetrics>
                <MetricItem>
                  <MetricLabel>Seuil:</MetricLabel>
                  <MetricValue>{alert.threshold}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Valeur actuelle:</MetricLabel>
                  <MetricValue>{alert.currentValue}</MetricValue>
                </MetricItem>
              </AlertItemMetrics>
            )}

            <AlertItemFooter>
              <AlertStatus>
                {alert.resolved ? (
                  <StatusBadge color="#10b981">✓ Résolu</StatusBadge>
                ) : alert.acknowledged ? (
                  <StatusBadge color="#f59e0b">👁️ Acquitté</StatusBadge>
                ) : (
                  <StatusBadge color="#ef4444">🔔 Non acquitté</StatusBadge>
                )}
              </AlertStatus>

              {!alert.resolved && (
                <AlertActions>
                  {!alert.acknowledged && onAcknowledge && (
                    <ActionButton
                      onClick={() => onAcknowledge(alert.id)}
                      color="#3b82f6"
                    >
                      Acquitter
                    </ActionButton>
                  )}
                  {onResolve && (
                    <ActionButton
                      onClick={() => onResolve(alert.id)}
                      color="#10b981"
                    >
                      Résoudre
                    </ActionButton>
                  )}
                </AlertActions>
              )}
            </AlertItemFooter>
          </AlertItem>
        ))}
      </AlertList>

      {alerts.length > maxItems && (
        <ShowMoreFooter>
          <ShowMoreText>
            +{alerts.length - maxItems} autres alertes
          </ShowMoreText>
        </ShowMoreFooter>
      )}
    </AlertContainer>
  );
};

// Styled Components
const AlertContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  background: #f9fafb;
`;

const AlertTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const AlertIcon = styled.span`
  font-size: 18px;
`;

const AlertCount = styled.span`
  background: #ef4444;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
`;

const EmptyTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const AlertList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const AlertItem = styled.div<{ 
  color: string; 
  acknowledged: boolean; 
  resolved: boolean; 
}>`
  padding: 16px 20px;
  border-left: 4px solid ${props => props.color};
  border-bottom: 1px solid #f3f4f6;
  background: ${props => 
    props.resolved ? '#f0fdf4' : 
    props.acknowledged ? '#fffbeb' : 
    'white'
  };
  opacity: ${props => props.resolved ? 0.7 : 1};

  &:last-child {
    border-bottom: none;
  }
`;

const AlertItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
`;

const AlertItemIcon = styled.span`
  font-size: 16px;
  margin-top: 2px;
`;

const AlertItemInfo = styled.div`
  flex: 1;
`;

const AlertItemTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const AlertItemSubtitle = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
`;

const AlertItemLevel = styled.span<{ color: string }>`
  font-size: 10px;
  font-weight: 700;
  color: ${props => props.color};
  background: ${props => `${props.color}10`};
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
`;

const AlertItemDescription = styled.p`
  font-size: 13px;
  color: #374151;
  margin: 8px 0;
  padding-left: 28px;
  line-height: 1.4;
`;

const AlertItemMetrics = styled.div`
  display: flex;
  gap: 16px;
  margin: 8px 0;
  padding-left: 28px;
`;

const MetricItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetricLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const MetricValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #111827;
`;

const AlertItemFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-left: 28px;
`;

const AlertStatus = styled.div``;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.color};
  background: ${props => `${props.color}10`};
  padding: 4px 8px;
  border-radius: 6px;
`;

const AlertActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ color: string }>`
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: ${props => props.color};
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const ShowMoreFooter = styled.div`
  padding: 12px 20px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
  text-align: center;
`;

const ShowMoreText = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

export default AlertPanel;