import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/Common/Pagination';
import { LoadingSpinner, ErrorMessage } from '../components/Common';
import { LogEntry, LogLevel } from '../types/monitoring';

type LogLevelType = LogLevel;

const Logs: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Debouncer la recherche pour éviter trop d'appels
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Pour l'instant, utilisons des données vides en attendant la correction de l'API
  const logsQuery = {
    data: [] as LogEntry[],
    isLoading: false,
    error: null
  };

  const statsQuery = {
    data: {
      total: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0
    }
  };

  // Les logs sont déjà filtrés par l'API
  const filteredLogs = useMemo(() => {
    if (!logsQuery.data) return [];
    return Array.isArray(logsQuery.data) ? logsQuery.data : [];
  }, [logsQuery.data]);

  // Obtenir les statistiques
  const stats = useMemo(() => {
    if (statsQuery.data) {
      return statsQuery.data;
    }
    
    // Fallback avec les logs filtrés si les stats ne sont pas disponibles
    return {
      total: filteredLogs.length,
      error: filteredLogs.filter((log: any) => log.level === 'error').length,
      warning: filteredLogs.filter((log: any) => log.level === 'warning').length,
      info: filteredLogs.filter((log: any) => log.level === 'info').length,
      debug: filteredLogs.filter((log: any) => log.level === 'debug').length
    };
  }, [statsQuery.data, filteredLogs]);

  // Pagination des logs
  const [paginatedLogs, paginationControls] = usePagination(filteredLogs, 25);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now.getTime() - logTime.getTime();
    
    if (diffMs < 60000) return 'Il y a quelques secondes';
    if (diffMs < 3600000) return `Il y a ${Math.floor(diffMs / 60000)} min`;
    if (diffMs < 86400000) return `Il y a ${Math.floor(diffMs / 3600000)}h`;
    return `Il y a ${Math.floor(diffMs / 86400000)} jour(s)`;
  };

  const getLevelIcon = (level: LogLevelType) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔧';
      default: return '📄';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'device': return '🖥️';
      case 'authentication': return '🔐';
      case 'alert': return '🚨';
      case 'configuration': return '⚙️';
      case 'request': return '🌐';
      case 'user': return '👤';
      case 'discovery': return '🔍';
      default: return '📄';
    }
  };

  // Fonction d'export des logs
  const handleExport = () => {
    const csvContent = [
      // En-têtes
      ['Horodatage', 'Niveau', 'Source', 'Catégorie', 'Message', 'Détails', 'Équipement', 'Utilisateur'].join(';'),
      // Données
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.level.toUpperCase(),
        log.source,
        log.category,
        `"${log.message}"`,
        `"${log.details || ''}"`,
        log.deviceName || '',
        log.username || ''
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Gestion des états de chargement et d'erreur
  if (logsQuery.isLoading) {
    return <LoadingSpinner message="Chargement des journaux..." />;
  }

  if (logsQuery.error) {
    return <ErrorMessage message="Erreur lors du chargement des journaux" />;
  }

  if (filteredLogs.length === 0) {
    return (
      <Container>
        <Header>
          <Title>
            📋 Journaux Système
          </Title>
        </Header>
        
        <FiltersSection>
          <FilterGroup>
            <FilterLabel>Niveau :</FilterLabel>
            <FilterSelect value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              <option value="all">Tous les niveaux</option>
              <option value="error">Erreurs</option>
              <option value="warning">Avertissements</option>
              <option value="info">Informations</option>
              <option value="debug">Debug</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Catégorie :</FilterLabel>
            <FilterSelect value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">Toutes les catégories</option>
              <option value="device">Équipements</option>
              <option value="authentication">Authentification</option>
              <option value="alert">Alertes</option>
              <option value="configuration">Configuration</option>
              <option value="request">Requêtes API</option>
              <option value="user">Utilisateurs</option>
              <option value="discovery">Découverte</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Période :</FilterLabel>
            <FilterSelect value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)}>
              <option value="1h">Dernière heure</option>
              <option value="6h">6 dernières heures</option>
              <option value="24h">24 dernières heures</option>
              <option value="7d">7 derniers jours</option>
              <option value="all">Toute la période</option>
            </FilterSelect>
          </FilterGroup>

          <SearchGroup>
            <SearchInput
              type="text"
              placeholder="Rechercher dans les logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon>🔍</SearchIcon>
          </SearchGroup>
        </FiltersSection>

        {/* Message d'état vide */}
        <EmptyState>
          <EmptyIcon>📝</EmptyIcon>
          <EmptyTitle>Aucun journal trouvé</EmptyTitle>
          <EmptyMessage>
            {!logsQuery.data || (Array.isArray(logsQuery.data) && logsQuery.data.length === 0)
              ? "Il n'y a encore aucun log dans le système. Les logs seront automatiquement générés lors des activités sur la plateforme."
              : "Aucun log ne correspond aux filtres sélectionnés. Essayez de modifier les critères de recherche."
            }
          </EmptyMessage>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          📋 Journaux Système
        </Title>
      </Header>

      <FiltersSection>
        <FilterGroup>
          <FilterLabel>Niveau :</FilterLabel>
          <FilterSelect value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
            <option value="all">Tous les niveaux</option>
            <option value="error">Erreurs</option>
            <option value="warning">Avertissements</option>
            <option value="info">Informations</option>
            <option value="debug">Debug</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Catégorie :</FilterLabel>
          <FilterSelect value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">Toutes les catégories</option>
            <option value="device">Équipements</option>
            <option value="authentication">Authentification</option>
            <option value="alert">Alertes</option>
            <option value="configuration">Configuration</option>
            <option value="request">Requêtes API</option>
            <option value="user">Utilisateurs</option>
            <option value="discovery">Découverte</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Période :</FilterLabel>
          <FilterSelect value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)}>
            <option value="1h">Dernière heure</option>
            <option value="6h">6 dernières heures</option>
            <option value="24h">24 dernières heures</option>
            <option value="7d">7 derniers jours</option>
            <option value="all">Toute la période</option>
          </FilterSelect>
        </FilterGroup>

        <SearchGroup>
          <SearchInput
            type="text"
            placeholder="Rechercher dans les logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon>🔍</SearchIcon>
        </SearchGroup>
      </FiltersSection>

      <StatsSection>
        <StatCard level="total">
          <StatIcon>📊</StatIcon>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total</StatLabel>
        </StatCard>
        <StatCard level="error">
          <StatIcon>❌</StatIcon>
          <StatValue>{stats.error}</StatValue>
          <StatLabel>Erreurs</StatLabel>
        </StatCard>
        <StatCard level="warning">
          <StatIcon>⚠️</StatIcon>
          <StatValue>{stats.warning}</StatValue>
          <StatLabel>Avertissements</StatLabel>
        </StatCard>
        <StatCard level="info">
          <StatIcon>ℹ️</StatIcon>
          <StatValue>{stats.info}</StatValue>
          <StatLabel>Informations</StatLabel>
        </StatCard>
        <StatCard level="debug">
          <StatIcon>🔧</StatIcon>
          <StatValue>{stats.debug}</StatValue>
          <StatLabel>Debug</StatLabel>
        </StatCard>
      </StatsSection>

      <LogsSection>
        <LogsHeader>
          <LogsTitle>Entrées de journal ({stats.total})</LogsTitle>
          <ExportButton onClick={handleExport}>
            📥 Exporter CSV
          </ExportButton>
        </LogsHeader>

        <LogsList>
          {paginatedLogs.map(log => (
            <LogEntryItem key={log.id} onClick={() => setSelectedLog(log)}>
              <LogMain>
                <LogHeader>
                  <LogLevelStyled level={log.level}>
                    {getLevelIcon(log.level)}
                  </LogLevelStyled>
                  <LogCategory>
                    {getCategoryIcon(log.category)}
                  </LogCategory>
                  <LogMessage>{log.message}</LogMessage>
                  <LogTime>{getRelativeTime(log.timestamp)}</LogTime>
                </LogHeader>
                <LogDetails>{log.details}</LogDetails>
                <LogMeta>
                  <LogSource>Source: {log.source}</LogSource>
                  <LogTimestamp>{formatTimestamp(log.timestamp)}</LogTimestamp>
                  {log.deviceName && <LogDevice>Équipement: {log.deviceName}</LogDevice>}
                  {log.username && <LogUser>Utilisateur: {log.username}</LogUser>}
                </LogMeta>
              </LogMain>
            </LogEntryItem>
          ))}
        </LogsList>
      </LogsSection>

      {/* Modal de détails du log */}
      {selectedLog && (
        <ModalOverlay onClick={() => setSelectedLog(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {getLevelIcon(selectedLog.level)} Détails du journal
              </ModalTitle>
              <CloseButton onClick={() => setSelectedLog(null)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>
              <DetailRow>
                <DetailLabel>Horodatage :</DetailLabel>
                <DetailValue>{formatTimestamp(selectedLog.timestamp)}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Niveau :</DetailLabel>
                <DetailBadge level={selectedLog.level}>
                  {getLevelIcon(selectedLog.level)} {selectedLog.level.toUpperCase()}
                </DetailBadge>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Source :</DetailLabel>
                <DetailValue>{selectedLog.source}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Catégorie :</DetailLabel>
                <DetailValue>
                  {getCategoryIcon(selectedLog.category)} {selectedLog.category}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Message :</DetailLabel>
                <DetailValue>{selectedLog.message}</DetailValue>
              </DetailRow>
              {selectedLog.details && (
                <DetailRow>
                  <DetailLabel>Détails :</DetailLabel>
                  <DetailValue>{selectedLog.details}</DetailValue>
                </DetailRow>
              )}
              {selectedLog.deviceName && (
                <DetailRow>
                  <DetailLabel>Équipement :</DetailLabel>
                  <DetailValue>{selectedLog.deviceName} ({selectedLog.deviceId})</DetailValue>
                </DetailRow>
              )}
              {selectedLog.username && (
                <DetailRow>
                  <DetailLabel>Utilisateur :</DetailLabel>
                  <DetailValue>{selectedLog.username} ({selectedLog.userId})</DetailValue>
                </DetailRow>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      <Pagination 
        controls={paginationControls}
        limitOptions={[10, 25, 50, 100]}
      />
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
`;


const FiltersSection = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const FilterSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  min-width: 150px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchGroup = styled.div`
  position: relative;
  flex: 1;
  max-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div<{ level?: string }>`
  background: ${props => {
    switch (props.level) {
      case 'error': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'warning': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'info': return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      case 'debug': return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      default: return 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)';
    }
  }};
  border: none;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: white;
  box-shadow: 0 8px 32px ${props => {
    switch (props.level) {
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'info': return 'rgba(59, 130, 246, 0.3)';
      case 'debug': return 'rgba(107, 114, 128, 0.3)';
      default: return 'rgba(96, 165, 250, 0.3)';
    }
  }};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => {
      switch (props.level) {
        case 'error': return 'rgba(239, 68, 68, 0.4)';
        case 'warning': return 'rgba(245, 158, 11, 0.4)';
        case 'info': return 'rgba(59, 130, 246, 0.4)';
        case 'debug': return 'rgba(107, 114, 128, 0.4)';
        default: return 'rgba(96, 165, 250, 0.4)';
      }
    }};
  }
`;

const StatIcon = styled.div`
  font-size: 28px;
  margin-bottom: 12px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LogsSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`;

const LogsHeader = styled.div`
  background: white;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LogsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ExportButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LogsList = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

const LogEntryItem = styled.div`
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const LogMain = styled.div``;

const LogHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const LogLevelStyled = styled.div<{ level: LogLevelType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: ${props => {
    switch (props.level) {
      case 'error': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'warning': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'info': return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      case 'debug': return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      default: return 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)';
    }
  }};
`;

const LogCategory = styled.div`
  font-size: 18px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 8px;
  border: 1px solid #cbd5e1;
`;

const LogMessage = styled.div`
  font-weight: 600;
  color: #1e293b;
  flex: 1;
  font-size: 16px;
`;

const LogTime = styled.div`
  font-size: 13px;
  color: #64748b;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-weight: 500;
`;

const LogDetails = styled.div`
  color: #64748b;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
`;

const LogMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #94a3b8;
`;

const LogSource = styled.span``;
const LogTimestamp = styled.span``;
const LogDevice = styled.span``;
const LogUser = styled.span``;

// Styles pour l'état vide
const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
`;

const EmptyMessage = styled.p`
  font-size: 16px;
  line-height: 1.5;
  max-width: 500px;
  margin: 0 auto;
  color: #64748b;
`;

// Modal Styles
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
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  margin: 20px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  background: #f8fafc;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #64748b;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
`;

const DetailRow = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  font-size: 14px;
`;

const DetailValue = styled.div`
  color: #1e293b;
  line-height: 1.4;
`;

const DetailBadge = styled.div<{ level: LogLevelType }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.level) {
      case 'error': return '#fee2e2';
      case 'warning': return '#fef3c7';
      case 'info': return '#dbeafe';
      case 'debug': return '#f3f4f6';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.level) {
      case 'error': return '#991b1b';
      case 'warning': return '#92400e';
      case 'info': return '#1e40af';
      case 'debug': return '#374151';
      default: return '#475569';
    }
  }};
`;

export default Logs;