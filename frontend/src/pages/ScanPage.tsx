import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import { FaWifi, FaNetworkWired, FaSearch, FaPlay, FaStop, FaDownload, FaCheck, FaTimes, FaChartBar, FaHistory, FaTrash, FaSync, FaCog } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNotification } from '../context/NotificationContext';

// ============= STYLES =============

const Container = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
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

  p {
    color: #7f8c8d;
    margin-top: 0.5rem;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
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

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success'; disabled?: boolean }>`
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
  width: 100%;
  
  background-color: ${props => {
    if (props.disabled) return '#bdc3c7';
    switch (props.variant) {
      case 'primary':
        return '#3498db';
      case 'secondary':
        return '#95a5a6';
      case 'danger':
        return '#e74c3c';
      case 'success':
        return '#27ae60';
      default:
        return '#3498db';
    }
  }};
  
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0.9;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;

  button {
    flex: 1;
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.progress}%;
    background: ${colors.primary.blue};
    transition: width 0.3s ease;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
`;

const StatCard = styled.div<{ color?: string }>`
  background: ${props => props.color || colors.primary.blue};
  border-radius: 8px;
  padding: 1.5rem;
  color: white;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 0.8rem;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
`;

const TabButton = styled.button<{ active?: boolean }>`
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  color: ${props => props.active ? '#3498db' : '#7f8c8d'};
  border-bottom: 3px solid ${props => props.active ? '#3498db' : 'transparent'};
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:hover {
    color: #3498db;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 600px;
  overflow-y: auto;
  margin-top: 1rem;

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
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.status) {
      case 'online':
      case 'open':
        return '#d5f4e6';
      case 'offline':
      case 'closed':
        return '#fadbd8';
      default:
        return '#ecf0f1';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'online':
      case 'open':
        return '#27ae60';
      case 'offline':
      case 'closed':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  }};
  font-weight: bold;
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

const HistoryCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateX(4px);
  }
`;

const AdvancedOptions = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid #e0e0e0;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: #ecf0f1;
    }

    input {
      cursor: pointer;
    }
  }
`;

const FilterBox = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
`;

const SearchBox = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;

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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #7f8c8d;
  text-align: center;

  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  p {
    font-size: 1rem;
    margin: 0;
  }
`;

// ============= INTERFACES =============

