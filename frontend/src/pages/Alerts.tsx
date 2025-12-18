import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaBell, FaCheck, FaTrash, FaClock, FaFilter, FaDownload } from 'react-icons/fa';

interface Alert {
  id: number;
  level: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  source?: string;
  device_id?: string;
  device_name?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

type AlertLevel = 'all' | 'info' | 'warning' | 'critical' | 'emergency';
type AlertStatus = 'all' | 'active' | 'acknowledged' | 'resolved';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<AlertLevel>('all');
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get icon based on alert level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'emergency': return '🚨';
      case 'critical': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📌';
    }
  };

  // Charger les alertes depuis les logs et métriques
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const alertsList: Alert[] = [];
      let alertId = 1;

      // Récupérer les logs d'activité
      try {
        const logsResponse = await fetch('http://localhost:5000/api/activity-logs');
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          const logs = logsData.data || [];

          // Transformer les logs en alertes
          logs.forEach((log: any) => {
            // Créer une alerte si le statut est "error"
            if (log.status === 'error') {
              alertsList.push({
                id: alertId++,
                level: 'critical',
                title: `Erreur: ${log.action}`,
                message: log.details || `Erreur lors de ${log.action} sur ${log.resourceType}`,
                source: 'Activity Logs',
                device_id: log.resourceId,
                device_name: log.resourceName,
                status: 'active',
                created_at: log.timestamp || new Date().toISOString(),
              });
            }
            // Créer une alerte pour les actions DELETE
            if (log.action === 'DELETE') {
              alertsList.push({
                id: alertId++,
                level: 'warning',
                title: `Suppression: ${log.resourceType}`,
                message: `${log.resourceName} a été supprimé par ${log.username}`,
                source: 'Activity Logs',
                device_id: log.resourceId,
                device_name: log.resourceName,
                status: 'active',
                created_at: log.timestamp || new Date().toISOString(),
              });
            }
          });
        }
      } catch (err) {
        console.error('Erreur chargement logs:', err);
      }

      // Récupérer les métriques et créer des alertes basées sur les seuils
      try {
        const metricsResponse = await fetch('http://localhost:5000/api/agentless/devices');
        if (metricsResponse.ok) {
          const devicesData = await metricsResponse.json();
          const devices = devicesData.data || [];

          // Pour chaque device, récupérer les dernières métriques
          for (const device of devices) {
            try {
              const deviceMetricsResponse = await fetch(`http://localhost:5000/api/agentless/metrics/${device.id}?limit=1`);
              if (deviceMetricsResponse.ok) {
                const metricsData = await deviceMetricsResponse.json();
                const metrics = metricsData.data?.[0];

                if (metrics) {
                  // Alerte CPU élevé (> 80%)
                  if (metrics.cpu_percent && metrics.cpu_percent > 80) {
                    alertsList.push({
                      id: alertId++,
                      level: metrics.cpu_percent > 95 ? 'critical' : 'warning',
                      title: `CPU élevé: ${device.name}`,
                      message: `Utilisation CPU à ${metrics.cpu_percent}% sur ${device.name}`,
                      source: 'System Metrics',
                      device_id: device.id,
                      device_name: device.name,
                      status: 'active',
                      created_at: metrics.timestamp || new Date().toISOString(),
                    });
                  }

                  // Alerte Mémoire élevée (> 85%)
                  if (metrics.memory_percent && metrics.memory_percent > 85) {
                    alertsList.push({
                      id: alertId++,
                      level: metrics.memory_percent > 95 ? 'critical' : 'warning',
                      title: `Mémoire élevée: ${device.name}`,
                      message: `Utilisation mémoire à ${metrics.memory_percent}% sur ${device.name}`,
                      source: 'System Metrics',
                      device_id: device.id,
                      device_name: device.name,
                      status: 'active',
                      created_at: metrics.timestamp || new Date().toISOString(),
                    });
                  }

                  // Alerte Disque élevé (> 90%)
                  if (metrics.disk_percent && metrics.disk_percent > 90) {
                    alertsList.push({
                      id: alertId++,
                      level: 'critical',
                      title: `Disque plein: ${device.name}`,
                      message: `Utilisation disque à ${metrics.disk_percent}% sur ${device.name}`,
                      source: 'System Metrics',
                      device_id: device.id,
                      device_name: device.name,
                      status: 'active',
                      created_at: metrics.timestamp || new Date().toISOString(),
                    });
                  }
                }
              }
            } catch (err) {
              console.error(`Erreur chargement métriques device ${device.id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Erreur chargement devices:', err);
      }

      // Appliquer les filtres
      let filtered = alertsList;

      if (selectedLevel !== 'all') {
        filtered = filtered.filter(a => a.level === selectedLevel);
      }

      if (selectedStatus !== 'all') {
        filtered = filtered.filter(a => a.status === selectedStatus);
      }

      // Trier par date (plus récents en premier)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAlerts(filtered);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement alertes:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedStatus]);

  // Charger les alertes au montage et quand les filtres changent
  React.useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Filtrer les alertes par recherche
  const filteredAlerts = alerts.filter(alert => {
    const query = searchQuery.toLowerCase();
    return (
      alert.title.toLowerCase().includes(query) ||
      alert.message.toLowerCase().includes(query) ||
      alert.device_name?.toLowerCase().includes(query)
    );
  });

  // Compter les alertes par niveau
  const stats = {
    total: alerts.length,
    emergency: alerts.filter(a => a.level === 'emergency').length,
    critical: alerts.filter(a => a.level === 'critical').length,
    warning: alerts.filter(a => a.level === 'warning').length,
    info: alerts.filter(a => a.level === 'info').length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: 'User' })
      });

      if (response.ok) {
        await loadAlerts();
      }
    } catch (err) {
      console.error('Erreur acknowledge:', err);
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAlerts();
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Titre', 'Niveau', 'Statut', 'Équipement', 'Source', 'Date', 'Message'].join(';'),
      ...filteredAlerts.map(a => [
        a.title,
        a.level,
        a.status,
        a.device_name || '-',
        a.source || '-',
        new Date(a.created_at).toLocaleString('fr-FR'),
        `"${a.message}"`
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alertes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Container>
      {/* Header */}
      <TopBar>
        <TopBarLeft>
          <PageTitle><FaBell /> Alertes</PageTitle>
          <CountBadge>{stats.total}</CountBadge>
        </TopBarLeft>
        <TopBarRight>
          <ExportButton onClick={handleExportCSV}>
            <FaDownload /> CSV
          </ExportButton>
        </TopBarRight>
      </TopBar>

      {/* Main Content */}
      <MainContent>
        {/* Sidebar Filters */}
        <Sidebar>
          <FilterCard>
            <FilterTitle>Par Sévérité</FilterTitle>
            <FilterList>
              <FilterItem onClick={() => { setSelectedLevel('all'); }} isActive={selectedLevel === 'all'}>
                <FilterLabel>Tous</FilterLabel>
                <FilterCount>{stats.total}</FilterCount>
              </FilterItem>
              <FilterItem onClick={() => setSelectedLevel('emergency')} isActive={selectedLevel === 'emergency'}>
                <FilterBullet color="#ef4444">🚨</FilterBullet>
                <FilterLabel>Urgence</FilterLabel>
                <FilterCount>{stats.emergency}</FilterCount>
              </FilterItem>
              <FilterItem onClick={() => setSelectedLevel('critical')} isActive={selectedLevel === 'critical'}>
                <FilterBullet color="#dc2626">❌</FilterBullet>
                <FilterLabel>Critique</FilterLabel>
                <FilterCount>{stats.critical}</FilterCount>
              </FilterItem>
              <FilterItem onClick={() => setSelectedLevel('warning')} isActive={selectedLevel === 'warning'}>
                <FilterBullet color="#f59e0b">⚠️</FilterBullet>
                <FilterLabel>Avertissements</FilterLabel>
                <FilterCount>{stats.warning}</FilterCount>
              </FilterItem>
              <FilterItem onClick={() => setSelectedLevel('info')} isActive={selectedLevel === 'info'}>
                <FilterBullet color="#3b82f6">ℹ️</FilterBullet>
                <FilterLabel>Info</FilterLabel>
                <FilterCount>{stats.info}</FilterCount>
              </FilterItem>
            </FilterList>
          </FilterCard>

          <FilterCard>
            <FilterTitle>Par Statut</FilterTitle>
            <FilterList>
              <FilterItem onClick={() => setSelectedStatus('all')} isActive={selectedStatus === 'all'}>
                <FilterLabel>Tous</FilterLabel>
                <FilterCount>{stats.total}</FilterCount>
              </FilterItem>
              <FilterItem onClick={() => setSelectedStatus('active')} isActive={selectedStatus === 'active'}>
                <FilterBullet color="#ef4444">●</FilterBullet>
                <FilterLabel>Actives</FilterLabel>
                <FilterCount>{stats.active}</FilterCount>
              </FilterItem>
              <FilterItem onClick={() => setSelectedStatus('acknowledged')} isActive={selectedStatus === 'acknowledged'}>
                <FilterBullet color="#10b981">●</FilterBullet>
                <FilterLabel>Acquittées</FilterLabel>
                <FilterCount>{stats.acknowledged}</FilterCount>
              </FilterItem>
            </FilterList>
          </FilterCard>
        </Sidebar>

        {/* Content Area */}
        <ContentArea>
          {/* Search Bar */}
          <SearchBar>
            <SearchInput
              type="text"
              placeholder="Rechercher une alerte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBar>

          {/* Alerts List */}
          {error && <ErrorMessage>{error}</ErrorMessage>}

          {loading ? (
            <EmptyState>
              <EmptyIcon>⏳</EmptyIcon>
              <EmptyText>Chargement des alertes...</EmptyText>
            </EmptyState>
          ) : filteredAlerts.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📭</EmptyIcon>
              <EmptyText>
                {searchQuery 
                  ? 'Aucune alerte ne correspond à votre recherche'
                  : 'Aucune alerte pour ce filtre'
                }
              </EmptyText>
            </EmptyState>
          ) : (
            <AlertsTable>
              <TableHeader>
                <TableHeaderCell width="10%">Niveau</TableHeaderCell>
                <TableHeaderCell width="30%">Titre</TableHeaderCell>
                <TableHeaderCell width="20%">Équipement</TableHeaderCell>
                <TableHeaderCell width="15%">Statut</TableHeaderCell>
                <TableHeaderCell width="20%">Date</TableHeaderCell>
                <TableHeaderCell width="5%">Actions</TableHeaderCell>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} level={alert.level}>
                    <TableCell>
                      <LevelBadge level={alert.level}>
                        {getLevelIcon(alert.level)}
                      </LevelBadge>
                    </TableCell>
                    <TableCell>
                      <AlertTitle>{alert.title}</AlertTitle>
                      <AlertDesc>{alert.message}</AlertDesc>
                    </TableCell>
                    <TableCell>{alert.device_name || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={alert.status}>
                        {alert.status === 'active' ? 'Actif' : alert.status === 'acknowledged' ? 'Acquitté' : 'Résolu'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      {new Date(alert.created_at).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <ActionGroup>
                        {alert.status === 'active' && (
                          <ActionIconButton onClick={() => handleAcknowledge(alert.id)} title="Acquitter">
                            <FaCheck />
                          </ActionIconButton>
                        )}
                        <ActionIconButton onClick={() => handleDelete(alert.id)} title="Supprimer" danger>
                          <FaTrash />
                        </ActionIconButton>
                      </ActionGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </AlertsTable>
          )}
        </ContentArea>
      </MainContent>
    </Container>
  );
};

// ============= STYLES =============

const Container = styled.div`
  background: #f5f7fa;
  min-height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountBadge = styled.span`
  background: #eff6ff;
  color: #0066ff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  gap: 0;
`;

const Sidebar = styled.div`
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 24px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
  }
`;

const FilterCard = styled.div`
  background: #fafbfc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    flex: 0 0 auto;
  }
`;

const FilterTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.5px;
`;

const FilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterItem = styled.button<{ isActive: boolean }>`
  background: ${props => props.isActive ? '#eff6ff' : 'transparent'};
  border: none;
  color: ${props => props.isActive ? '#0066ff' : '#4b5563'};
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.isActive ? '600' : '500'};
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #eff6ff;
    color: #0066ff;
  }
`;

const FilterBullet = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
  display: inline-block;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FilterLabel = styled.span`
  flex: 1;
  text-align: left;
`;

const FilterCount = styled.span`
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const SearchBar = styled.div`
  display: flex;
  gap: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #1f2937;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ExportButton = styled.button`
  padding: 10px 16px;
  background: #0066ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #0052cc;
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #991b1b;
  font-size: 14px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #9ca3af;
  font-size: 14px;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  margin: 0;
  font-weight: 500;
`;

const AlertsTable = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  background: #f9fafb;
  display: grid;
  grid-template-columns: 10% 30% 20% 15% 20% 5%;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  padding: 0;

  @media (max-width: 1024px) {
    grid-template-columns: 15% 35% 15% 20% 10% 5%;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const TableHeaderCell = styled.div<{ width?: string }>`
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.5px;
  width: ${props => props.width};
`;

const TableBody = styled.div`
  display: flex;
  flex-direction: column;
`;

const TableRow = styled.div<{ level: string }>`
  display: grid;
  grid-template-columns: 10% 30% 20% 15% 20% 5%;
  gap: 0;
  padding: 0;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
  transition: background 0.2s ease;
  border-left: 4px solid ${props => {
    switch (props.level) {
      case 'emergency': return '#ef4444';
      case 'critical': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#0066ff';
    }
  }};

  &:hover {
    background: #f9fafb;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 15% 35% 15% 20% 10% 5%;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid #e5e7eb;
    border-left: 4px solid ${props => {
      switch (props.level) {
        case 'emergency': return '#ef4444';
        case 'critical': return '#dc2626';
        case 'warning': return '#f59e0b';
        case 'info': return '#3b82f6';
        default: return '#0066ff';
      }
    }};
    border-radius: 8px;
    background: white;
  }
`;

const TableCell = styled.div`
  padding: 16px;
  font-size: 14px;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    padding: 8px 0;
    white-space: normal;
  }
`;

const LevelBadge = styled.span<{ level: string }>`
  font-size: 18px;
  display: inline-block;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  white-space: normal;
`;

const AlertDesc = styled.div`
  font-size: 13px;
  color: #9ca3af;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#fee2e2';
      case 'acknowledged': return '#dbeafe';
      default: return '#e5e7eb';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#991b1b';
      case 'acknowledged': return '#1e40af';
      default: return '#374151';
    }
  }};
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const ActionIconButton = styled.button<{ danger?: boolean }>`
  padding: 6px 8px;
  background: ${props => props.danger ? '#fee2e2' : '#dbeafe'};
  color: ${props => props.danger ? '#dc2626' : '#0066ff'};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.danger ? '#fecaca' : '#bfdbfe'};
    transform: scale(1.05);
  }
`;

export default Alerts;