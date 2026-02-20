import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../config/api';

interface ZabbixStatus {
  connected: boolean;
  lastAuth?: string;
  authToken?: string;
  error?: string;
}

interface ZabbixHost {
  hostid: string;
  name: string;
  status: number;
  interfaces?: Array<{
    interfaceid: string;
    ip: string;
    dns: string;
    type: string;
  }>;
}

interface ZabbixMetrics {
  hostId: string;
  hostName: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  uptime?: number;
}

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.h1`
  color: #000000;
  margin-bottom: 20px;
  font-size: 28px;
`;

const Card = styled.div`
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const CardTitle = styled.h2`
  color: #000000;
  font-size: 18px;
  margin-top: 0;
  margin-bottom: 15px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  color: #000000;
  font-weight: 600;
  margin-bottom: 5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #4CAF50;
    background-color: #f9fff9;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 10px 20px;
  background-color: ${props => (props.variant === 'danger' ? '#dc3545' : '#4CAF50')};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    background-color: ${props => (props.variant === 'danger' ? '#c82333' : '#45a049')};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span<{ connected: boolean }>`
  display: inline-block;
  padding: 5px 10px;
  background-color: ${props => (props.connected ? '#4CAF50' : '#dc3545')};
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const HostsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
`;

const HostCard = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
`;

const HostName = styled.h3`
  color: #000000;
  margin: 0 0 10px 0;
  font-size: 16px;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;

  &:last-child {
    border-bottom: none;
  }
`;

const MetricLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const MetricValue = styled.span`
  color: #000000;
  font-weight: 600;
`;

const Message = styled.div<{ type?: 'success' | 'error' | 'info' }>`
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  background-color: ${props => {
    switch (props.type) {
      case 'success':
        return '#d4edda';
      case 'error':
        return '#f8d7da';
      case 'info':
      default:
        return '#d1ecf1';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success':
        return '#155724';
      case 'error':
        return '#721c24';
      case 'info':
      default:
        return '#0c5460';
    }
  }};
  border: 1px solid
    ${props => {
      switch (props.type) {
        case 'success':
          return '#c3e6cb';
        case 'error':
          return '#f5c6cb';
        case 'info':
        default:
          return '#bee5eb';
      }
    }};
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ZabbixPage: React.FC = () => {
  const [url, setUrl] = useState('http://localhost/zabbix');
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<ZabbixStatus>({ connected: false });
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [metrics, setMetrics] = useState<ZabbixMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Vérifier l'état de la connexion au démarrage
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/zabbix/status`);
      const data = await response.json();
      setStatus(data.data);
    } catch (error) {
      console.error('Error checking Zabbix status:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Update environment variables first
      const updateResponse = await fetch(`${API_BASE_URL}/zabbix/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, username, password }),
      });

      const result = await updateResponse.json();

      if (result.success) {
        setMessage({ type: 'success', text: '✅ Connected to Zabbix successfully!' });
        setStatus(result.data);
        await fetchHosts();
        await fetchMetrics();
      } else {
        setMessage({ type: 'error', text: `❌ ${result.message}` });
        setStatus(result.data);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      setMessage({ type: 'error', text: `❌ Error: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/zabbix/disconnect`, {
        method: 'POST',
      });
      const result = await response.json();
      setStatus(result.data);
      setHosts([]);
      setMetrics([]);
      setMessage({ type: 'info', text: 'Disconnected from Zabbix' });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Disconnection failed';
      setMessage({ type: 'error', text: `Error: ${errorMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/zabbix/hosts`);
      const result = await response.json();
      if (result.success) {
        setHosts(result.data);
        setMessage({ type: 'success', text: `✅ Loaded ${result.count} hosts from Zabbix` });
      }
    } catch (error) {
      console.error('Error fetching hosts:', error);
      setMessage({ type: 'error', text: 'Failed to fetch hosts' });
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/zabbix/metrics`);
      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  return (
    <Container>
      <Header>⚙️ Zabbix Integration</Header>

      <Card>
        <CardTitle>
          Connection Status: <StatusBadge connected={status.connected}>{status.connected ? 'Connected' : 'Disconnected'}</StatusBadge>
        </CardTitle>

        {message && <Message type={message.type}>{message.text}</Message>}

        <FormGroup>
          <Label>Zabbix Server URL</Label>
          <Input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="http://localhost/zabbix"
            disabled={loading}
          />
        </FormGroup>

        <FormGroup>
          <Label>Username</Label>
          <Input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Admin"
            disabled={loading}
          />
        </FormGroup>

        <FormGroup>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your Zabbix password"
            disabled={loading}
          />
        </FormGroup>

        <ButtonGroup>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? <LoadingSpinner /> : '🔗'} Connect to Zabbix
          </Button>
          {status.connected && (
            <Button onClick={handleDisconnect} variant="danger" disabled={loading}>
              🔌 Disconnect
            </Button>
          )}
        </ButtonGroup>
      </Card>

      {status.connected && (
        <>
          {hosts.length > 0 && (
            <Card>
              <CardTitle>📊 Zabbix Hosts ({hosts.length})</CardTitle>
              <HostsList>
                {hosts.map(host => (
                  <HostCard key={host.hostid}>
                    <HostName>{host.name}</HostName>
                    <MetricRow>
                      <MetricLabel>Host ID:</MetricLabel>
                      <MetricValue>{host.hostid}</MetricValue>
                    </MetricRow>
                    <MetricRow>
                      <MetricLabel>Status:</MetricLabel>
                      <MetricValue>{host.status === 0 ? '✅ Active' : '❌ Disabled'}</MetricValue>
                    </MetricRow>
                    {host.interfaces && host.interfaces.length > 0 && (
                      <MetricRow>
                        <MetricLabel>IP Address:</MetricLabel>
                        <MetricValue>{host.interfaces[0].ip || host.interfaces[0].dns}</MetricValue>
                      </MetricRow>
                    )}
                  </HostCard>
                ))}
              </HostsList>
            </Card>
          )}

          {metrics.length > 0 && (
            <Card>
              <CardTitle>📈 Host Metrics</CardTitle>
              <HostsList>
                {metrics.map(metric => (
                  <HostCard key={metric.hostId}>
                    <HostName>{metric.hostName}</HostName>
                    {metric.cpu !== undefined && (
                      <MetricRow>
                        <MetricLabel>CPU Usage:</MetricLabel>
                        <MetricValue>{metric.cpu.toFixed(2)}%</MetricValue>
                      </MetricRow>
                    )}
                    {metric.memory !== undefined && (
                      <MetricRow>
                        <MetricLabel>Memory Usage:</MetricLabel>
                        <MetricValue>{metric.memory.toFixed(2)}%</MetricValue>
                      </MetricRow>
                    )}
                    {metric.disk !== undefined && (
                      <MetricRow>
                        <MetricLabel>Disk Usage:</MetricLabel>
                        <MetricValue>{metric.disk.toFixed(2)}%</MetricValue>
                      </MetricRow>
                    )}
                    {metric.uptime !== undefined && (
                      <MetricRow>
                        <MetricLabel>Uptime:</MetricLabel>
                        <MetricValue>{Math.floor(metric.uptime / 86400)} days</MetricValue>
                      </MetricRow>
                    )}
                  </HostCard>
                ))}
              </HostsList>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default ZabbixPage;
