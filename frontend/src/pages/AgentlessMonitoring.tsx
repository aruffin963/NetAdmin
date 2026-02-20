import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import { FaRobot, FaPlus, FaPlay, FaTrash, FaCheck, FaTimes, FaChartLine } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AGENTLESS_API } from '../config/api';
import { useNotification } from '../context/NotificationContext';

// ============ INTERFACES ============

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
  source: 'snmp' | 'ssh' | 'wmi' | 'ping' | 'zabbix' | 'local';
  collected_at: string;
}

interface AlertLevel {
  level: 'ok' | 'warning' | 'critical';
  message: string;
}

interface HistoryPoint {
  timestamp: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  uptime?: number;
}

// ============ STYLED COMPONENTS ============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
`;

const Title = styled.h1`
  color: #000000;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const DeviceCount = styled.div`
  padding: 8px 16px;
  background: #e0e8ff;
  color: #0066ff;
  border-radius: 8px;
  font-weight: 700;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${colors.primary.blue};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  }
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 20px;
  min-height: 600px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ListPanel = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ListHeader = styled.div`
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 2px solid #e0e8ff;
  font-weight: 700;
  color: #1f2937;
`;

const DevicesList = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f0f4ff;
  }

  &::-webkit-scrollbar-thumb {
    background: #0066ff;
    border-radius: 3px;

    &:hover {
      background: #0052cc;
    }
  }
`;

const DeviceItemWrapper = styled.div<{ selected?: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid #e0e8ff;
  background: ${props => props.selected ? '#f0f4ff' : 'white'};
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid ${props => props.selected ? '#0066ff' : 'transparent'};

  &:hover {
    background: #f8f9fa;
  }
`;

const DeviceItemContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const DeviceInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const DeviceIP = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  word-break: break-all;
`;

const DeviceHostname = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const StatusIndicator = styled.div<{ status: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
  flex-shrink: 0;
  margin-top: 2px;
`;

const DetailPanel = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const DetailHeader = styled.div`
  border-bottom: 2px solid #e0e8ff;
  padding-bottom: 16px;
`;

const DetailTitle = styled.h2`
  color: #1f2937;
  font-size: 18px;
  margin: 0 0 8px 0;
`;

const DetailSubtitle = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ variant?: 'status' | 'source' | 'type' | 'alert' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  
  ${props => {
    switch (props.variant) {
      case 'status':
        return `background: #d1fae5; color: #065f46;`;
      case 'source':
        return `background: #dbeafe; color: #1e40af;`;
      case 'type':
        return `background: #fef3c7; color: #92400e;`;
      case 'alert':
        return `background: #fee2e2; color: #991b1b;`;
      default:
        return `background: #e0e8ff; color: #0066ff;`;
    }
  }}
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const MetricCard = styled.div<{ alertLevel?: 'ok' | 'warning' | 'critical' }>`
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid ${props => {
    switch (props.alertLevel) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  }};
`;

const MetricLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const MetricValue = styled.div`
  font-size: 20px;
  font-weight: 900;
  color: #1f2937;
`;

const MetricSubtext = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
`;

const ChartSection = styled.div`
  border-top: 2px solid #e0e8ff;
  padding-top: 16px;
`;

const ChartTitle = styled.h3`
  color: #1f2937;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 2px solid #e0e8ff;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: ${colors.primary.blue};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s ease;

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
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: #ef4444;
    color: white;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  gap: 12px;
`;

const AlertBox = styled.div<{ type: 'error' | 'warning' | 'success' }>`
  padding: 12px 16px;
  border-radius: 8px;
  background: ${props => {
    switch (props.type) {
      case 'error': return '#fee2e2';
      case 'warning': return '#fef3c7';
      case 'success': return '#d1fae5';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'error': return '#991b1b';
      case 'warning': return '#92400e';
      case 'success': return '#065f46';
    }
  }};
  font-size: 13px;
  border-left: 3px solid ${props => {
    switch (props.type) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'success': return '#10b981';
    }
  }};
