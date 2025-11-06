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

const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    username: '',
    action: '',
    resource_type: '',
    status: ''
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.username) params.append('username', filters.username);
      if (filters.action) params.append('action', filters.action);
      if (filters.resource_type) params.append('resource_type', filters.resource_type);
      if (filters.status) params.append('status', filters.status);
      params.append('limit', '50');

      const response = await fetch(`http://localhost:5000/api/logs?${params}`, {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
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
          onChange={(e) => setFilters({ ...filters, username: e.target.value })}
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
              </TableRow>
            ))
          )}
        </tbody>
      </LogsTable>
    </Container>
  );
};

// Styled Components
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
  color: #1e293b;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
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
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
`;

const ActionBadge = styled.span`
  background: #f3e8ff;
  color: #6b21a8;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
`;

const ResourceBadge = styled.span`
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  background: ${props => {
    switch (props.status) {
      case 'success': return '#d1fae5';
      case 'error': return '#fee2e2';
      case 'warning': return '#fed7aa';
      default: return '#e5e7eb';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'success': return '#065f46';
      case 'error': return '#991b1b';
      case 'warning': return '#92400e';
      default: return '#374151';
    }
  }};
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: capitalize;
`;

const IpBadge = styled.span`
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.125rem;
  color: #64748b;
`;

export default ActivityLogsPage;
