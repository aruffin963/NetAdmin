import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface ActivityLog {
  id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'error' | 'warning';
  error_message?: string;
  created_at: string;
}

interface ConsoleLog {
  id: number;
  timestamp: string;
  type: 'log' | 'warn' | 'error';
  message: string;
  stack?: string;
}

// ============= STYLED COMPONENTS (BEFORE COMPONENT) =============

const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #000000;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#64748b'};
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  ${props => props.active && `
    border-color: #3b82f6;
  `}
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ success?: boolean; error?: boolean }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => 
    props.success ? '#10b981' : 
    props.error ? '#ef4444' : 
    '#3b82f6'
  };
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const FilterInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ExportButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #059669;
  }
`;

const LogsTable = styled.table`
  width: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.th`
  padding: 1rem;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
`;

const TableRow = styled.tr<{ status: string }>`
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
  }

  ${props => props.status === 'error' && `
    background: #fef2f2;
  `}
`;

const TableCell = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  color: #1e293b;
`;

const UserBadge = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ActionBadge = styled.span`
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ResourceBadge = styled.span`
  background: #f3e8ff;
  color: #6b21a8;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => 
    props.status === 'success' ? '#d1fae5' :
    props.status === 'error' ? '#fee2e2' :
    '#fef3c7'
  };
  color: ${props => 
    props.status === 'success' ? '#065f46' :
    props.status === 'error' ? '#991b1b' :
    '#92400e'
  };
`;

const IpBadge = styled.span`
  background: #f0fdf4;
  color: #15803d;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.125rem;
  color: #64748b;
`;

const DetailsButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: #f3f4f6;
  color: #3b82f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PaginationInfo = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const PageSizeSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const PaginationButton = styled.button<{ disabled?: boolean }>`
  padding: 0.5rem 0.75rem;
  background: white;
  color: #3b82f6;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    color: #cbd5e1;
    border-color: #e2e8f0;
  `}
`;

const PageNumbersContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

const PageNumberButton = styled.button<{ active: boolean }>`
  padding: 0.4rem 0.7rem;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#64748b'};
  border: 1px solid ${props => props.active ? '#3b82f6' : '#e2e8f0'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 2.5rem;

  &:hover:not(.active) {
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

const PageEllipsis = styled.span`
  color: #cbd5e1;
  padding: 0 0.25rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s;

  &:hover {
    color: #1e293b;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const CloseModalButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #cbd5e1;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div``;

const DetailLabel = styled.div`
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const DetailValue = styled.div`
  color: #1e293b;
  font-size: 0.95rem;
`;

const DetailSection = styled.div`
  margin-bottom: 1.5rem;
`;

const DetailSectionTitle = styled.h3`
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailCodeBlock = styled.pre`
  background: #f8fafc;
  color: #1e293b;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
  margin: 0;
`;

const DetailError = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ConsoleLogs = styled.div`
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 600px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
`;

const ConsoleLogEntry = styled.div<{ type: 'log' | 'warn' | 'error' }>`
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #334155;
  align-items: flex-start;
  
  ${props => {
    switch (props.type) {
      case 'error':
        return `background: #7f1d1d; border-left: 4px solid #ef4444;`;
      case 'warn':
        return `background: #78350f; border-left: 4px solid #f59e0b;`;
      default:
        return `background: #1e293b; border-left: 4px solid #3b82f6;`;
    }
  }}

  &:last-child {
    border-bottom: none;
  }
`;

const ConsoleLogTime = styled.span`
  color: #94a3b8;
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 2px;
`;

const ConsoleLogType = styled.span<{ type: 'log' | 'warn' | 'error' }>`
  color: ${props => {
    switch (props.type) {
      case 'error': return '#fca5a5';
      case 'warn': return '#fcd34d';
      default: return '#60a5fa';
    }
  }};
  font-weight: 700;
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 2px;
`;

const ConsoleLogMessage = styled.span<{ type: 'log' | 'warn' | 'error' }>`
  color: ${props => {
    switch (props.type) {
      case 'error': return '#fecaca';
      case 'warn': return '#fde68a';
      default: return '#e0e7ff';
    }
  }};
  word-break: break-all;
  font-size: 0.875rem;
