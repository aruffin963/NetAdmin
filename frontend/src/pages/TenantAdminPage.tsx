import React, { useState } from 'react';
import styled from 'styled-components';
import ThemeCustomizer from '../components/Tenant/ThemeCustomizer';
import BrandingManager from '../components/Tenant/BrandingManager';

const TenantAdminContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 32px;
  animation: fadeIn 0.8s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
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

const Description = styled.p`
  color: #64748b;
  font-size: 16px;
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

const TabContainer = styled.div`
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 32px;
`;

const TabList = styled.div`
  display: flex;
  gap: 0;
  overflow-x: auto;
`;

const Tab = styled.button<{ isActive?: boolean }>`
  padding: 12px 24px;
  border: none;
  background: ${props => props.isActive ? 'white' : 'transparent'};
  color: ${props => props.isActive ? '#60a5fa' : '#64748b'};
  font-size: 14px;
  font-weight: ${props => props.isActive ? '600' : '500'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.isActive ? '#60a5fa' : 'transparent'};
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    color: #60a5fa;
    background: #f8fafc;
  }
`;

const TabContent = styled.div`
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const SettingsCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
`;

const Toggle = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 12px;
`;

const ToggleInput = styled.input`
  position: relative;
  width: 44px;
  height: 24px;
  appearance: none;
  background: #e2e8f0;
  border-radius: 12px;
  transition: background 0.2s ease;
  cursor: pointer;
  
  &:checked {
    background: #60a5fa;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:checked::before {
    transform: translateX(20px);
  }
`;

const ToggleLabel = styled.span`
  font-size: 14px;
  color: #374151;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const DomainList = styled.div`
  margin-top: 16px;
`;

const DomainItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #fafafa;
`;

const DomainInfo = styled.div`
  flex: 1;
`;

const DomainName = styled.div`
  font-weight: 500;
  color: #1e293b;
`;

const DomainStatus = styled.div<{ isActive?: boolean }>`
  font-size: 12px;
  color: ${props => props.isActive ? '#10b981' : '#64748b'};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border: 1px solid ${props => 
    props.variant === 'primary' ? '#60a5fa' : 
    props.variant === 'danger' ? '#ef4444' : '#e2e8f0'
  };
  border-radius: 8px;
  background: ${props => 
    props.variant === 'primary' ? '#60a5fa' : 
    props.variant === 'danger' ? '#fef2f2' : 'white'
  };
  color: ${props => 
    props.variant === 'primary' ? 'white' : 
    props.variant === 'danger' ? '#dc2626' : '#475569'
  };
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => 
      props.variant === 'primary' ? '#3b82f6' : 
      props.variant === 'danger' ? '#fee2e2' : '#f8fafc'
    };
    border-color: ${props => 
      props.variant === 'primary' ? '#3b82f6' : 
      props.variant === 'danger' ? '#dc2626' : '#60a5fa'
    };
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }
`;

const TenantAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'domains' | 'themes' | 'branding'>('general');

  // Données d'exemple pour le tenant
  const [tenantSettings, setTenantSettings] = useState({
    organizationName: 'Acme Corporation',
    domain: 'acme.netadmin.pro',
    subdomain: 'acme',
    maxUsers: 100,
    maxNetworks: 50,
    isActive: true
  });

  const [features, setFeatures] = useState({
    ipManagement: true,
    monitoring: true,
    topology: true,
    subnetting: true,
    alerts: true,
    reporting: false,
    api: true,
    sso: false,
    customBranding: true,
    multiUser: true
  });

  const [preferences, setPreferences] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h',
    sessionTimeout: 480,
    requireMFA: false
  });

  const domains = [
    { id: '1', domain: 'acme.netadmin.pro', subdomain: 'acme', isActive: true, isPrimary: true },
    { id: '2', domain: 'acme-dev.netadmin.pro', subdomain: 'acme-dev', isActive: false, isPrimary: false }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setTenantSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature as keyof typeof features] }));
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const renderGeneralSettings = () => (
    <SettingsGrid>
      <SettingsCard>
        <CardTitle>🏢 Informations Générales</CardTitle>
        
        <FormGroup>
          <Label>Nom de l'organisation</Label>
          <Input
            type="text"
            value={tenantSettings.organizationName}
            onChange={(e) => handleSettingChange('organizationName', e.target.value)}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Domaine principal</Label>
          <Input
            type="text"
            value={tenantSettings.domain}
            onChange={(e) => handleSettingChange('domain', e.target.value)}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Sous-domaine</Label>
          <Input
            type="text"
            value={tenantSettings.subdomain}
            onChange={(e) => handleSettingChange('subdomain', e.target.value)}
          />
        </FormGroup>
        
        <Toggle>
          <ToggleInput
            type="checkbox"
            checked={tenantSettings.isActive}
            onChange={(e) => handleSettingChange('isActive', e.target.checked)}
          />
          <ToggleLabel>Tenant actif</ToggleLabel>
        </Toggle>
      </SettingsCard>

      <SettingsCard>
        <CardTitle>📊 Limites et Quotas</CardTitle>
        
        <FormGroup>
          <Label>Nombre maximum d'utilisateurs</Label>
          <Input
            type="number"
            value={tenantSettings.maxUsers}
            onChange={(e) => handleSettingChange('maxUsers', parseInt(e.target.value))}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Nombre maximum de réseaux</Label>
          <Input
            type="number"
            value={tenantSettings.maxNetworks}
            onChange={(e) => handleSettingChange('maxNetworks', parseInt(e.target.value))}
          />
        </FormGroup>
      </SettingsCard>

      <SettingsCard>
        <CardTitle>⚙️ Préférences</CardTitle>
        
        <FormGroup>
          <Label>Langue</Label>
          <Select
            value={preferences.language}
            onChange={(e) => handlePreferenceChange('language', e.target.value)}
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label>Fuseau horaire</Label>
          <Select
            value={preferences.timezone}
            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
          >
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label>Timeout de session (minutes)</Label>
          <Input
            type="number"
            value={preferences.sessionTimeout}
            onChange={(e) => handlePreferenceChange('sessionTimeout', parseInt(e.target.value))}
          />
        </FormGroup>
        
        <Toggle>
          <ToggleInput
            type="checkbox"
            checked={preferences.requireMFA}
            onChange={(e) => handlePreferenceChange('requireMFA', e.target.checked)}
          />
          <ToggleLabel>Authentification multi-facteurs obligatoire</ToggleLabel>
        </Toggle>
      </SettingsCard>
    </SettingsGrid>
  );

  const renderFeaturesSettings = () => (
    <SettingsCard>
      <CardTitle>🎛️ Fonctionnalités Activées</CardTitle>
      <FeatureGrid>
        {Object.entries(features).map(([feature, enabled]) => (
          <Toggle key={feature}>
            <ToggleInput
              type="checkbox"
              checked={enabled}
              onChange={() => handleFeatureToggle(feature)}
            />
            <ToggleLabel>
              {feature === 'ipManagement' && 'Gestion IP'}
              {feature === 'monitoring' && 'Monitoring'}
              {feature === 'topology' && 'Topologie'}
              {feature === 'subnetting' && 'Subnetting'}
              {feature === 'alerts' && 'Alertes'}
              {feature === 'reporting' && 'Rapports'}
              {feature === 'api' && 'API REST'}
              {feature === 'sso' && 'SSO'}
              {feature === 'customBranding' && 'Branding personnalisé'}
              {feature === 'multiUser' && 'Multi-utilisateurs'}
            </ToggleLabel>
          </Toggle>
        ))}
      </FeatureGrid>
    </SettingsCard>
  );

  const renderDomainsSettings = () => (
    <SettingsCard>
      <CardTitle>🌐 Gestion des Domaines</CardTitle>
      
      <DomainList>
        {domains.map((domain) => (
          <DomainItem key={domain.id}>
            <DomainInfo>
              <DomainName>
                {domain.subdomain ? `${domain.subdomain}.` : ''}{domain.domain}
                {domain.isPrimary && ' (Principal)'}
              </DomainName>
              <DomainStatus isActive={domain.isActive}>
                {domain.isActive ? '✅ Actif' : '⏸️ Inactif'}
              </DomainStatus>
            </DomainInfo>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary">Configurer</Button>
              <Button variant="danger">Supprimer</Button>
            </div>
          </DomainItem>
        ))}
      </DomainList>
      
      <div style={{ marginTop: '20px' }}>
        <Button variant="primary">➕ Ajouter un Domaine</Button>
      </div>
    </SettingsCard>
  );

  return (
    <TenantAdminContainer>
      <Header>
        <Title>
          🏢 Administration Tenant
        </Title>
        <Description>
          Configurez et personnalisez votre instance NetAdmin Pro selon vos besoins organisationnels.
        </Description>
      </Header>

      <TabContainer>
        <TabList>
          <Tab
            isActive={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
          >
            ⚙️ Général
          </Tab>
          <Tab
            isActive={activeTab === 'features'}
            onClick={() => setActiveTab('features')}
          >
            🎛️ Fonctionnalités
          </Tab>
          <Tab
            isActive={activeTab === 'domains'}
            onClick={() => setActiveTab('domains')}
          >
            🌐 Domaines
          </Tab>
          <Tab
            isActive={activeTab === 'themes'}
            onClick={() => setActiveTab('themes')}
          >
            🎨 Thèmes
          </Tab>
          <Tab
            isActive={activeTab === 'branding'}
            onClick={() => setActiveTab('branding')}
          >
            🖼️ Branding
          </Tab>
        </TabList>
      </TabContainer>

      <TabContent>
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'features' && renderFeaturesSettings()}
        {activeTab === 'domains' && renderDomainsSettings()}
        {activeTab === 'themes' && <ThemeCustomizer />}
        {activeTab === 'branding' && <BrandingManager />}
      </TabContent>
    </TenantAdminContainer>
  );
};

export default TenantAdminPage;