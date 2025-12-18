import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  Globe, 
  Wifi, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Monitor,
  ArrowUp,
  ArrowDown,
  BarChart3,
  RefreshCw,
  Database,
  Server,
  Cpu,
} from 'lucide-react';

// Types
interface DashboardStats {
  addresses: {
    total: number;
    allocated: number;
    available: number;
    reserved: number;
  };
  pools: number;
  organizations: number;
  subnets: number;
  vlans: number;
  uptime: number;
  alerts: number;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    usage: number;
    used: number;
    total: number;
  };
  disk: {
    usage: number;
    used: number;
    total: number;
  };
  uptime: number;
  hostname: string;
}

interface ActivityLog {
  id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_name?: string;
  created_at: string;
  status: string;
}

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

// Styled Components
const DashboardContainer = styled.div`
  padding: 32px;
  background: transparent;
  min-height: 100vh;
  width: 100%;
  position: relative;
`;

const Header = styled.div`
  margin-bottom: 40px;
  animation: ${slideInLeft} 0.8s ease-out;
  
  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  
  .title-section {
    flex: 1;
  }
  
  h1 {
    font-size: 36px;
    font-weight: 800;
    background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }
  
  p {
    color: #6b7280;
    font-size: 16px;
    margin: 0;
    font-weight: 400;
  }
  
  .last-update {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #9ca3af;
    margin-top: 8px;
    
    svg {
      width: 16px;
      height: 16px;
      animation: ${rotate} 2s linear infinite;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  animation: ${slideInRight} 0.8s ease-out;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  &:hover:not(:disabled) {
    border-color: #60a5fa;
    background: #60a5fa;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(96, 165, 250, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &.primary {
    background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
    border-color: transparent;
    color: white;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(96, 165, 250, 0.4);
    }
    
    &:disabled {
      opacity: 0.6;
      background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
  
  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfessionalStatsCard = styled.div<{ color: string; index: number }>`
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: ${scaleIn} 0.6s ease-out ${props => `${props.index * 0.1}s`} both;
  min-height: 140px;
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 16px 35px rgba(0, 0, 0, 0.12);
    border-color: rgba(96, 165, 250, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: ${props => {
      switch(props.color) {
        case 'blue': return 'linear-gradient(90deg, #3b82f6, #1d4ed8, #2563eb)';
        case 'green': return 'linear-gradient(90deg, #10b981, #059669, #047857)';
        case 'purple': return 'linear-gradient(90deg, #3b82f6, #60a5fa, #34d399)';
        case 'orange': return 'linear-gradient(90deg, #f59e0b, #d97706, #b45309)';
        default: return 'linear-gradient(90deg, #60a5fa, #34d399)';
      }
    }};
    border-radius: 20px 20px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    transition: left 0.6s ease;
  }
  
  &:hover::after {
    left: 100%;
  }
`;

const StatsContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
`;

const StatsInfo = styled.div`
  flex: 1;
  
  .number {
    font-size: 32px;
    font-weight: 800;
    margin: 0 0 4px 0;
    color: #1f2937;
    line-height: 1;
  }
  
  .label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin: 0 0 8px 0;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  
  .trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    
    &.positive {
      color: #059669;
    }
    
    &.negative {
      color: #dc2626;
    }
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

const StatsIcon = styled.div<{ color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch(props.color) {
      case 'blue': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      case 'green': return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
      case 'purple': return 'linear-gradient(135deg, #e9d5ff, #ddd6fe)';
      case 'orange': return 'linear-gradient(135deg, #fed7aa, #fdba74)';
      default: return 'linear-gradient(135deg, #e0e7ff, #c7d2fe)';
    }
  }};
  animation: ${float} 6s ease-in-out infinite;
  animation-delay: ${() => `${Math.random() * 2}s`};
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => {
      switch(props.color) {
        case 'blue': return '#1d4ed8';
        case 'green': return '#059669';
        case 'purple': return '#7c3aed';
        case 'orange': return '#d97706';
        default: return '#60a5fa';
      }
    }};
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin-bottom: 32px;
  animation: ${fadeInUp} 1s ease-out 0.4s both;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ActivityCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  animation: ${slideInRight} 1s ease-out 0.6s both;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    
    svg {
      width: 20px;
      height: 20px;
      color: #60a5fa;
    }
  }
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  
  &:hover {
    background: #f8fafc;
    border-color: #e5e7eb;
    transform: translateX(4px);
  }
`;

const ActivityInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  
  .content {
    flex: 1;
    
    .title {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin: 0 0 2px 0;
    }
    
    .description {
      font-size: 12px;
      color: #9ca3af;
      margin: 0;
    }
  }
`;

const ActivityDot = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 0 0 3px ${props => props.color}20;
  animation: ${pulse} 2s infinite;
`;

const ActivityTime = styled.span`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
`;

const QuickStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const QuickStat = styled.div<{ color: string }>`
  background: ${props => {
    switch(props.color) {
      case 'blue': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      case 'green': return 'linear-gradient(135deg, #d1fae5, #a7f3d0)';
      case 'purple': return 'linear-gradient(135deg, #e9d5ff, #ddd6fe)';
      case 'red': return 'linear-gradient(135deg, #fee2e2, #fecaca)';
      default: return 'linear-gradient(135deg, #f3f4f6, #e5e7eb)';
    }
  }};
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.8);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  
  .number {
    font-size: 20px;
    font-weight: 800;
    color: ${props => {
      switch(props.color) {
        case 'blue': return '#1d4ed8';
        case 'green': return '#059669';
        case 'purple': return '#7c3aed';
        case 'red': return '#dc2626';
        default: return '#374151';
      }
    }};
    margin-bottom: 2px;
    line-height: 1;
  }
  
  .label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    line-height: 1;
  }
`;

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
        credentials: 'include'
      });
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch system metrics
      const metricsResponse = await fetch('http://localhost:5000/api/dashboard/system-metrics', {
        credentials: 'include'
      });
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setSystemMetrics(metricsData.data);
      }

      // Fetch recent logs
      const logsResponse = await fetch('http://localhost:5000/api/dashboard/recent-logs?limit=5', {
        credentials: 'include'
      });
      const logsData = await logsResponse.json();
      if (logsData.success) {
        setRecentLogs(logsData.data);
      }

    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const handleRefresh = async () => {
    console.log('🔄 Starting refresh...');
    
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Set refreshing state
    setIsRefreshing(true);
    
    // Fetch fresh data
    await fetchDashboardData();
    
    // Set timeout with ref for cleanup
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('✅ Refresh completed');
      setCurrentTime(new Date());
      setIsRefreshing(false);
      refreshTimeoutRef.current = null;
    }, 1500);
  };

  const forceReset = () => {
    console.log('🔧 Force reset');
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setIsRefreshing(false);
  };

  const handleGenerateReport = () => {
    if (!stats || !systemMetrics) {
      alert('⚠️ Données non disponibles pour générer le rapport');
      return;
    }

    // Generate report with real data
    const reportData = {
      date: new Date().toLocaleDateString('fr-FR'),
      time: new Date().toLocaleTimeString('fr-FR'),
      stats: {
        totalIPs: stats.addresses.total,
        allocatedIPs: stats.addresses.allocated,
        availableIPs: stats.addresses.available,
        reservedIPs: stats.addresses.reserved,
        pools: stats.pools,
        organizations: stats.organizations,
        subnets: stats.subnets,
        vlans: stats.vlans,
        uptime: `${stats.uptime.toFixed(2)}%`,
        alerts: stats.alerts
      },
      systemMetrics: {
        cpu: {
          usage: `${systemMetrics.cpu.usage.toFixed(1)}%`,
          cores: systemMetrics.cpu.cores,
          temperature: systemMetrics.cpu.temperature ? `${systemMetrics.cpu.temperature}°C` : 'N/A'
        },
        memory: {
          usage: `${systemMetrics.memory.usage.toFixed(1)}%`,
          used: `${systemMetrics.memory.used} GB`,
          total: `${systemMetrics.memory.total} GB`
        },
        disk: {
          usage: `${systemMetrics.disk.usage.toFixed(1)}%`,
          used: `${systemMetrics.disk.used} GB`,
          total: `${systemMetrics.disk.total} GB`
        },
        uptime: `${(systemMetrics.uptime / 3600).toFixed(1)} heures`,
        hostname: systemMetrics.hostname
      },
      recentActivity: recentLogs.map(log => ({
        username: log.username,
        action: log.action,
        resource: log.resource_type,
        resourceName: log.resource_name,
        timestamp: log.created_at,
        status: log.status
      })),
      summary: 'Rapport de synthèse du dashboard NetAdmin Pro'
    };

    // Create and download a JSON report
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Optional: Show notification
    alert('📊 Rapport généré et téléchargé avec succès !');
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'maintenant';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j`;
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch(action.toUpperCase()) {
      case 'CREATE': return '#10b981';
      case 'UPDATE': return '#3b82f6';
      case 'DELETE': return '#ef4444';
      case 'LOGIN': return '#8b5cf6';
      case 'LOGOUT': return '#6b7280';
      case 'GENERATE': return '#10b981';
      case 'SCAN': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Get action label
  const getActionLabel = (log: ActivityLog) => {
    const resourceName = log.resource_name ? ` - ${log.resource_name}` : '';
    switch(log.action.toUpperCase()) {
      case 'CREATE': return `Création ${log.resource_type}${resourceName}`;
      case 'UPDATE': return `Modification ${log.resource_type}${resourceName}`;
      case 'DELETE': return `Suppression ${log.resource_type}${resourceName}`;
      case 'LOGIN': return `Connexion de ${log.username}`;
      case 'LOGOUT': return `Déconnexion de ${log.username}`;
      case 'GENERATE': return `Génération mot de passe${resourceName}`;
      case 'SCAN': return `Scan réseau${resourceName}`;
      default: return `${log.action} ${log.resource_type}${resourceName}`;
    }
  };

  const statsData = stats ? [
    {
      title: stats.addresses.total.toString(),
      subtitle: 'ADRESSES IP',
      icon: Globe,
      color: 'blue' as const,
      trend: { 
        value: `${stats.addresses.allocated} allouées`, 
        positive: true 
      }
    },
    {
      title: stats.subnets.toString(),
      subtitle: 'SOUS-RÉSEAUX',
      icon: Wifi,
      color: 'green' as const,
      trend: { 
        value: `${stats.vlans} VLANs`, 
        positive: true 
      }
    },
    {
      title: `${stats.uptime.toFixed(1)}%`,
      subtitle: 'UPTIME',
      icon: Activity,
      color: 'purple' as const,
      trend: { 
        value: systemMetrics ? `${(systemMetrics.uptime / 3600).toFixed(0)}h` : 'Calcul...', 
        positive: true 
      }
    },
    {
      title: stats.alerts.toString(),
      subtitle: 'ALERTES',
      icon: AlertTriangle,
      color: 'orange' as const,
      trend: { 
        value: stats.alerts === 0 ? 'Aucune' : 'À traiter', 
        positive: stats.alerts === 0 
      }
    },
  ] : [];

  if (loading && !stats) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <RefreshCw 
            size={48} 
            style={{ 
              animation: `${rotate.getName()} 1s linear infinite`,
              color: '#60a5fa'
            }} 
          />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Chargement des données du dashboard...
          </p>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Header */}
      <Header>
        <div className="top-row">
          <div className="title-section">
            <h1>Dashboard</h1>
            <div className="last-update">
              <RefreshCw />
              <span>Dernière mise à jour: {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <HeaderActions>
            <ActionButton onClick={handleGenerateReport}>
              <BarChart3 />
              Rapports
            </ActionButton>
            <ActionButton 
              className="primary" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              style={{ minWidth: '120px' }}
            >
              <RefreshCw 
                style={{ 
                  animation: isRefreshing ? `${rotate.getName()} 1s linear infinite` : 'none'
                }} 
              />
              {isRefreshing ? 'En cours...' : 'Actualiser'}
            </ActionButton>
            <ActionButton 
              onClick={forceReset} 
              style={{ 
                background: '#ef4444', 
                color: 'white', 
                fontSize: '12px',
                padding: '8px 12px'
              }}
            >
              🔧 Reset
            </ActionButton>
          </HeaderActions>
        </div>
      </Header>

      {/* Stats Cards */}
      <StatsGrid>
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <ProfessionalStatsCard key={index} color={stat.color} index={index}>
              <StatsContent>
                <StatsInfo>
                  <div className="number">{stat.title}</div>
                  <div className="label">{stat.subtitle}</div>
                  <div className={`trend ${stat.trend.positive ? 'positive' : 'negative'}`}>
                    {stat.trend.positive ? <ArrowUp /> : <ArrowDown />}
                    {stat.trend.value} ce mois
                  </div>
                </StatsInfo>
                <StatsIcon color={stat.color}>
                  <Icon />
                </StatsIcon>
              </StatsContent>
            </ProfessionalStatsCard>
          );
        })}
      </StatsGrid>

      {/* Additional Stats - Moved up after first 4 cards */}
      {stats && (
        <StatsGrid style={{ marginBottom: '32px' }}>
          <ProfessionalStatsCard color="blue" index={0}>
            <StatsContent>
              <StatsInfo>
                <div className="number">{stats.pools}</div>
                <div className="label">POOLS IP</div>
                <div className="trend positive">
                  <Database size={12} />
                  Gestion centralisée
                </div>
              </StatsInfo>
              <StatsIcon color="blue">
                <Database />
              </StatsIcon>
            </StatsContent>
          </ProfessionalStatsCard>

          <ProfessionalStatsCard color="green" index={1}>
            <StatsContent>
              <StatsInfo>
                <div className="number">{stats.organizations}</div>
                <div className="label">ORGANISATIONS</div>
                <div className="trend positive">
                  <Server size={12} />
                  {stats.subnets} sous-réseaux
                </div>
              </StatsInfo>
              <StatsIcon color="green">
                <Server />
              </StatsIcon>
            </StatsContent>
          </ProfessionalStatsCard>

          <ProfessionalStatsCard color="purple" index={2}>
            <StatsContent>
              <StatsInfo>
                <div className="number">{stats.addresses.allocated}</div>
                <div className="label">IPs ALLOUÉES</div>
                <div className="trend positive">
                  <Globe size={12} />
                  {stats.addresses.available} disponibles
                </div>
              </StatsInfo>
              <StatsIcon color="purple">
                <Globe />
              </StatsIcon>
            </StatsContent>
          </ProfessionalStatsCard>

          <ProfessionalStatsCard color="orange" index={3}>
            <StatsContent>
              <StatsInfo>
                <div className="number">{stats.addresses.reserved}</div>
                <div className="label">IPs RÉSERVÉES</div>
                <div className="trend positive">
                  <Cpu size={12} />
                  Usage optimisé
                </div>
              </StatsInfo>
              <StatsIcon color="orange">
                <Cpu />
              </StatsIcon>
            </StatsContent>
          </ProfessionalStatsCard>
        </StatsGrid>
      )}

      {/* Main Content Grid */}
      <MainGrid>
        {/* Side Panel */}
        <SidePanel>
          {/* System Metrics */}
          <ActivityCard>
            <h3>
              <Monitor />
              Métriques Système
            </h3>
            {systemMetrics ? (
              <QuickStatsGrid>
                <QuickStat color="blue">
                  <div className="number">{systemMetrics.cpu.usage.toFixed(1)}%</div>
                  <div className="label">CPU ({systemMetrics.cpu.cores} cores)</div>
                </QuickStat>
                <QuickStat color="green">
                  <div className="number">{systemMetrics.memory.usage.toFixed(1)}%</div>
                  <div className="label">RAM ({systemMetrics.memory.used.toFixed(1)}/{systemMetrics.memory.total.toFixed(1)} GB)</div>
                </QuickStat>
                <QuickStat color="purple">
                  <div className="number">{systemMetrics.disk.usage.toFixed(1)}%</div>
                  <div className="label">Disque ({systemMetrics.disk.used.toFixed(0)} GB)</div>
                </QuickStat>
                <QuickStat color="red">
                  <div className="number">{systemMetrics.cpu.temperature ? `${systemMetrics.cpu.temperature}°C` : 'N/A'}</div>
                  <div className="label">Température</div>
                </QuickStat>
              </QuickStatsGrid>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                Chargement des métriques...
              </div>
            )}
          </ActivityCard>

          {/* Recent Activity */}
          <ActivityCard>
            <h3>
              <Clock />
              Activité Récente
            </h3>
            <ActivityList>
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <ActivityItem key={log.id}>
                    <ActivityInfo>
                      <ActivityDot color={getActionColor(log.action)} />
                      <div className="content">
                        <div className="title">{getActionLabel(log)}</div>
                        <div className="description">
                          {log.username} • {log.status === 'success' ? '✓ Réussi' : '✗ Échec'}
                        </div>
                      </div>
                    </ActivityInfo>
                    <ActivityTime>{formatTimeAgo(log.created_at)}</ActivityTime>
                  </ActivityItem>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  Aucune activité récente
                </div>
              )}
            </ActivityList>
          </ActivityCard>
        </SidePanel>
      </MainGrid>

      {/* Additional Stats - Removed from here since moved up */}
    </DashboardContainer>
  );
};

export default Dashboard;