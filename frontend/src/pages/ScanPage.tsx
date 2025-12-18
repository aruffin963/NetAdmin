import React, { useState } from 'react';
import styled from 'styled-components';
import { FaWifi, FaNetworkWired, FaSearch, FaPlay, FaStop, FaDownload, FaFilter, FaCheck, FaTimes, FaClock, FaServer } from 'react-icons/fa';

// ============= STYLES =============

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
`;

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;

  ${props => {
    switch (props.variant) {
      case 'secondary':
        return `
          background: #ecf0f1;
          color: #2c3e50;
          &:hover { background: #d5dbdb; }
        `;
      case 'danger':
        return `
          background: #e74c3c;
          color: white;
          &:hover { background: #c0392b; }
        `;
      case 'success':
        return `
          background: #27ae60;
          color: white;
          &:hover { background: #229954; }
        `;
      default:
        return `
          background: #3498db;
          color: white;
          &:hover { background: #2980b9; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const StatusBox = styled.div<{ status?: 'idle' | 'scanning' | 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;

  ${props => {
    switch (props.status) {
      case 'scanning':
        return `
          background: #e3f2fd;
          color: #1976d2;
          border-left: 4px solid #1976d2;
        `;
      case 'success':
        return `
          background: #d4edda;
          color: #155724;
          border-left: 4px solid #27ae60;
        `;
      case 'error':
        return `
          background: #f8d7da;
          color: #721c24;
          border-left: 4px solid #e74c3c;
        `;
      default:
        return `
          background: #f5f5f5;
          color: #666;
          border-left: 4px solid #bdc3c7;
        `;
    }
  }}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatBox = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;

  .stat-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: #3498db;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SearchBox = styled.div`
  display: flex;
  gap: 0.5rem;

  input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 0.95rem;

    &:focus {
      outline: none;
      border-color: #3498db;
    }
  }
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 600px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #bdc3c7;
    border-radius: 4px;

    &:hover {
      background: #95a5a6;
    }
  }
`;

const ResultItem = styled.div<{ status?: 'online' | 'offline' | 'open' | 'closed' }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-left: 4px solid;
  border-left-color: ${props => {
    switch (props.status) {
      case 'online':
      case 'open':
        return '#27ae60';
      case 'offline':
      case 'closed':
        return '#e74c3c';
      default:
        return '#bdc3c7';
    }
  }};
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ResultIcon = styled.div<{ status?: 'online' | 'offline' | 'open' | 'closed' }>`
  font-size: 1.5rem;
  color: ${props => {
    switch (props.status) {
      case 'online':
      case 'open':
        return '#27ae60';
      case 'offline':
      case 'closed':
        return '#e74c3c';
      default:
        return '#bdc3c7';
    }
  }};
`;

const ResultInfo = styled.div`
  flex: 1;

  .result-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.25rem;
  }

  .result-detail {
    font-size: 0.85rem;
    color: #7f8c8d;
  }
`;

const FilterBox = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;

  .filter-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #2c3e50;

    input {
      cursor: pointer;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;

  svg {
    font-size: 3rem;
    color: #bdc3c7;
    margin-bottom: 1rem;
  }

  p {
    margin: 0;
    font-size: 1.05rem;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 1rem;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2980b9);
    transition: width 0.3s;
  }
`;

// ============= TYPES =============

interface ScanDevice {
  ip: string;
  hostname: string;
  status: 'online' | 'offline';
  responseTime: number;
}

interface ScanPort {
  ip: string;
  port: number;
  protocol: 'tcp' | 'udp';
  status: 'open' | 'closed';
  service: string;
}

interface ScanConfig {
  type: 'subnet' | 'ports';
  network: string;
  portRange?: string;
  timeout: number;
}

// ============= MAIN COMPONENT =============

const ScanPage: React.FC = () => {
  // Configuration state
  const [config, setConfig] = useState<ScanConfig>({
    type: 'subnet',
    network: '192.168.1.0/24',
    timeout: 5,
    portRange: '80,443,22,3306,5432'
  });

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [devices, setDevices] = useState<ScanDevice[]>([]);
  const [ports, setPorts] = useState<ScanPort[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  // Start scan handler
  const handleStartScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setDevices([]);
    setPorts([]);

    try {
      const endpoint = config.type === 'subnet' 
        ? 'http://localhost:5000/api/scan/subnet'
        : 'http://localhost:5000/api/scan/ports';

      const payload = config.type === 'subnet'
        ? { network: config.network, timeout: config.timeout }
        : { ip: config.network, ports: config.portRange, timeout: config.timeout };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + Math.random() * 20, 90));
      }, 500);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      const result = await response.json();

      if (result.success) {
        if (config.type === 'subnet') {
          setDevices(result.data);
        } else {
          setPorts(result.data);
        }
      } else {
        console.error('Scan error:', result.message);
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  const handleExport = () => {
    const data = config.type === 'subnet' ? devices : ports;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${Date.now()}.json`;
    a.click();
  };

  // Filter results
  const filteredDevices = devices.filter(device => {
    const matchSearch = device.ip.includes(searchQuery) || device.hostname.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || device.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredPorts = ports.filter(port => {
    const matchSearch = port.ip.includes(searchQuery) || port.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || port.status === (statusFilter as any);
    return matchSearch && matchStatus;
  });

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const openPortsCount = ports.filter(p => p.status === 'open').length;

  return (
    <Container>
      <Header>
        <h1>
          <FaWifi /> Scanner Réseau
        </h1>
      </Header>

      <TwoColumn>
        {/* LEFT PANEL - CONFIGURATION */}
        <Card>
          <SectionTitle>
            <FaNetworkWired /> Configuration du Scan
          </SectionTitle>

          <StatusBox status={isScanning ? 'scanning' : 'idle'}>
            {isScanning ? (
              <>
                <FaClock /> Scan en cours...
              </>
            ) : devices.length > 0 || ports.length > 0 ? (
              <>
                <FaCheck /> Scan terminé
              </>
            ) : (
              <>
                <FaSearch /> Prêt à scanner
              </>
            )}
          </StatusBox>

          <FormGroup>
            <Label>Type de scan</Label>
            <Select
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value as 'subnet' | 'ports' })}
              disabled={isScanning}
            >
              <option value="subnet">Découverte de sous-réseau</option>
              <option value="ports">Scan de ports</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Réseau/Adresse IP</Label>
            <Input
              type="text"
              placeholder="ex: 192.168.1.0/24 ou 192.168.1.1"
              value={config.network}
              onChange={(e) => setConfig({ ...config, network: e.target.value })}
              disabled={isScanning}
            />
          </FormGroup>

          {config.type === 'ports' && (
            <FormGroup>
              <Label>Ports à scanner</Label>
              <Input
                type="text"
                placeholder="ex: 80,443,22,3306"
                value={config.portRange || ''}
                onChange={(e) => setConfig({ ...config, portRange: e.target.value })}
                disabled={isScanning}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label>Timeout (secondes)</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={config.timeout}
              onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
              disabled={isScanning}
            />
          </FormGroup>

          <ButtonGroup>
            <Button
              variant="primary"
              onClick={handleStartScan}
              disabled={isScanning}
            >
              <FaPlay /> Lancer le scan
            </Button>
            {isScanning && (
              <Button
                variant="danger"
                onClick={handleStopScan}
              >
                <FaStop /> Arrêter
              </Button>
            )}
          </ButtonGroup>

          {isScanning && (
            <ProgressBar>
              <div className="progress-fill" style={{ width: `${scanProgress}%` }} />
            </ProgressBar>
          )}

          <StatsGrid>
            {config.type === 'subnet' ? (
              <>
                <StatBox>
                  <div className="stat-value">{devices.length}</div>
                  <div className="stat-label">Appareils trouvés</div>
                </StatBox>
                <StatBox>
                  <div className="stat-value">{onlineCount}</div>
                  <div className="stat-label">En ligne</div>
                </StatBox>
              </>
            ) : (
              <>
                <StatBox>
                  <div className="stat-value">{ports.length}</div>
                  <div className="stat-label">Ports scannés</div>
                </StatBox>
                <StatBox>
                  <div className="stat-value">{openPortsCount}</div>
                  <div className="stat-label">Ports ouverts</div>
                </StatBox>
              </>
            )}
          </StatsGrid>

          {(devices.length > 0 || ports.length > 0) && (
            <Button variant="secondary" onClick={handleExport}>
              <FaDownload /> Exporter les résultats
            </Button>
          )}
        </Card>

        {/* RIGHT PANEL - RESULTS */}
        <Card>
          <ResultsHeader>
            <SectionTitle style={{ margin: 0 }}>
              <FaServer /> Résultats
            </SectionTitle>
          </ResultsHeader>

          <SearchBox>
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>

          <FilterBox>
            <div className="filter-title">
              <FaFilter /> Filtrer par statut
            </div>
            <CheckboxGroup>
              <label>
                <input
                  type="radio"
                  name="status"
                  value="all"
                  checked={statusFilter === 'all'}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                />
                Tous
              </label>
              {config.type === 'subnet' ? (
                <>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="online"
                      checked={statusFilter === 'online'}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    />
                    En ligne
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="offline"
                      checked={statusFilter === 'offline'}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    />
                    Hors ligne
                  </label>
                </>
              ) : (
                <>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="open"
                      checked={statusFilter === 'online'}
                      onChange={() => setStatusFilter('online')}
                    />
                    Ouverts
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="closed"
                      checked={statusFilter === 'offline'}
                      onChange={() => setStatusFilter('offline')}
                    />
                    Fermés
                  </label>
                </>
              )}
            </CheckboxGroup>
          </FilterBox>

          <ResultsContainer>
            {config.type === 'subnet' ? (
              filteredDevices.length === 0 ? (
                <EmptyState>
                  <FaWifi />
                  <p>{devices.length === 0 ? 'Aucun scan lancé' : 'Aucun résultat'}</p>
                </EmptyState>
              ) : (
                <ResultsList>
                  {filteredDevices.map(device => (
                    <ResultItem key={device.ip} status={device.status}>
                      <ResultIcon status={device.status}>
                        {device.status === 'online' ? <FaCheck /> : <FaTimes />}
                      </ResultIcon>
                      <ResultInfo>
                        <div className="result-title">{device.ip}</div>
                        <div className="result-detail">{device.hostname}</div>
                        <div className="result-detail">Response: {device.responseTime}ms</div>
                      </ResultInfo>
                    </ResultItem>
                  ))}
                </ResultsList>
              )
            ) : filteredPorts.length === 0 ? (
              <EmptyState>
                <FaNetworkWired />
                <p>{ports.length === 0 ? 'Aucun scan lancé' : 'Aucun résultat'}</p>
              </EmptyState>
            ) : (
              <ResultsList>
                {filteredPorts.map((port, idx) => (
                  <ResultItem key={idx} status={port.status}>
                    <ResultIcon status={port.status}>
                      {port.status === 'open' ? <FaCheck /> : <FaTimes />}
                    </ResultIcon>
                    <ResultInfo>
                      <div className="result-title">
                        {port.ip}:{port.port}
                      </div>
                      <div className="result-detail">{port.service} ({port.protocol.toUpperCase()})</div>
                      <div className="result-detail">
                        {port.status === 'open' ? '🟢 Ouvert' : '🔴 Fermé'}
                      </div>
                    </ResultInfo>
                  </ResultItem>
                ))}
              </ResultsList>
            )}
          </ResultsContainer>
        </Card>
      </TwoColumn>
    </Container>
  );
};

export default ScanPage;