`;

// ============ MAIN COMPONENT ============

const AgentlessMonitoring: React.FC = () => {
  const [devices, setDevices] = useState<MonitoredDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MonitoredDevice | null>(null);
  const [metrics, setMetrics] = useState<DeviceMetric | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [monitoringInProgress, setMonitoringInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { showConfirm } = useNotification();

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadMetrics(selectedDevice.id);
      loadHistory(selectedDevice.id);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      setDebugInfo('Loading devices...');
      const response = await fetch(`${AGENTLESS_API}/devices`);
      const result = await response.json();
      console.log('Devices API Response:', result);
      setDebugInfo(`Devices loaded: ${result.data?.length || 0}`);
      if (result.success) {
        setDevices(result.data);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      setError('Failed to load devices');
      setDebugInfo(`Error: ${error}`);
    }
  };

  const loadMetrics = async (deviceId: number) => {
    try {
      setDebugInfo(`Loading metrics for device ${deviceId}...`);
      const response = await fetch(`${AGENTLESS_API}/metrics/${deviceId}?limit=1`);
      const result = await response.json();
      console.log('Metrics API Response:', result);
      setDebugInfo(`Metrics received: ${result.data?.length || 0} records`);
      if (result.success && result.data.length > 0) {
        setMetrics(result.data[0]);
        console.log('Current metrics:', result.data[0]);
      } else {
        setDebugInfo('No metrics data returned from API');
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      setDebugInfo(`Error loading metrics: ${error}`);
    }
  };

  const loadHistory = async (deviceId: number) => {
    try {
      setDebugInfo(`Loading history for device ${deviceId}...`);
      const response = await fetch(`${AGENTLESS_API}/metrics/${deviceId}?limit=100&hours=24`);
      const result = await response.json();
      console.log('History API Response:', result);
      setDebugInfo(`History API returned ${result.data?.length || 0} points`);
      
      if (result.success && result.data && result.data.length > 0) {
        // Transform data for charts - filter out entries with all null values
        const chartData = result.data
          .map((m: DeviceMetric) => ({
            timestamp: new Date(m.collected_at).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            cpu: m.cpu_usage !== null ? parseFloat(m.cpu_usage.toString()) : null,
            memory: m.memory_usage !== null ? parseFloat(m.memory_usage.toString()) : null,
            disk: m.disk_usage !== null ? parseFloat(m.disk_usage.toString()) : null,
            uptime: m.uptime !== null ? m.uptime : null
          }))
          .filter((point: HistoryPoint) => point.cpu !== null || point.memory !== null || point.disk !== null);
        
        console.log('Transformed Chart Data:', chartData);
        setDebugInfo(`Transformed to ${chartData.length} valid data points`);
        setHistory(chartData);
      } else {
        console.warn('No history data available');
        setDebugInfo('No valid history data');
        setHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setDebugInfo(`Error loading history: ${error}`);
      setHistory([]);
    }
  };

  const handleMonitor = async (deviceId: number) => {
    try {
      setMonitoringInProgress(String(deviceId));
      const response = await fetch(`${AGENTLESS_API}/monitor/${deviceId}`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        setSuccess('✅ Monitoring data updated');
        await loadDevices();
        if (selectedDevice?.id === deviceId) {
          await loadMetrics(deviceId);
          await loadHistory(deviceId);
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError('❌ Monitoring failed');
      console.error('Error monitoring:', error);
    } finally {
      setMonitoringInProgress(null);
    }
  };

  const handleDeleteDevice = (deviceId: number) => {
    showConfirm({
      title: 'Supprimer l\'équipement',
      message: 'Êtes-vous sûr de vouloir supprimer cet équipement?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDangerous: true,
      onConfirm: async () => {
        try {
            const response = await fetch(`${AGENTLESS_API}/devices/${deviceId}`, {
              method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
              await loadDevices();
              setSelectedDevice(null);
              setMetrics(null);
              setHistory([]);
              setSuccess('Device deleted');
              setTimeout(() => setSuccess(null), 3000);
            }
          } catch (error) {
            setError('Error deleting device');
            console.error('Error:', error);
          }
        }
      });
  };

  // Alert level calculation
  const calculateAlertLevel = (
    metric: string,
    value: number | null | undefined
  ): AlertLevel => {
    if (value === null || value === undefined) {
      return { level: 'ok', message: 'No data' };
    }

    if (metric === 'cpu') {
      if (value >= 90) return { level: 'critical', message: 'Critical' };
      if (value >= 80) return { level: 'warning', message: 'Warning' };
      return { level: 'ok', message: 'Normal' };
    }

    if (metric === 'memory') {
      if (value >= 95) return { level: 'critical', message: 'Critical' };
      if (value >= 85) return { level: 'warning', message: 'Warning' };
      return { level: 'ok', message: 'Normal' };
    }

    if (metric === 'disk') {
      if (value >= 90) return { level: 'critical', message: 'Critical' };
      if (value >= 80) return { level: 'warning', message: 'Warning' };
      return { level: 'ok', message: 'Normal' };
    }

    return { level: 'ok', message: 'Normal' };
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaRobot /> Monitoring Agentless
        </Title>
        <HeaderActions>
          <DeviceCount>{devices.length} devices</DeviceCount>
          <AddButton>
            <FaPlus /> Add Device
          </AddButton>
        </HeaderActions>
      </Header>

      {error && <AlertBox type="error">{error}</AlertBox>}
      {success && <AlertBox type="success">{success}</AlertBox>}
      
      {/* DEBUG PANEL */}
      <AlertBox type="warning">
        🔍 DEBUG: {debugInfo}
      </AlertBox>

      <MainLayout>
        {/* LEFT PANEL - DEVICES LIST */}
        <ListPanel>
          <ListHeader>📊 Devices ({devices.length})</ListHeader>
          {devices.length === 0 ? (
            <EmptyState>
              <FaRobot size={40} />
              No devices configured
            </EmptyState>
          ) : (
            <DevicesList>
              {devices.map(device => (
                <DeviceItemWrapper
                  key={device.id}
                  selected={selectedDevice?.id === device.id}
                  onClick={() => setSelectedDevice(device)}
                >
                  <DeviceItemContent>
                    <StatusIndicator status={device.status} />
                    <DeviceInfo>
                      <DeviceIP>{device.ip_address}</DeviceIP>
                      <DeviceHostname>{device.hostname || 'N/A'}</DeviceHostname>
                    </DeviceInfo>
                  </DeviceItemContent>
                </DeviceItemWrapper>
              ))}
            </DevicesList>
          )}
        </ListPanel>

        {/* RIGHT PANEL - DETAILS & CHARTS */}
        <DetailPanel>
          {!selectedDevice ? (
            <EmptyState>
              <FaChartLine size={40} />
              Select a device to view details
            </EmptyState>
          ) : (
            <>
              <DetailHeader>
                <DetailTitle>{selectedDevice.hostname || selectedDevice.ip_address}</DetailTitle>
                <DetailSubtitle>
                  <Badge variant="status">
                    {selectedDevice.status === 'online' ? <FaCheck /> : <FaTimes />}
                    {selectedDevice.status.toUpperCase()}
                  </Badge>
                  <Badge variant="type">{selectedDevice.device_type}</Badge>
                  {metrics && (
                    <Badge variant="source">
                      {metrics.source.toUpperCase()}
                    </Badge>
                  )}
                </DetailSubtitle>
              </DetailHeader>

              {metrics && (
                <>
                  {/* METRICS GRID */}
                  <MetricsGrid>
                    {metrics.cpu_usage !== null && (
                      <MetricCard alertLevel={calculateAlertLevel('cpu', metrics.cpu_usage).level}>
                        <MetricLabel>🔥 CPU Usage</MetricLabel>
                        <MetricValue>{metrics.cpu_usage.toFixed(1)}%</MetricValue>
                        <MetricSubtext>{calculateAlertLevel('cpu', metrics.cpu_usage).message}</MetricSubtext>
                      </MetricCard>
                    )}
                    {metrics.memory_usage !== null && (
                      <MetricCard alertLevel={calculateAlertLevel('memory', metrics.memory_usage).level}>
                        <MetricLabel>💾 Memory</MetricLabel>
                        <MetricValue>{metrics.memory_usage.toFixed(1)}%</MetricValue>
                        <MetricSubtext>{calculateAlertLevel('memory', metrics.memory_usage).message}</MetricSubtext>
                      </MetricCard>
                    )}
                    {metrics.disk_usage !== null && (
                      <MetricCard alertLevel={calculateAlertLevel('disk', metrics.disk_usage).level}>
                        <MetricLabel>💿 Disk</MetricLabel>
                        <MetricValue>{metrics.disk_usage.toFixed(1)}%</MetricValue>
                        <MetricSubtext>{calculateAlertLevel('disk', metrics.disk_usage).message}</MetricSubtext>
                      </MetricCard>
                    )}
                    {metrics.uptime !== null && (
                      <MetricCard alertLevel="ok">
                        <MetricLabel>⏱️ Uptime</MetricLabel>
                        <MetricValue>{(metrics.uptime / 86400).toFixed(1)}</MetricValue>
                        <MetricSubtext>days</MetricSubtext>
                      </MetricCard>
                    )}
                  </MetricsGrid>

                  {/* CHARTS SECTION */}
                  {history && history.length > 0 ? (
                    <ChartSection>
                      <ChartTitle>
                        <FaChartLine /> 24h Trends ({history.length} points)
                      </ChartTitle>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={history} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e8ff" />
                          <XAxis 
                            dataKey="timestamp" 
                            tick={{ fontSize: 10 }}
                            stroke="#9ca3af"
                            interval={Math.floor(history.length / 6)}
                          />
                          <YAxis 
                            tick={{ fontSize: 10 }}
                            stroke="#9ca3af"
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e8ff',
                              borderRadius: '8px',
                              padding: '8px'
                            }}
                            formatter={(value: any) => value !== null ? value.toFixed(2) : 'N/A'}
                          />
                          <Legend />
                          {history.some(h => h.cpu !== null && h.cpu !== undefined) && (
                            <Line
                              type="monotone"
                              dataKey="cpu"
                              stroke="#ef4444"
                              dot={false}
                              strokeWidth={2}
                              name="CPU %"
                              isAnimationActive={true}
                            />
                          )}
                          {history.some(h => h.memory !== null && h.memory !== undefined) && (
                            <Line
                              type="monotone"
                              dataKey="memory"
                              stroke="#3b82f6"
                              dot={false}
                              strokeWidth={2}
                              name="Memory %"
                              isAnimationActive={true}
                            />
                          )}
                          {history.some(h => h.disk !== null && h.disk !== undefined) && (
                            <Line
                              type="monotone"
                              dataKey="disk"
                              stroke="#f59e0b"
                              dot={false}
                              strokeWidth={2}
                              name="Disk %"
                              isAnimationActive={true}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartSection>
                  ) : (
                    <ChartSection>
                      <ChartTitle>
                        <FaChartLine /> 24h Trends
                      </ChartTitle>
                      <EmptyState style={{ height: '250px' }}>
                        <div>📊 No historical data available yet</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          Click "Monitor Now" to collect first data point
                        </div>
                      </EmptyState>
                    </ChartSection>
                  )}
                </>
              )}

              {/* ACTION BUTTONS */}
              <ActionButtons>
                <ActionButton
                  onClick={() => handleMonitor(selectedDevice.id)}
                  disabled={monitoringInProgress === String(selectedDevice.id)}
                >
                  <FaPlay /> {monitoringInProgress === String(selectedDevice.id) ? 'Monitoring...' : 'Monitor Now'}
                </ActionButton>
                <DeleteButton onClick={() => handleDeleteDevice(selectedDevice.id)}>
                  <FaTrash /> Delete
                </DeleteButton>
              </ActionButtons>
            </>
          )}
        </DetailPanel>
      </MainLayout>
    </Container>
  );
};

export default AgentlessMonitoring;
