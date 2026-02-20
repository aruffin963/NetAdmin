import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import SettingsService, { UserSettings } from '../services/settingsService';

// ============= STYLED COMPONENTS =============

const Container = styled.div`
  min-height: 100vh;
  background: #f0f2f7;
  padding: 40px 20px;
`;

const Content = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
  background: white;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left: 5px solid ${colors.primary.blue};

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Icon = styled.div`
  font-size: 48px;
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 15px;
`;

const SectionCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;

  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 28px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SettingItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f9fafb;

  &:focus {
    outline: none;
    border-color: ${colors.primary.blue};
    background: white;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f9fafb;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${colors.primary.blue};
    background: white;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;


const ToggleSwitch = styled.input`
  cursor: pointer;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 16px;

  input {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  span {
    color: #374151;
    font-weight: 500;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: ${colors.primary.blue};
          color: white;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
            filter: brightness(1.1);
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
            filter: brightness(1.1);
          }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #64748b;
          border: 2px solid #e5e7eb;
          
          &:hover {
            background: white;
            color: #1e293b;
            border-color: ${colors.primary.blue};
          }
        `;
    }
  }}

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    opacity: 0.6;
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border-left: 4px solid ${colors.primary.blue};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
`;

const WarningBox = styled.div`
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #92400e;
  font-weight: 500;
