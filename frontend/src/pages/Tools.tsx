import React, { useState } from 'react';
import styled from 'styled-components';
import Subnetting from './Subnetting';
import PasswordGeneratorPage from './PasswordGeneratorPage';

// ============= STYLES =============

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
  color: #000000;
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

type TabType = 'subnetting' | 'passwords';

const Tools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('subnetting');

  return (
    <Container>
      <Header>
        <Title>
          🛠️ Outils
        </Title>
      </Header>

      <TabContainer>
        <TabList>
          <Tab 
            active={activeTab === 'subnetting'} 
            onClick={() => setActiveTab('subnetting')}
          >
            🌐 Subnetting
          </Tab>
          <Tab 
            active={activeTab === 'passwords'} 
            onClick={() => setActiveTab('passwords')}
          >
            🔐 Mots de passe
          </Tab>
        </TabList>

        <TabContent>
          {activeTab === 'subnetting' && <Subnetting />}
          {activeTab === 'passwords' && <PasswordGeneratorPage />}
        </TabContent>
      </TabContainer>
    </Container>
  );
};

export default Tools;