`;

const EmptyConsole = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #94a3b8;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

// ============= COMPONENT =============

const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'console'>('activity');
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    resource_type: '',
    status: ''
  });
  const [stats, setStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters, currentPage, pageSize]);

  // Setup console capture only once on mount
  useEffect(() => {
    setupConsoleCapture();
  }, []);

  const setupConsoleCapture = () => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    let logId = 1;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      const timestamp = new Date().toISOString();
      
      // Add to local state only (avoid database logging to prevent rate limit loops)
      setConsoleLogs(prev => [...prev, {
        id: logId++,
        timestamp,
        type: 'log',
        message
      }]);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      const timestamp = new Date().toISOString();
      
      // Add to local state only (avoid database logging to prevent rate limit loops)
      setConsoleLogs(prev => [...prev, {
        id: logId++,
        timestamp,
        type: 'warn',
        message
      }]);
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      const stack = new Error().stack;
      const timestamp = new Date().toISOString();
      
      // Add to local state only (avoid database logging to prevent rate limit loops)
      setConsoleLogs(prev => [...prev, {
        id: logId++,
        timestamp,
        type: 'error',
        message,
        stack
      }]);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.username) params.append('username', filters.username);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource_type) params.append('resource_type', filters.resource_type);
      if (filters.status) params.append('status', filters.status);
      params.append('limit', String(pageSize));
      params.append('offset', String((currentPage - 1) * pageSize));

      const response = await fetch(`http://localhost:5000/api/logs?${params}`, {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        setLogs(result.data || []);
        setTotalLogs(result.total || 0);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logs/stats?days=7', {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        setStats(result.data.summary);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return '🔓';
      case 'LOGOUT': return '🔒';
      case 'LOGIN_FAILED': return '❌';
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'GENERATE': return '🔑';
      case 'SCAN': return '🔍';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Utilisateur', 'Action', 'Ressource', 'Nom', 'Statut', 'IP'].join(';'),
      ...logs.map(log => [
        formatTimestamp(log.created_at),
        log.username,
        log.action,
        log.resource_type,
        log.resource_name || '-',
        log.status,
        log.ip_address || '-'
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Chargement des logs...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>📋 Journaux d'Activité</Title>
        <Subtitle>Historique de toutes les actions effectuées sur Netadmin Pro</Subtitle>
      </Header>

      <TabButtons>
        <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
          📊 Logs d'Activité
        </TabButton>
      </TabButtons>

      {activeTab === 'activity' ? (
        <>
          {stats && (
            <StatsContainer>
              <StatCard>
                <StatValue>{stats.total_actions}</StatValue>
                <StatLabel>Actions Totales</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.unique_users}</StatValue>
                <StatLabel>Utilisateurs Actifs</StatLabel>
              </StatCard>
              <StatCard success>
                <StatValue>{stats.successful_actions}</StatValue>
                <StatLabel>Succès</StatLabel>
              </StatCard>
              <StatCard error>
                <StatValue>{stats.failed_actions}</StatValue>
                <StatLabel>Échecs</StatLabel>
              </StatCard>
            </StatsContainer>
          )}

          <FiltersContainer>
            <FilterInput
              placeholder="Filtrer par utilisateur..."
              value={filters.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, username: e.target.value })}
            />
            <FilterSelect
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">Toutes les actions</option>
              <option value="LOGIN">Connexion</option>
              <option value="LOGOUT">Déconnexion</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
              <option value="GENERATE">Génération</option>
            </FilterSelect>
            <FilterSelect
              value={filters.resource_type}
              onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
            >
              <option value="">Toutes les ressources</option>
              <option value="SESSION">Session</option>
              <option value="PASSWORD">Mot de passe</option>
              <option value="ORGANIZATION">Organisation</option>
              <option value="SUBNET">Sous-réseau</option>
              <option value="VLAN">VLAN</option>
              <option value="IP_ADDRESS">Adresse IP</option>
            </FilterSelect>
            <FilterSelect
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tous les statuts</option>
              <option value="success">Succès</option>
              <option value="error">Erreur</option>
              <option value="warning">Avertissement</option>
            </FilterSelect>
            <ExportButton onClick={exportLogs}>
              📊 Exporter CSV
            </ExportButton>
          </FiltersContainer>

          <LogsTable>
            <thead>
              <tr>
                <TableHeader>Date & Heure</TableHeader>
                <TableHeader>Utilisateur</TableHeader>
                <TableHeader>Action</TableHeader>
                <TableHeader>Ressource</TableHeader>
                <TableHeader>Nom</TableHeader>
                <TableHeader>Statut</TableHeader>
                <TableHeader>IP</TableHeader>
                <TableHeader style={{ textAlign: 'center' }}>Détails</TableHeader>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <TableCell colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun log trouvé
                  </TableCell>
                </tr>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} status={log.status}>
                    <TableCell>{formatTimestamp(log.created_at)}</TableCell>
                    <TableCell>
                      <UserBadge>{log.username}</UserBadge>
                    </TableCell>
                    <TableCell>
                      <ActionBadge>
                        {getActionIcon(log.action)} {log.action}
                      </ActionBadge>
                    </TableCell>
                    <TableCell>
                      <ResourceBadge>{log.resource_type}</ResourceBadge>
                    </TableCell>
                    <TableCell>{log.resource_name || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={log.status}>
                        {log.status === 'success' && '✅'}
                        {log.status === 'error' && '❌'}
                        {log.status === 'warning' && '⚠️'}
                        {' '}{log.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <IpBadge>{log.ip_address || '-'}</IpBadge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <DetailsButton onClick={() => setSelectedLog(log)}>
                        🔍 Voir
                      </DetailsButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </LogsTable>

          {/* Pagination */}
          <PaginationContainer>
            <PaginationInfo>
              Affichage de {(currentPage - 1) * pageSize + 1} à {Math.min(currentPage * pageSize, totalLogs)} sur {totalLogs} logs
            </PaginationInfo>
            <PaginationControls>
              <PageSizeSelect value={pageSize} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}>
                <option value={10}>10 par page</option>
                <option value={15}>15 par page</option>
                <option value={25}>25 par page</option>
                <option value={50}>50 par page</option>
              </PageSizeSelect>
            </PaginationControls>
            <PaginationControls>
              <PaginationButton 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ⬅️ Première
              </PaginationButton>
              <PaginationButton 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                &lt; Précédent
              </PaginationButton>
              
              {/* Afficher les numéros de page */}
              <PageNumbersContainer>
                {Array.from({ length: Math.ceil(totalLogs / pageSize) }, (_, i) => i + 1)
                  .filter(page => {
                    const maxPages = Math.ceil(totalLogs / pageSize);
                    if (maxPages <= 5) return true;
                    if (page <= 2) return true;
                    if (page >= maxPages - 1) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce((acc, page, index, pages) => {
                    if (index > 0 && page > pages[index - 1] + 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [] as (string | number)[])
                  .map((page, index) => (
                    page === '...' ? (
                      <PageEllipsis key={index}>...</PageEllipsis>
                    ) : (
                      <PageNumberButton
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(Number(page))}
                      >
                        {page}
                      </PageNumberButton>
                    )
                  ))
                }
              </PageNumbersContainer>

              <PaginationButton 
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalLogs / pageSize), prev + 1))}
                disabled={currentPage >= Math.ceil(totalLogs / pageSize)}
              >
                Suivant &gt;
              </PaginationButton>
              <PaginationButton 
                onClick={() => setCurrentPage(Math.ceil(totalLogs / pageSize))}
                disabled={currentPage >= Math.ceil(totalLogs / pageSize)}
              >
                Dernière ➡️
              </PaginationButton>
            </PaginationControls>
          </PaginationContainer>
        </>
      ) : (
        <ConsoleLogs>
          {consoleLogs.length === 0 ? (
            <EmptyConsole>
              <EmptyIcon>🔍</EmptyIcon>
              <EmptyText>Aucun log console pour le moment</EmptyText>
            </EmptyConsole>
          ) : (
            consoleLogs.map((log) => (
              <ConsoleLogEntry key={log.id} type={log.type}>
                <ConsoleLogTime>{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</ConsoleLogTime>
                <ConsoleLogType type={log.type}>
                  {log.type === 'error' && '❌ ERROR'}
                  {log.type === 'warn' && '⚠️ WARN'}
                  {log.type === 'log' && 'ℹ️ LOG'}
                </ConsoleLogType>
                <ConsoleLogMessage type={log.type}>{log.message}</ConsoleLogMessage>
              </ConsoleLogEntry>
            ))
          )}
        </ConsoleLogs>
      )}

      {/* Modal Détails Log */}
      {selectedLog && (
        <ModalOverlay onClick={() => setSelectedLog(null)}>
          <ModalContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {getActionIcon(selectedLog.action)} Détails du Log
              </ModalTitle>
              <CloseButton onClick={() => setSelectedLog(null)}>✕</CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>Date & Heure</DetailLabel>
                  <DetailValue>{formatTimestamp(selectedLog.created_at)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Utilisateur</DetailLabel>
                  <DetailValue><UserBadge>{selectedLog.username}</UserBadge></DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Action</DetailLabel>
                  <DetailValue>{selectedLog.action}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Type de Ressource</DetailLabel>
                  <DetailValue>{selectedLog.resource_type}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>ID Ressource</DetailLabel>
                  <DetailValue>{selectedLog.resource_id || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Nom Ressource</DetailLabel>
                  <DetailValue>{selectedLog.resource_name || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Adresse IP</DetailLabel>
                  <DetailValue><IpBadge>{selectedLog.ip_address || '-'}</IpBadge></DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Statut</DetailLabel>
                  <DetailValue>
                    <StatusBadge status={selectedLog.status}>
                      {selectedLog.status === 'success' && '✅'}
                      {selectedLog.status === 'error' && '❌'}
                      {selectedLog.status === 'warning' && '⚠️'}
                      {' '}{selectedLog.status}
                    </StatusBadge>
                  </DetailValue>
                </DetailItem>
              </DetailGrid>

              {selectedLog.user_agent && (
                <DetailSection>
                  <DetailSectionTitle>User-Agent</DetailSectionTitle>
                  <DetailCodeBlock>{selectedLog.user_agent}</DetailCodeBlock>
                </DetailSection>
              )}

              {selectedLog.error_message && (
                <DetailSection>
                  <DetailSectionTitle>Message d'Erreur</DetailSectionTitle>
                  <DetailError>{selectedLog.error_message}</DetailError>
                </DetailSection>
              )}

              {selectedLog.details && (
                <DetailSection>
                  <DetailSectionTitle>Détails Supplémentaires</DetailSectionTitle>
                  <DetailCodeBlock>
                    {typeof selectedLog.details === 'string' 
                      ? selectedLog.details 
                      : JSON.stringify(selectedLog.details, null, 2)
                    }
                  </DetailCodeBlock>
                </DetailSection>
              )}
            </ModalBody>

            <ModalFooter>
              <CloseModalButton onClick={() => setSelectedLog(null)}>Fermer</CloseModalButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default ActivityLogsPage;