interface ScanDevice {
  ip: string;
  hostname: string;
  status: 'online' | 'offline';
  responseTime: number;
  mac?: string;
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

interface ScanHistory {
  id: string;
  type: 'subnet' | 'ports';
  target: string;
  timestamp: number;
  resultCount: number;
  duration: number;
}

// ============= MAIN COMPONENT =============

const ScanPage: React.FC = () => {
  const { showNotification } = useNotification();
  
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
  const [scanTime, setScanTime] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  // History state
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'history' | 'charts'>('results');

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scanTimeout, setScanTimeout] = useState(5);
  const [parallelScans, setParallelScans] = useState(10);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scanHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Start scan handler
  const handleStartScan = async () => {
    if (!config.network.trim()) {
      showNotification('error', 'Erreur', 'Veuillez entrer une adresse réseau');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setDevices([]);
    setPorts([]);
    setScanTime(0);

    const startTime = Date.now();

    try {
      const endpoint = config.type === 'subnet' 
        ? 'http://localhost:5000/api/scan/subnet'
        : 'http://localhost:5000/api/scan/ports';

      const payload = config.type === 'subnet'
        ? { network: config.network, timeout: scanTimeout }
        : { ip: config.network, ports: config.portRange, timeout: scanTimeout };

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
      const duration = Math.round((Date.now() - startTime) / 1000);
      setScanTime(duration);

      if (result.success) {
        if (config.type === 'subnet') {
          setDevices(result.data || []);
          showNotification('success', 'Scan réussi', `${result.data?.length || 0} appareils trouvés en ${duration}s`);
        } else {
          setPorts(result.data || []);
          showNotification('success', 'Scan réussi', `${result.data?.length || 0} ports scannés en ${duration}s`);
        }

        // Save to history
        const newHistory: ScanHistory = {
          id: Date.now().toString(),
          type: config.type,
          target: config.type === 'subnet' ? config.network : `${config.network}:${config.portRange}`,
          timestamp: Date.now(),
          resultCount: result.data?.length || 0,
          duration
        };
        
        const updatedHistory = [newHistory, ...history].slice(0, 20);
        setHistory(updatedHistory);
        localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
      } else {
        showNotification('error', 'Erreur de scan', result.message || 'Une erreur est survenue');
      }
    } catch (error) {
      showNotification('error', 'Erreur', 'Impossible de se connecter au serveur');
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    setScanProgress(0);
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
    showNotification('success', 'Export réussi', 'Fichier téléchargé');
  };

  const handleLoadHistory = (item: ScanHistory) => {
    setConfig(prev => ({
      ...prev,
      network: item.target.includes(':') 
        ? item.target.split(':')[0] 
        : item.target,
      type: item.type
    }));
    showNotification('info', 'Chargé', `Configuration restaurée: ${item.target}`);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
    showNotification('success', 'Supprimé', 'Scan supprimé de l\'historique');
  };

  // Filtered results
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.ip.includes(searchQuery) || d.hostname.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPorts = ports.filter(p => {
    const matchesSearch = p.ip.includes(searchQuery) || p.service.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || p.status === (statusFilter === 'online' ? 'open' : 'closed');
    return matchesSearch && matchesStatus;
  });

  // Statistics
  const statsDevices = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    avgResponse: devices.length > 0 
      ? Math.round(devices.reduce((sum, d) => sum + d.responseTime, 0) / devices.length)
      : 0
  };

  const statsPorts = {
    total: ports.length,
    open: ports.filter(p => p.status === 'open').length,
    closed: ports.filter(p => p.status === 'closed').length
  };

  // Chart data
  const responseTimeData = devices
    .sort((a, b) => a.responseTime - b.responseTime)
    .slice(0, 10)
    .map(d => ({
      name: d.ip.split('.').slice(-1)[0],
      time: d.responseTime,
      ip: d.ip
    }));

  const statusDistribution = config.type === 'subnet'
    ? [
        { name: 'En ligne', value: statsDevices.online, color: '#27ae60' },
        { name: 'Hors ligne', value: statsDevices.offline, color: '#e74c3c' }
      ]
    : [
        { name: 'Ouverts', value: statsPorts.open, color: '#27ae60' },
        { name: 'Fermés', value: statsPorts.closed, color: '#e74c3c' }
      ];

  const serviceDistribution = ports
    .reduce((acc: any[], p) => {
      const existing = acc.find(a => a.name === p.service);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: p.service, value: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'];

  return (
    <Container>
      <Header>
        <h1>
          <FaWifi /> Analyse de Réseau Avancée
        </h1>
        <p>Scannez votre réseau, découvrez les appareils et analysez les ports</p>
      </Header>

      <TwoColumn>
        {/* LEFT COLUMN - CONFIGURATION */}
        <Card>
          <SectionTitle>
            <FaCog /> Configuration du Scan
          </SectionTitle>

          <FormGroup>
            <Label>Type de Scan</Label>
            <Select 
              value={config.type}
              onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as 'subnet' | 'ports' }))}
              disabled={isScanning}
            >
              <option value="subnet">📡 Scan Réseau (Subnet)</option>
              <option value="ports">🔌 Scan des Ports (Port Scanning)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>{config.type === 'subnet' ? 'Adresse Réseau' : 'Adresse IP'}</Label>
            <Input 
              type="text"
              placeholder={config.type === 'subnet' ? '192.168.1.0/24' : '192.168.1.1'}
              value={config.network}
              onChange={(e) => setConfig(prev => ({ ...prev, network: e.target.value }))}
              disabled={isScanning}
            />
          </FormGroup>

