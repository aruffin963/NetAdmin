import React, { useState } from 'react';
import styled from 'styled-components';
import { UnifiedNetworkPlanner } from '../components/Subnetting/UnifiedNetworkPlanner';
import { IPAnalyzer } from '../components/Subnetting/IPAnalyzer';
import { AdvancedNetworkTools } from '../components/Subnetting/AdvancedNetworkTools';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 32px;
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

const TabContainer = styled.div`
  margin-bottom: 32px;
`;

const TabList = styled.div`
  display: flex;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 6px;
  margin-bottom: 24px;
  overflow-x: auto;
  gap: 4px;
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 
    'white' : 
    'transparent'};
  border: ${props => props.active ? '1px solid #e2e8f0' : 'none'};
  padding: 14px 20px;
  border-radius: 12px;
  font-weight: 600;
  color: ${props => props.active ? '#1e293b' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: ${props => props.active ? 
    '0 2px 8px rgba(0, 0, 0, 0.1)' : 
    'none'};
  font-size: 14px;

  &:hover {
    color: ${props => props.active ? '#1e293b' : '#1e293b'};
    background: ${props => props.active ? 
      'white' : 
      '#f1f5f9'};
  }
`;

const TabContent = styled.div`
  min-height: 600px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatsSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;
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
  margin-bottom: 8px;
  color: #1e293b;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoPanel = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const InfoTitle = styled.h4`
  color: #0c4a6e;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
`;

const InfoText = styled.p`
  color: #0369a1;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
`;

type TabType = 'planner' | 'analyzer' | 'tools';

const Subnetting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('planner');
  const [currentCalculation, setCurrentCalculation] = useState<any>(null);

  const stats = [
    { value: '3', label: 'Outils Disponibles' },
    { value: '32', label: 'Classes CIDR' },
    { value: '∞', label: 'Calculs Possibles' },
    { value: '100%', label: 'Précision' }
  ];

  return (
    <Container>
      <Header>
        <Title>
          🌐 Subnetting & Planification Réseau
        </Title>
      </Header>

      {/* Statistiques des outils */}
      <StatsSection>
        <SectionTitle>Vue d'ensemble</SectionTitle>
        <StatsContainer>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsContainer>
      </StatsSection>

      <TabContainer>
        <TabList>
          <Tab 
            active={activeTab === 'planner'} 
            onClick={() => setActiveTab('planner')}
          >
            🌐 Planificateur Réseau
          </Tab>
          <Tab 
            active={activeTab === 'analyzer'} 
            onClick={() => setActiveTab('analyzer')}
          >
            🔍 Analyseur IP
          </Tab>
          <Tab 
            active={activeTab === 'tools'} 
            onClick={() => setActiveTab('tools')}
          >
            🛠️ Outils Avancés
          </Tab>
        </TabList>

        <TabContent>
          {activeTab === 'planner' && (
            <>
              <InfoPanel>
                <InfoTitle>🌐 Planificateur Réseau Unifié</InfoTitle>
                <InfoText>
                  Outil complet combinant le calculateur de sous-réseaux CIDR et le planificateur VLSM.
                  Choisissez la méthode adaptée à vos besoins de segmentation réseau.
                </InfoText>
              </InfoPanel>
              <UnifiedNetworkPlanner onResultChange={setCurrentCalculation} />
            </>
          )}

          {activeTab === 'analyzer' && (
            <>
              <InfoPanel>
                <InfoTitle>🔍 Analyseur d'Adresses IP</InfoTitle>
                <InfoText>
                  Analysez en détail n'importe quelle adresse IP : classification, type, représentations 
                  numériques et informations réseau. Parfait pour comprendre la structure d'une adresse.
                </InfoText>
              </InfoPanel>
              <IPAnalyzer />
            </>
          )}

          {activeTab === 'tools' && (
            <>
              <InfoPanel>
                <InfoTitle>🛠️ Outils Avancés</InfoTitle>
                <InfoText>
                  Outils de validation, optimisation et gestion avancée des configurations réseau.
                  Scanner de réseau, détection de conflits, calculs d'efficacité et convertisseurs.
                </InfoText>
              </InfoPanel>
              <AdvancedNetworkTools />
            </>
          )}
        </TabContent>
      </TabContainer>

      {currentCalculation && (
        <div style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          color: 'white', 
          padding: '16px 24px', 
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          ✅ Calcul mis à jour : {currentCalculation.networkAddress}/{currentCalculation.cidr}
        </div>
      )}
    </Container>
  );
};

export default Subnetting;