`;

const NotificationBox = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 16px 20px;
  border-radius: 10px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #dcfce7;
          color: #166534;
          border-left: 4px solid #22c55e;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
          border-left: 4px solid #ef4444;
        `;
      case 'info':
        return `
          background: #dbeafe;
          color: #1e40af;
          border-left: 4px solid ${colors.primary.blue};
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

// ============= MAIN COMPONENT =============

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Partial<UserSettings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getSettings();
      setSettings(data);
    } catch (error: any) {
      showNotification('Erreur lors du chargement des paramètres', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async (section: string) => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await SettingsService.updateSettings(settings);
      setSettings(updated);
      showNotification(`${section} sauvegardés avec succès`, 'success');
    } catch (error: any) {
      showNotification('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestZabbix = async () => {
    if (!settings?.zabbixUrl || !settings?.zabbixKey) {
      showNotification('URL et clé API Zabbix sont requises', 'error');
      return;
    }
    setTesting(prev => ({ ...prev, zabbix: true }));
    const result = await SettingsService.testZabbixConnection(settings.zabbixUrl, settings.zabbixKey);
    showNotification(result.message, result.success ? 'success' : 'error');
    setTesting(prev => ({ ...prev, zabbix: false }));
  };

  const handleTestWebhook = async () => {
    if (!settings?.webhookUrl) {
      showNotification('URL Webhook requise', 'error');
      return;
    }
    setTesting(prev => ({ ...prev, webhook: true }));
    const result = await SettingsService.testWebhook(settings.webhookUrl);
    showNotification(result.message, result.success ? 'success' : 'error');
    setTesting(prev => ({ ...prev, webhook: false }));
  };

  const handleClearCache = async () => {
    setTesting(prev => ({ ...prev, cache: true }));
    const result = await SettingsService.clearCache();
    showNotification(result.message, result.success ? 'success' : 'error');
    setTesting(prev => ({ ...prev, cache: false }));
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  if (loading || !settings) {
    return (
      <Container>
        <Content>
          <Header>
            <Icon>⚙️</Icon>
            <HeaderInfo>
              <Title>Paramètres Globaux</Title>
              <Subtitle>Configurez les préférences et paramètres système</Subtitle>
            </HeaderInfo>
          </Header>
          <SectionCard>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <div>Chargement des paramètres...</div>
            </div>
          </SectionCard>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        {/* Header */}
        <Header>
          <Icon>⚙️</Icon>
          <HeaderInfo>
            <Title>Paramètres Globaux</Title>
            <Subtitle>Configurez les préférences et paramètres système</Subtitle>
          </HeaderInfo>
        </Header>

        {/* Notification */}
        {notification.show && (
          <NotificationBox type={notification.type}>
            {notification.message}
          </NotificationBox>
        )}

        {/* Section 1: Préférences Générales */}
        <SectionCard>
          <SectionTitle>🌍 Préférences Générales</SectionTitle>
          <SettingsGrid>
            <SettingItem>
              <Label>Langue</Label>
              <Select
                value={settings.language || 'fr'}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </Select>
            </SettingItem>

            <SettingItem>
              <Label>Format de la Date</Label>
              <Select
                value={settings.dateFormat || 'dd/mm/yyyy'}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
              >
                <option value="dd/mm/yyyy">JJ/MM/AAAA</option>
                <option value="mm/dd/yyyy">MM/JJ/AAAA</option>
                <option value="yyyy-mm-dd">AAAA-MM-JJ</option>
              </Select>
            </SettingItem>

            <SettingItem>
              <Label>Format Heure</Label>
              <Select
                value={settings.timeFormat || '24h'}
                onChange={(e) => handleChange('timeFormat', e.target.value)}
              >
                <option value="24h">24h</option>
                <option value="12h">12h (AM/PM)</option>
              </Select>
            </SettingItem>

            <SettingItem>
              <Label>Fuseau Horaire</Label>
              <Select
                value={settings.timezone || 'Europe/Paris'}
                onChange={(e) => handleChange('timezone', e.target.value)}
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </Select>
            </SettingItem>
          </SettingsGrid>

          <ButtonGroup>
            <Button variant="primary" onClick={() => handleSave('Préférences')} disabled={saving}>
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder Préférences'}
            </Button>
          </ButtonGroup>
        </SectionCard>

        {/* Section 2: Paramètres Système */}
        <SectionCard>
          <SectionTitle>🔧 Paramètres Système</SectionTitle>
          <InfoBox>
            ℹ️ Ces paramètres affectent le fonctionnement global du système. Soyez prudent lors de leur modification.
          </InfoBox>

          <SettingsGrid>
            <SettingItem>
              <Label>Rétention des Logs (jours)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={settings.logRetention || 30}
                onChange={(e) => handleChange('logRetention', parseInt(e.target.value))}
              />
            </SettingItem>

            <SettingItem>
              <Label>Interval de Scan (minutes)</Label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={settings.scanInterval || 60}
                onChange={(e) => handleChange('scanInterval', parseInt(e.target.value))}
              />
            </SettingItem>

            <SettingItem>
              <Label>Format d'Export</Label>
              <Select
                value={settings.exportFormat || 'json'}
                onChange={(e) => handleChange('exportFormat', e.target.value)}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
                <option value="pdf">PDF</option>
              </Select>
            </SettingItem>

            <SettingItem>
              <ToggleLabel>
                <ToggleSwitch
                  type="checkbox"
                  checked={settings.autoBackup || false}
                  onChange={(e) => handleChange('autoBackup', e.target.checked)}
                />
                <span>Sauvegarde Automatique</span>
              </ToggleLabel>
            </SettingItem>
          </SettingsGrid>

          <ButtonGroup>
            <Button variant="primary" onClick={() => handleSave('Système')} disabled={saving}>
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </Button>
          </ButtonGroup>
        </SectionCard>

        {/* Section 3: Paramètres d'Intégration */}
        <SectionCard>
          <SectionTitle>🔗 Paramètres d'Intégration</SectionTitle>
          <WarningBox>
            ⚠️ Gardez vos clés API secrètes. Ne les partagez jamais publiquement.
          </WarningBox>

          <SettingsGrid>
            <SettingItem>
              <Label>URL Zabbix</Label>
              <Input
                type="url"
                value={settings.zabbixUrl || ''}
                onChange={(e) => handleChange('zabbixUrl', e.target.value)}
                placeholder="https://zabbix.example.com"
              />
            </SettingItem>

            <SettingItem>
              <Label>Clé API Zabbix</Label>
              <Input
                type="password"
                value={settings.zabbixKey || ''}
                onChange={(e) => handleChange('zabbixKey', e.target.value)}
              />
            </SettingItem>

            <SettingItem>
              <Label>URL Webhook (Optionnel)</Label>
              <Input
                type="url"
                value={settings.webhookUrl || ''}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </SettingItem>
          </SettingsGrid>

          <ButtonGroup>
            <Button variant="primary" onClick={() => handleSave('Intégration')} disabled={saving}>
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </Button>
            <Button onClick={handleTestZabbix} disabled={testing.zabbix || !settings.zabbixUrl || !settings.zabbixKey}>
              {testing.zabbix ? '⏳ Test...' : '🧪 Tester Zabbix'}
            </Button>
            <Button onClick={handleTestWebhook} disabled={testing.webhook || !settings.webhookUrl}>
              {testing.webhook ? '⏳ Test...' : '🧪 Tester WebHook'}
            </Button>
          </ButtonGroup>
        </SectionCard>

        {/* Section 4: Paramètres Avancés */}
        <SectionCard>
          <SectionTitle>⚡ Paramètres Avancés</SectionTitle>
          <InfoBox>
            ℹ️ Les paramètres avancés nécessitent une expérience technique. Modifiez-les avec prudence.
          </InfoBox>

          <SettingsGrid>
            <SettingItem>
              <Label>Délai d'Expiration Session (minutes)</Label>
              <Input
                type="number"
                min="5"
                max="1440"
                value={settings.sessionTimeout || 30}
                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
              />
            </SettingItem>

            <SettingItem>
              <Label>TTL Cache (secondes)</Label>
              <Input
                type="number"
                min="60"
                max="86400"
                value={settings.cacheTTL || 3600}
                onChange={(e) => handleChange('cacheTTL', parseInt(e.target.value))}
              />
            </SettingItem>
          </SettingsGrid>

          <div style={{ marginTop: '24px' }}>
            <ToggleLabel>
              <ToggleSwitch
                type="checkbox"
                checked={settings.trustDevices || false}
                onChange={(e) => handleChange('trustDevices', e.target.checked)}
              />
              <span>Mémoriser les Appareils de Confiance</span>
            </ToggleLabel>

            <ToggleLabel>
              <ToggleSwitch
                type="checkbox"
                checked={settings.enableCache || false}
                onChange={(e) => handleChange('enableCache', e.target.checked)}
              />
              <span>Activer le Cache</span>
            </ToggleLabel>
          </div>

          <ButtonGroup>
            <Button variant="primary" onClick={() => handleSave('Avancés')} disabled={saving}>
              {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </Button>
            <Button variant="secondary" onClick={handleClearCache} disabled={testing.cache}>
              {testing.cache ? '⏳ Nettoyage...' : '🔄 Réinitialiser le Cache'}
            </Button>
          </ButtonGroup>
        </SectionCard>
      </Content>
    </Container>
  );
};

export default SettingsPage;