          {config.type === 'ports' && (
            <FormGroup>
              <Label>Ports à Scanner</Label>
              <Input 
                type="text"
                placeholder="80,443,22,3306,5432"
                value={config.portRange}
                onChange={(e) => setConfig(prev => ({ ...prev, portRange: e.target.value }))}
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
              value={scanTimeout}
              onChange={(e) => setScanTimeout(parseInt(e.target.value))}
              disabled={isScanning}
            />
          </FormGroup>

          <ProgressBar progress={scanProgress} />

          <ButtonGroup>
            <Button 
              variant="primary"
              onClick={handleStartScan}
              disabled={isScanning}
            >
              <FaPlay /> {isScanning ? 'Scan en cours...' : 'Démarrer'}
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

          {(devices.length > 0 || ports.length > 0) && (
            <>
              <ButtonGroup>
                <Button 
                  variant="secondary"
                  onClick={handleExport}
                >
                  <FaDownload /> Exporter
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <FaCog /> Options
                </Button>
              </ButtonGroup>

              {scanTime > 0 && (
                <FormGroup style={{ marginTop: '1rem' }}>
                  <Label>Durée du scan: {scanTime}s</Label>
                </FormGroup>
              )}
            </>
          )}

          {showAdvanced && (
            <AdvancedOptions>
              <SectionTitle style={{ borderBottom: 'none', marginBottom: '1rem' }}>
                Options Avancées
              </SectionTitle>
              <FormGroup>
                <Label>Scans Parallèles</Label>
                <Input 
                  type="number"
                  min="1"
                  max="50"
                  value={parallelScans}
                  onChange={(e) => setParallelScans(parseInt(e.target.value))}
                />
              </FormGroup>
            </AdvancedOptions>
          )}

          {history.length > 0 && (
            <>
              <SectionTitle style={{ marginTop: '2rem' }}>
                <FaHistory /> Historique
              </SectionTitle>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {history.map(item => (
                  <HistoryCard key={item.id}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                        {item.type === 'subnet' ? '📡' : '🔌'} {item.target}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                        {new Date(item.timestamp).toLocaleString()} • {item.resultCount} résultats
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button 
                        variant="secondary"
                        onClick={() => handleLoadHistory(item)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        <FaSync />
                      </Button>
                      <Button 
                        variant="danger"
                        onClick={() => handleDeleteHistory(item.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </HistoryCard>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* RIGHT COLUMN - RESULTS */}
        <div>
          {devices.length > 0 || ports.length > 0 ? (
            <>
              {/* Statistics */}
              <StatsGrid>
                {config.type === 'subnet' ? (
                  <>
                    <StatCard color="#3498db">
                      <div className="stat-value">{statsDevices.total}</div>
                      <div className="stat-label">Total</div>
                    </StatCard>
                    <StatCard color="#27ae60">
                      <div className="stat-value">{statsDevices.online}</div>
                      <div className="stat-label">En ligne</div>
                    </StatCard>
                    <StatCard color="#e74c3c">
                      <div className="stat-value">{statsDevices.offline}</div>
                      <div className="stat-label">Hors ligne</div>
                    </StatCard>
                    <StatCard color="#f39c12">
                      <div className="stat-value">{statsDevices.avgResponse}ms</div>
                      <div className="stat-label">Moy. Réponse</div>
                    </StatCard>
                  </>
                ) : (
                  <>
                    <StatCard color="#3498db">
                      <div className="stat-value">{statsPorts.total}</div>
                      <div className="stat-label">Ports</div>
                    </StatCard>
                    <StatCard color="#27ae60">
                      <div className="stat-value">{statsPorts.open}</div>
                      <div className="stat-label">Ouverts</div>
                    </StatCard>
                    <StatCard color="#e74c3c">
                      <div className="stat-value">{statsPorts.closed}</div>
                      <div className="stat-label">Fermés</div>
                    </StatCard>
                  </>
                )}
              </StatsGrid>

              {/* Tabs */}
              <Card style={{ marginTop: '1rem' }}>
                <TabsContainer>
                  <TabButton 
                    active={activeTab === 'results'}
                    onClick={() => setActiveTab('results')}
                  >
                    <FaSearch /> Résultats
                  </TabButton>
                  <TabButton 
                    active={activeTab === 'charts'}
                    onClick={() => setActiveTab('charts')}
                  >
                    <FaChartBar /> Graphiques
                  </TabButton>
                </TabsContainer>

                {activeTab === 'results' && (
                  <>
                    <SearchBox>
                      <Input 
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </SearchBox>

                    <FilterBox>
                      <Label style={{ marginBottom: '1rem' }}>Filtrer par statut</Label>
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
                                value="online"
                                checked={statusFilter === 'online'}
                                onChange={() => setStatusFilter('online')}
                              />
                              Ouverts
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="status"
                                value="offline"
                                checked={statusFilter === 'offline'}
                                onChange={() => setStatusFilter('offline')}
                              />
                              Fermés
                            </label>
                          </>
                        )}
                      </CheckboxGroup>
                    </FilterBox>

                    <ResultsList>
                      {config.type === 'subnet' ? (
                        filteredDevices.length === 0 ? (
                          <EmptyState>
                            <FaWifi />
                            <p>Aucun résultat</p>
                          </EmptyState>
                        ) : (
                          filteredDevices.map(device => (
                            <ResultItem key={device.ip} status={device.status}>
                              <ResultIcon status={device.status}>
                                {device.status === 'online' ? <FaCheck /> : <FaTimes />}
                              </ResultIcon>
                              <ResultInfo>
                                <div className="result-title">{device.ip}</div>
                                <div className="result-detail">{device.hostname}</div>
                                <div className="result-detail">⏱️ {device.responseTime}ms</div>
                              </ResultInfo>
                            </ResultItem>
                          ))
                        )
                      ) : (
                        filteredPorts.length === 0 ? (
                          <EmptyState>
                            <FaNetworkWired />
                            <p>Aucun port trouvé</p>
                          </EmptyState>
                        ) : (
                          filteredPorts.map((port, idx) => (
                            <ResultItem key={idx} status={port.status}>
                              <ResultIcon status={port.status}>
                                {port.status === 'open' ? <FaCheck /> : <FaTimes />}
                              </ResultIcon>
                              <ResultInfo>
                                <div className="result-title">
                                  {port.ip}:{port.port}
                                </div>
                                <div className="result-detail">
                                  {port.service} ({port.protocol.toUpperCase()})
                                </div>
                                <div className="result-detail">
                                  {port.status === 'open' ? '🟢 Ouvert' : '🔴 Fermé'}
                                </div>
                              </ResultInfo>
                            </ResultItem>
                          ))
                        )
                      )}
                    </ResultsList>
                  </>
                )}

                {activeTab === 'charts' && (
                  <>
                    {responseTimeData.length > 0 && config.type === 'subnet' && (
                      <ChartContainer>
                        <h3 style={{ marginTop: 0 }}>Temps de Réponse (Top 10)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={responseTimeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="time" fill="#3498db" name="Temps (ms)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}

                    {statusDistribution.length > 0 && (
                      <ChartContainer>
                        <h3 style={{ marginTop: 0 }}>Distribution du Statut</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={statusDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}

                    {serviceDistribution.length > 0 && config.type === 'ports' && (
                      <ChartContainer>
                        <h3 style={{ marginTop: 0 }}>Services Détectés (Top 5)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={serviceDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#27ae60" name="Ports" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )}
                  </>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState>
                <FaSearch />
                <p>Lancez un scan pour voir les résultats</p>
              </EmptyState>
            </Card>
          )}
        </div>
      </TwoColumn>
    </Container>
  );
};

export default ScanPage;
