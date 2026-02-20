import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import systemLogService, { SystemLog } from '../services/systemLogService';

// ============= STYLED COMPONENTS =============

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

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color?: string }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => props.color || '#3b82f6'};
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

const RefreshButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
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

const TableRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  color: #1e293b;
`;

const LevelBadge = styled.span<{ level: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.level) {
      case 'debug': return '#e0e7ff';
      case 'info': return '#dbeafe';
      case 'warn': return '#fef3c7';
      case 'error': return '#fee2e2';
      case 'fatal': return '#fecaca';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.level) {
      case 'debug': return '#3730a3';
      case 'info': return '#1e40af';
      case 'warn': return '#92400e';
      case 'error': return '#991b1b';
      case 'fatal': return '#7f1d1d';
      default: return '#374151';
    }
  }};
`;

const TypeBadge = styled.span<{ type: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.type) {
      case 'console': return '#f0fdf4';
      case 'application': return '#fef3c7';
      case 'security': return '#fee2e2';
      case 'performance': return '#dbeafe';
      case 'integration': return '#f3e8ff';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'console': return '#15803d';
      case 'application': return '#92400e';
      case 'security': return '#991b1b';
      case 'performance': return '#1e40af';
      case 'integration': return '#6b21a8';
      default: return '#374151';
    }
  }};
`;

const MessageCell = styled(TableCell)`
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  font-size: 1.125rem;
  color: #64748b;
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
  word-break: break-word;
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

// ============= COMPONENT =============

const SystemLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const [filters, setFilters] = useState({
    logLevel: '',
    logType: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters, currentPage, pageSize]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logs = await systemLogService.getLogs({
        page: currentPage,
        pageSize: pageSize,
        logLevel: filters.logLevel || undefined,
        logType: filters.logType || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      setLogs(logs);
      // In a real implementation, you'd also get total from the response
      setTotalLogs(logs.length * 10); // Placeholder - need API to return total
    } catch (error) {
      console.error('Error fetching system logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await systemLogService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching system logs stats:', error);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Chargement des logs système...</LoadingMessage>
      </Container>
    );
  }

  const totalPages = Math.ceil(totalLogs / pageSize);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(page => {
      if (totalPages <= 5) return true;
      if (page <= 2) return true;
      if (page >= totalPages - 1) return true;
      if (Math.abs(page - currentPage) <= 1) return true;
      return false;
    });

  return (
    <Container>
      <Header>
        <Title>🖥️ Logs Système</Title>
        <Subtitle>Suivi détaillé de tous les logs système, console et application</Subtitle>
      </Header>

      {stats && (
        <StatsContainer>
          <StatCard color="#3b82f6">
            <StatValue>{stats.total || 0}</StatValue>
            <StatLabel>Total Logs</StatLabel>
          </StatCard>
          {Object.entries(stats.byLevel || {}).map(([level, count]: [string, any]) => (
            <StatCard key={level} color="#10b981">
              <StatValue>{count}</StatValue>
              <StatLabel>{level.toUpperCase()}</StatLabel>
            </StatCard>
          ))}
        </StatsContainer>
      )}

      <FiltersContainer>
        <FilterInput
          placeholder="Rechercher par message..."
          value={filters.search}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value });
            setCurrentPage(1);
          }}
        />
        <FilterSelect
          value={filters.logLevel}
          onChange={(e) => {
            setFilters({ ...filters, logLevel: e.target.value });
            setCurrentPage(1);
          }}
        >
          <option value="">Tous les niveaux</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="fatal">Fatal</option>
        </FilterSelect>
        <FilterSelect
          value={filters.logType}
          onChange={(e) => {
            setFilters({ ...filters, logType: e.target.value });
            setCurrentPage(1);
          }}
        >
          <option value="">Tous les types</option>
          <option value="console">Console</option>
          <option value="application">Application</option>
          <option value="security">Sécurité</option>
          <option value="performance">Performance</option>
          <option value="integration">Intégration</option>
        </FilterSelect>
        <RefreshButton onClick={fetchLogs}>
          🔄 Actualiser
        </RefreshButton>
      </FiltersContainer>

      <LogsTable>
        <thead>
          <tr>
            <TableHeader>Date & Heure</TableHeader>
            <TableHeader>Niveau</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Catégorie</TableHeader>
            <TableHeader>Message</TableHeader>
            <TableHeader style={{ textAlign: 'center' }}>Détails</TableHeader>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <TableCell colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                Aucun log trouvé
              </TableCell>
            </tr>
          ) : (
            logs.map((log, index) => (
              <TableRow key={log.id || index}>
                <TableCell>{formatTimestamp(log.createdAt)}</TableCell>
                <TableCell>
                  <LevelBadge level={log.logLevel || 'info'}>
                    {log.logLevel?.toUpperCase()}
                  </LevelBadge>
                </TableCell>
                <TableCell>
                  <TypeBadge type={log.logType || 'application'}>
                    {log.logType}
                  </TypeBadge>
                </TableCell>
                <TableCell>{log.category || '-'}</TableCell>
                <MessageCell title={log.message}>{log.message}</MessageCell>
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
          <PageSizeSelect 
            value={pageSize} 
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
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

          <PageNumbersContainer>
            {pageNumbers.map((page) => (
              <PageNumberButton
                key={page}
                active={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </PageNumberButton>
            ))}
          </PageNumbersContainer>

          <PaginationButton 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
          >
            Suivant &gt;
          </PaginationButton>
          <PaginationButton 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
          >
            Dernière ➡️
          </PaginationButton>
        </PaginationControls>
      </PaginationContainer>

      {/* Modal Détails Log */}
      {selectedLog && (
        <ModalOverlay onClick={() => setSelectedLog(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>📋 Détails du Log</ModalTitle>
              <CloseButton onClick={() => setSelectedLog(null)}>✕</CloseButton>
            </ModalHeader>

            <ModalBody>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>Date & Heure</DetailLabel>
                  <DetailValue>{formatTimestamp(selectedLog.createdAt)}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Niveau</DetailLabel>
                  <DetailValue>
                    <LevelBadge level={selectedLog.logLevel || 'info'}>
                      {selectedLog.logLevel?.toUpperCase()}
                    </LevelBadge>
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Type</DetailLabel>
                  <DetailValue>
                    <TypeBadge type={selectedLog.logType || 'application'}>
                      {selectedLog.logType}
                    </TypeBadge>
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Catégorie</DetailLabel>
                  <DetailValue>{selectedLog.category || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Source</DetailLabel>
                  <DetailValue>{selectedLog.source || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Utilisateur</DetailLabel>
                  <DetailValue>{selectedLog.username || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>IP Address</DetailLabel>
                  <DetailValue>{selectedLog.ipAddress || '-'}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Session ID</DetailLabel>
                  <DetailValue style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {selectedLog.sessionId || '-'}
                  </DetailValue>
                </DetailItem>
              </DetailGrid>

              {selectedLog.message && (
                <DetailSection>
                  <DetailSectionTitle>Message</DetailSectionTitle>
                  <DetailCodeBlock>{selectedLog.message}</DetailCodeBlock>
                </DetailSection>
              )}

              {selectedLog.stackTrace && (
                <DetailSection>
                  <DetailSectionTitle>Stack Trace</DetailSectionTitle>
                  <DetailCodeBlock>{selectedLog.stackTrace}</DetailCodeBlock>
                </DetailSection>
              )}

              {selectedLog.metadata && (
                <DetailSection>
                  <DetailSectionTitle>Métadonnées</DetailSectionTitle>
                  <DetailCodeBlock>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
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

export default SystemLogsPage;
