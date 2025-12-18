import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaRobot, FaPlus, FaPlay, FaTrash, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import { AGENTLESS_API } from '../config/api';

interface MonitoredDevice {
  id: number;
  device_id: string;
  ip_address: string;
  hostname: string;
  device_type: 'linux' | 'windows' | 'network' | 'unknown';
  snmp_enabled: boolean;
  ssh_enabled: boolean;
  wmi_enabled: boolean;
  monitoring_enabled: boolean;
  status: 'online' | 'offline' | 'unknown';
  last_check: string;
}

interface DeviceMetric {
  id: number;
  hostname: string;
  dns_name?: string;
  cpu_usage: number | null;
  memory_usage: number | null;
  memory_total: number | null;
  disk_usage: number | null;
  disk_total: number | null;
  uptime: number | null;
  status: 'online' | 'offline';
  response_time: number;
  source: 'snmp' | 'ssh' | 'wmi' | 'ping';
  collected_at: string;
}

const AgentlessMonitoring: React.FC = () => {
  const [devices, setDevices] = useState<MonitoredDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MonitoredDevice | null>(null);
  const [metrics, setMetrics] = useState<DeviceMetric[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({ 
    ip_address: '', 
    hostname: '',
    device_type: 'unknown' as 'linux' | 'windows' | 'network' | 'unknown',
    snmp_community: 'public',
    ssh_user: '',
    ssh_password: '',
    ssh_port: 22
  });
  const [loading, setLoading] = useState(false);
  const [monitoringInProgress, setMonitoringInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les équipements
  useEffect(() => {
    loadDevices();
  }, []);

  // Recharger les métriques quand le device sélectionné change
  useEffect(() => {
    if (selectedDevice) {
      loadMetrics(selectedDevice.id);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${AGENTLESS_API}/devices`);
      const result = await response.json();
      if (result.success) {
        setDevices(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement équipements:', error);
      setError('Impossible de charger les équipements. Assurez-vous que le serveur est lancé.');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async (deviceId: number) => {
    try {
      const response = await fetch(
        `${AGENTLESS_API}/metrics/${deviceId}?limit=50&hours=24`
      );
      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement métriques:', error);
      setError('Impossible de charger les métriques.');
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!newDevice.ip_address.trim()) {
      setError('Veuillez entrer une adresse IP');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${AGENTLESS_API}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess(`Équipement ${newDevice.ip_address} ajouté avec succès`);
        setShowAddForm(false);
        setNewDevice({ 
          ip_address: '', 
          hostname: '', 
          device_type: 'unknown',
          snmp_community: 'public',
          ssh_user: '',
          ssh_password: '',
          ssh_port: 22
        });
        await loadDevices();
      } else {
        const errorMsg = result.message || 'Erreur lors de l\'ajout';
        const details = result.errors?.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        setError(details ? `${errorMsg} (${details})` : errorMsg);
      }
    } catch (error: any) {
      console.error('Erreur ajout équipement:', error);
      setError(error.message || 'Erreur réseau lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleMonitor = async (deviceId: number) => {
    try {
      setMonitoringInProgress(String(deviceId));
      const response = await fetch(
        `${AGENTLESS_API}/monitor/${deviceId}`,
        { method: 'POST' }
      );
      const result = await response.json();
      if (result.success) {
        await loadDevices();
        if (selectedDevice?.id === deviceId) {
          await loadMetrics(deviceId);
        }
      }
    } catch (error) {
      console.error('Erreur monitoring:', error);
    } finally {
      setMonitoringInProgress(null);
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      const response = await fetch(
        `${AGENTLESS_API}/devices/${deviceId}`,
        { method: 'DELETE' }
      );
      const result = await response.json();
      if (result.success) {
        await loadDevices();
        setSelectedDevice(null);
        setMetrics([]);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaRobot /> Monitoring Agentless
        </Title>
        <HeaderActions>
          <DeviceCount>{devices.length} équipements</DeviceCount>
          <AddButton onClick={() => setShowAddForm(!showAddForm)}>
            <FaPlus /> Ajouter un équipement
          </AddButton>
        </HeaderActions>
      </Header>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <FormCard>
          <FormTitle>Ajouter un équipement à monitorer</FormTitle>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          <Form onSubmit={handleAddDevice}>
            <FormGroup>
              <Label>Adresse IP</Label>
              <Input
                type="text"
                placeholder="192.168.1.100"
                value={newDevice.ip_address}
                onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Hostname (optionnel)</Label>
              <Input
                type="text"
                placeholder="serveur-01"
                value={newDevice.hostname}
                onChange={(e) => setNewDevice({ ...newDevice, hostname: e.target.value })}
              />
            </FormGroup>
            <FormGroup>
              <Label>Type d'équipement</Label>
              <Select
                value={newDevice.device_type}
                onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value as any })}
              >
                <option value="unknown">Auto-détection (par défaut)</option>
                <option value="linux">Linux / Server</option>
                <option value="windows">Windows Server</option>
                <option value="network">Routeur / Switch / Équipement réseau</option>
              </Select>
            </FormGroup>

            {/* Champs SNMP pour équipements réseau UNIQUEMENT */}
            {newDevice.device_type === 'network' && (
              <FormGroup>
                <Label>🔑 SNMP Community</Label>
                <Input
                  type="text"
                  placeholder="public"
                  value={newDevice.snmp_community}
                  onChange={(e) => setNewDevice({ ...newDevice, snmp_community: e.target.value })}
                />
              </FormGroup>
            )}

            {/* Champs SSH pour Linux UNIQUEMENT */}
            {newDevice.device_type === 'linux' && (
              <>
                <FormGroup>
                  <Label>👤 SSH User</Label>
                  <Input
                    type="text"
                    placeholder="root"
                    value={newDevice.ssh_user}
                    onChange={(e) => setNewDevice({ ...newDevice, ssh_user: e.target.value })}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>🔐 SSH Password (optionnel)</Label>
                  <Input
                    type="password"
                    placeholder="password"
                    value={newDevice.ssh_password}
                    onChange={(e) => setNewDevice({ ...newDevice, ssh_password: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>🔌 SSH Port</Label>
                  <Input
                    type="number"
                    placeholder="22"
                    value={newDevice.ssh_port}
                    onChange={(e) => setNewDevice({ ...newDevice, ssh_port: parseInt(e.target.value) || 22 })}
                  />
                </FormGroup>
              </>
            )}

            {/* Message pour auto-détection */}
            {newDevice.device_type === 'unknown' && (
              <FormGroup style={{ width: '100%' }}>
                <Label>ℹ️ Auto-détection</Label>
                <InfoMessage>Aucun paramètre requis. Le système détectera automatiquement le type d'équipement.</InfoMessage>
              </FormGroup>
            )}

            <FormButtons>
              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Ajout...' : 'Ajouter'}
              </SubmitButton>
              <CancelButton type="button" onClick={() => setShowAddForm(false)}>
                Annuler
              </CancelButton>
            </FormButtons>
          </Form>
        </FormCard>
      )}

      <MainContent>
        {/* Liste des équipements */}
        <DevicesPanel>
          <SectionTitle>Équipements</SectionTitle>
          {loading && !devices.length ? (
            <LoadingText>Chargement...</LoadingText>
          ) : devices.length === 0 ? (
            <EmptyState>Aucun équipement. Ajoutes-en un pour commencer!</EmptyState>
          ) : (
            <DevicesList>
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  selected={selectedDevice?.id === device.id}
                  onClick={() => setSelectedDevice(device)}
                  status={device.status}
                >
                  <DeviceHeader>
                    <DeviceInfo>
                      <DeviceIP>{device.ip_address}</DeviceIP>
                      <DeviceHostname>{device.hostname || 'unknown'}</DeviceHostname>
                    </DeviceInfo>
                    <StatusBadge status={device.status}>
                      {device.status === 'online' ? <FaCheck /> : <FaTimes />}
                      {device.status}
                    </StatusBadge>
                  </DeviceHeader>
                  
                  <DeviceType>
                    <TypeBadge>{device.device_type}</TypeBadge>
                    {device.snmp_enabled && <ProtocolBadge>SNMP</ProtocolBadge>}
                    {device.ssh_enabled && <ProtocolBadge>SSH</ProtocolBadge>}
                    {device.wmi_enabled && <ProtocolBadge>WMI</ProtocolBadge>}
                  </DeviceType>

                  <DeviceActions>
                    <ActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMonitor(device.id);
                      }}
                      disabled={monitoringInProgress === String(device.id)}
                    >
                      <FaPlay /> Monitor
                    </ActionButton>
                    <DeleteButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDevice(device.id);
                      }}
                    >
                      <FaTrash />
                    </DeleteButton>
                  </DeviceActions>
                </DeviceCard>
              ))}
            </DevicesList>
          )}
        </DevicesPanel>

        {/* Métriques détaillées */}
        <MetricsPanel>
          {selectedDevice ? (
            <>
              <SectionTitle>
                Métriques - {selectedDevice.hostname || selectedDevice.ip_address}
              </SectionTitle>

              {metrics.length === 0 ? (
                <EmptyState>
                  Aucune métrique collectée. Clique sur "Monitor" pour lancer un scan.
                </EmptyState>
              ) : (
                <MetricsList>
                  {metrics.length > 0 ? metrics.map((metric, idx) => {
                    const uptimeText = metric.uptime ? 
                      (() => {
                        const days = Math.floor(metric.uptime / 86400);
                        const hours = Math.floor((metric.uptime % 86400) / 3600);
                        const mins = Math.floor((metric.uptime % 3600) / 60);
                        return `${days}j ${hours}h ${mins}m`;
                      })() : 'N/A';

                    const memPercent = metric.memory_usage && metric.memory_total ? 
                      ((metric.memory_usage / metric.memory_total) * 100).toFixed(1) : null;
                    
                    const diskPercent = metric.disk_usage && metric.disk_total ? 
                      ((metric.disk_usage / metric.disk_total) * 100).toFixed(1) : null;

                    return (
                      <MetricItem key={idx}>
                        <MetricHeader>
                          <MetricTitleSection>
                            <div>
                              <MetricHostname>{metric.hostname || 'unknown'}</MetricHostname>
                              {metric.dns_name && <MetricDNS>{metric.dns_name}</MetricDNS>}
                            </div>
                          </MetricTitleSection>
                          <MetricRightSection>
                            <StatusBadgeMetric status={metric.status}>
                              {metric.status === 'online' ? '🟢 En ligne' : '🔴 Hors ligne'}
                            </StatusBadgeMetric>
                            <MetricTime>
                              <FaClock /> {new Date(metric.collected_at).toLocaleTimeString('fr-FR')}
                            </MetricTime>
                          </MetricRightSection>
                        </MetricHeader>
                        
                        <MetricsGrid>
                          {metric.cpu_usage !== null && metric.cpu_usage !== undefined ? (
                            <MetricBox>
                              <MetricLabel>💻 CPU</MetricLabel>
                              <MetricValue>{metric.cpu_usage.toFixed(1)}%</MetricValue>
                              <ProgressBar value={metric.cpu_usage} max={100} />
                            </MetricBox>
                          ) : (
                            <MetricBox>
                              <MetricLabel>💻 CPU</MetricLabel>
                              <MetricValue>-</MetricValue>
                              <MetricSmall>Non collecté</MetricSmall>
                            </MetricBox>
                          )}
                          
                          {memPercent !== null ? (
                            <MetricBox>
                              <MetricLabel>🧠 Mémoire</MetricLabel>
                              <MetricValue>{memPercent}%</MetricValue>
                              <MetricSmall>
                                {(metric.memory_usage! / 1024 / 1024 / 1024).toFixed(1)}GB / {(metric.memory_total! / 1024 / 1024 / 1024).toFixed(1)}GB
                              </MetricSmall>
                              <ProgressBar value={parseFloat(memPercent)} max={100} />
                            </MetricBox>
                          ) : (
                            <MetricBox>
                              <MetricLabel>🧠 Mémoire</MetricLabel>
                              <MetricValue>-</MetricValue>
                              <MetricSmall>Non collecté</MetricSmall>
                            </MetricBox>
                          )}

                          {diskPercent !== null ? (
                            <MetricBox>
                              <MetricLabel>💾 Stockage</MetricLabel>
                              <MetricValue>{diskPercent}%</MetricValue>
                              <MetricSmall>
                                {(metric.disk_usage! / 1024 / 1024 / 1024).toFixed(1)}GB / {(metric.disk_total! / 1024 / 1024 / 1024).toFixed(1)}GB
                              </MetricSmall>
                              <ProgressBar value={parseFloat(diskPercent)} max={100} />
                            </MetricBox>
                          ) : (
                            <MetricBox>
                              <MetricLabel>💾 Stockage</MetricLabel>
                              <MetricValue>-</MetricValue>
                              <MetricSmall>Non collecté</MetricSmall>
                            </MetricBox>
                          )}

                          {metric.uptime !== null && metric.uptime !== undefined ? (
                            <MetricBox>
                              <MetricLabel>⏱️ Uptime</MetricLabel>
                              <MetricValue>{uptimeText}</MetricValue>
                            </MetricBox>
                          ) : (
                            <MetricBox>
                              <MetricLabel>⏱️ Uptime</MetricLabel>
                              <MetricValue>-</MetricValue>
                              <MetricSmall>Non collecté</MetricSmall>
                            </MetricBox>
                          )}
                          
                          <MetricBox>
                            <MetricLabel>📡 Source</MetricLabel>
                            <MetricValue>{metric.source.toUpperCase()}</MetricValue>
                            <MetricSmall>{metric.response_time}ms</MetricSmall>
                          </MetricBox>
                        </MetricsGrid>
                      </MetricItem>
                    );
                  }) : (
                    <EmptyState>Aucune métrique collectée. Clique sur "Monitor" pour lancer un scan.</EmptyState>
                  )}
                </MetricsList>
              )}
            </>
          ) : (
            <EmptyState>Sélectionne un équipement pour voir ses métriques</EmptyState>
          )}
        </MetricsPanel>
      </MainContent>
    </Container>
  );
};

// ============= STYLES =============

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #c33;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  background: #efe;
  color: #363;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #363;
  font-size: 14px;
`;

const InfoMessage = styled.div`
  background: rgba(0, 102, 255, 0.1);
  color: #0066ff;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #0066ff;
  font-size: 14px;
  font-weight: 500;
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e8f0ff 100%);
  padding: 40px 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  padding: 32px 40px;
  border-radius: 24px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.1);
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
  gap: 16px;
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

const HeaderActions = styled.div`
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

const AddButton = styled.button`
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

const FormCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  padding: 32px 40px;
  border-radius: 24px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.08);
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
`;

const FormTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px 0;
`;

const Form = styled.form`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const FormGroup = styled.div`
  flex: 1;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid rgba(0, 102, 255, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  background: white;
  color: #1f2937;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
  }

  &:hover {
    border-color: #0066ff;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid rgba(0, 102, 255, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  background: white;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
  }

  &:hover {
    border-color: #0066ff;
  }

  option {
    color: #1f2937;
    background: white;
  }
`;

const FormButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const SubmitButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #0066ff 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e5e7eb;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  padding: 32px;
  border-radius: 24px;
  border: 1.5px solid #e0e8ff;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.08);
  backdrop-filter: blur(10px);
`;

const DevicesPanel = styled(Panel)``;
const MetricsPanel = styled(Panel)``;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.3px;

  &::before {
    content: '';
    width: 5px;
    height: 22px;
    background: linear-gradient(180deg, #0066ff 0%, #10b981 100%);
    border-radius: 3px;
  }
`;

const DevicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DeviceCard = styled.div<{ selected: boolean; status: string }>`
  padding: 18px;
  background: ${props => props.selected ? 'rgba(0, 102, 255, 0.08)' : 'white'};
  border: 2px solid ${props => props.selected ? '#0066ff' : '#e0e8ff'};
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #0066ff;
    background: rgba(0, 102, 255, 0.08);
  }
`;

const DeviceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
`;

const DeviceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DeviceIP = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
`;

const DeviceHostname = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DeviceType = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const TypeBadge = styled.span`
  font-size: 11px;
  background: rgba(0, 102, 255, 0.15);
  color: #0066ff;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ProtocolBadge = styled.span`
  font-size: 11px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
`;

const DeviceActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  background: linear-gradient(135deg, #0066ff 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 102, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 102, 255, 0.3);
    border-radius: 10px;

    &:hover {
      background: rgba(0, 102, 255, 0.5);
    }
  }
`;

const MetricItem = styled.div`
  padding: 16px;
  background: rgba(0, 102, 255, 0.03);
  border: 1px solid rgba(0, 102, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 102, 255, 0.06);
    border-color: rgba(0, 102, 255, 0.2);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
`;

const MetricTitleSection = styled.div`
  flex: 1;
`;

const MetricHostname = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
`;

const MetricDNS = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
`;

const MetricRightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
`;

const MetricTime = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const StatusBadgeMetric = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
`;

const MetricBox = styled.div`
  padding: 12px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e0e8ff;
`;

const ProgressBar = styled.div<{ value: number; max: number }>`
  height: 6px;
  background: #e0e8ff;
  border-radius: 3px;
  margin-top: 6px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => (props.value / props.max) * 100}%;
    background: linear-gradient(90deg, #0066ff, #00d4ff);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
`;

const MetricLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 700;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MetricValue = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: #0066ff;
  line-height: 1;
`;

const MetricSmall = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 15px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 15px;
  font-weight: 500;
`;

export default AgentlessMonitoring;
