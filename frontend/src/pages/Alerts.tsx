import React, { useState } from 'react';
import styled from 'styled-components';
import AlertPanel from '../components/Monitoring/AlertPanel';
import {
  useAlerts,
  useAcknowledgeAlert
} from '../hooks/useMonitoringApi';
import { AlertLevel } from '../types/monitoring';

const Alerts: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<AlertLevel | 'all'>('all');
  const { data: alerts = [], isLoading } = useAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();

  // Filtrer les alertes selon le niveau sélectionné
  const filteredAlerts = selectedLevel === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.level === selectedLevel);

  // Compter les alertes par niveau
  const alertCounts = {
    total: alerts.length,
    emergency: alerts.filter(a => a.level === AlertLevel.EMERGENCY).length,
    critical: alerts.filter(a => a.level === AlertLevel.CRITICAL).length,
    warning: alerts.filter(a => a.level === AlertLevel.WARNING).length,
    info: alerts.filter(a => a.level === AlertLevel.INFO).length,
  };

  // Gestionnaire pour acquitter une alerte
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert.mutateAsync(alertId);
    } catch (error) {
      console.error('Erreur lors de l\'acquittement de l\'alerte:', error);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <ContentWrapper>
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>Chargement des alertes...</LoadingText>
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
            🔔 Gestion des Alertes
          </Title>
          <AlertCount>
            {alertCounts.total} {alertCounts.total > 1 ? 'alertes' : 'alerte'} actives
          </AlertCount>
        </Header>

        {/* Statistiques des alertes */}
        <StatsSection>
          <SectionTitle>Vue d'ensemble</SectionTitle>
          <StatsGrid>
            <StatCard 
              $isActive={false}
              onClick={() => setSelectedLevel('all')}
            >
              <StatIcon>📊</StatIcon>
              <StatInfo>
                <StatValue $isActive={false}>{alertCounts.total}</StatValue>
                <StatLabel $isActive={false}>Total</StatLabel>
              </StatInfo>
            </StatCard>
            
            <StatCard 
              $isActive={selectedLevel === AlertLevel.EMERGENCY}
              onClick={() => setSelectedLevel(AlertLevel.EMERGENCY)}
            >
              <StatIcon>🚨</StatIcon>
              <StatInfo>
                <StatValue $isActive={selectedLevel === AlertLevel.EMERGENCY}>{alertCounts.emergency}</StatValue>
                <StatLabel $isActive={selectedLevel === AlertLevel.EMERGENCY}>Urgences</StatLabel>
              </StatInfo>
            </StatCard>
            
            <StatCard 
              $isActive={selectedLevel === AlertLevel.CRITICAL}
              onClick={() => setSelectedLevel(AlertLevel.CRITICAL)}
            >
              <StatIcon>❌</StatIcon>
              <StatInfo>
                <StatValue $isActive={selectedLevel === AlertLevel.CRITICAL}>{alertCounts.critical}</StatValue>
                <StatLabel $isActive={selectedLevel === AlertLevel.CRITICAL}>Critiques</StatLabel>
              </StatInfo>
            </StatCard>
            
            <StatCard 
              $isActive={selectedLevel === AlertLevel.WARNING}
              onClick={() => setSelectedLevel(AlertLevel.WARNING)}
            >
              <StatIcon>⚠️</StatIcon>
              <StatInfo>
                <StatValue $isActive={selectedLevel === AlertLevel.WARNING}>{alertCounts.warning}</StatValue>
                <StatLabel $isActive={selectedLevel === AlertLevel.WARNING}>Avertissements</StatLabel>
              </StatInfo>
            </StatCard>
            
            <StatCard 
              $isActive={selectedLevel === AlertLevel.INFO}
              onClick={() => setSelectedLevel(AlertLevel.INFO)}
            >
              <StatIcon>ℹ️</StatIcon>
              <StatInfo>
                <StatValue $isActive={selectedLevel === AlertLevel.INFO}>{alertCounts.info}</StatValue>
                <StatLabel $isActive={selectedLevel === AlertLevel.INFO}>Informations</StatLabel>
              </StatInfo>
            </StatCard>
          </StatsGrid>
        </StatsSection>

        {/* Section principale des alertes */}
        <MainSection>
          <SectionHeader>
            <SectionTitle>
              {selectedLevel === 'all' 
                ? 'Toutes les alertes' 
                : `Alertes ${
                    selectedLevel === AlertLevel.EMERGENCY ? 'urgentes' :
                    selectedLevel === AlertLevel.CRITICAL ? 'critiques' :
                    selectedLevel === AlertLevel.WARNING ? 'd\'avertissement' :
                    'd\'information'
                  }`
              }
            </SectionTitle>
            <FilterInfo>
              {filteredAlerts.length} {filteredAlerts.length > 1 ? 'résultats' : 'résultat'}
            </FilterInfo>
          </SectionHeader>
          
          <AlertContainer>
            <AlertPanel
              alerts={filteredAlerts}
              onAcknowledge={handleAcknowledgeAlert}
              maxItems={50}
            />
          </AlertContainer>
        </MainSection>
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

const AlertCount = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  color: white;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
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

const StatsSection = styled.section`
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
`;

const StatCard = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  background: ${props => props.$isActive 
    ? 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)' 
    : 'white'
  };
  padding: 28px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.$isActive 
      ? 'rgba(255, 255, 255, 0.5)' 
      : 'linear-gradient(90deg, #60a5fa 0%, #34d399 100%)'
    };
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div<{ $isActive?: boolean }>`
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

const StatValue = styled.span<{ $isActive?: boolean }>`
  font-size: 28px;
  font-weight: 800;
  color: ${props => props.$isActive ? 'white' : '#1f2937'};
  line-height: 1;
`;

const StatLabel = styled.span<{ $isActive?: boolean }>`
  font-size: 14px;
  color: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
  font-weight: 600;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MainSection = styled.section`
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

const FilterInfo = styled.span`
  font-size: 16px;
  color: #60a5fa;
  font-weight: 600;
  background: rgba(96, 165, 250, 0.1);
  padding: 8px 16px;
  border-radius: 12px;
`;

const AlertContainer = styled.div`
  /* Styles héritent du composant AlertPanel */
`;

export default Alerts;