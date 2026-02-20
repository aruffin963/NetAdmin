import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import { LoadingSpinner, ErrorMessage } from '../components/Common';
import { LogEntry, LogLevel } from '../types/monitoring';
import { LogsService, LogFilter } from '../services/logsService';

type LogLevelType = LogLevel;

interface LogsPageState {
  logs: LogEntry[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

const Logs: React.FC = () => {
  // Estados de filtros
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'level' | 'category'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Estados de datos
  const [logsState, setLogsState] = useState<LogsPageState>({
    logs: [],
    total: 0,
    isLoading: true,
    error: null
  });

  const [stats, setStats] = useState({
    total: 0,
    byLevel: { error: 0, warning: 0, info: 0, debug: 0 },
    byCategory: {}
  });

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);

  // Estados para filtros dinámicos
  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  // Debouncer para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Función para calcular rango de fechas según timeRange
  const getDateRange = useCallback((range: string): { start?: Date; end?: Date } => {
    const now = new Date();
    switch (range) {
      case '1h':
        return { start: new Date(now.getTime() - 3600000) };
      case '6h':
        return { start: new Date(now.getTime() - 21600000) };
      case '24h':
        return { start: new Date(now.getTime() - 86400000) };
      case '7d':
        return { start: new Date(now.getTime() - 604800000) };
      default:
        return {};
    }
  }, []);

  // Cargar logs cuando cambian los filtros
  useEffect(() => {
    const fetchLogs = async () => {
      setLogsState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const dateRange = getDateRange(selectedTimeRange);
        const filters: LogFilter = {
          search: searchQuery,
          level: selectedLevel === 'all' ? undefined : selectedLevel,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          username: selectedUsername || undefined,
          startDate: dateRange.start,
          endDate: dateRange.end,
          limit: pageSize,
          offset: currentPage * pageSize,
          sortBy,
          sortOrder
        };

        const response = await LogsService.getLogs(filters);
        setLogsState({
          logs: response.data || [],
          total: response.total || 0,
          isLoading: false,
          error: null
        });

        // Cargar estadísticas
        const statsData = await LogsService.getStats({
          startDate: dateRange.start,
          endDate: dateRange.end
        });
        setStats(statsData);
      } catch (err: any) {
        setLogsState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Error al cargar los logs'
        }));
      }
    };

    fetchLogs();
  }, [selectedLevel, selectedCategory, selectedSource, selectedUsername, selectedTimeRange, searchQuery, sortBy, sortOrder, currentPage, pageSize, getDateRange]);

  // Cargar categorías y fuentes disponibles
  useEffect(() => {
    const loadDynamicFilters = async () => {
      try {
        const [cats, srcs] = await Promise.all([
          LogsService.getCategories(),
          LogsService.getSources()
        ]);
        setCategories(cats);
        setSources(srcs);
      } catch (err) {
        // Silently fail
      }
    };
    loadDynamicFilters();
  }, []);

  const formatTimestamp = (timestamp: any) => {
    try {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getRelativeTime = (timestamp: any) => {
    try {
      if (!timestamp) return 'Desconocido';
      const now = new Date();
      const logTime = new Date(timestamp);
      if (isNaN(logTime.getTime())) return 'Fecha inválida';
      const diffMs = now.getTime() - logTime.getTime();

      if (diffMs < 60000) return 'Il y a quelques secondes';
      if (diffMs < 3600000) return `Il y a ${Math.floor(diffMs / 60000)} min`;
      if (diffMs < 86400000) return `Il y a ${Math.floor(diffMs / 3600000)}h`;
      return `Il y a ${Math.floor(diffMs / 86400000)} jour(s)`;
    } catch (error) {
      return 'Desconocido';
    }
  };

  const handleLogClick = useCallback((log: LogEntry) => {
    try {
      if (!log || !log.id) {
        return;
      }
      setSelectedLog(log);
    } catch (error) {
      // Silently fail
    }
  }, []);

  const getLevelIcon = (level: LogLevelType | string) => {
    const lowerLevel = String(level || 'info').toLowerCase();
    switch (lowerLevel) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔧';
      default: return '📄';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      device: '🖥️',
      authentication: '🔐',
      alert: '🚨',
      configuration: '⚙️',
      request: '🌐',
      user: '👤',
      discovery: '🔍'
    };
    return icons[category] || '📄';
  };

  // Función para exportar logs
  const handleExport = async () => {
    try {
      const dateRange = getDateRange(selectedTimeRange);
      const filters: LogFilter = {
        search: searchQuery,
        level: selectedLevel === 'all' ? undefined : selectedLevel,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        username: selectedUsername || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
        sortBy,
        sortOrder
      };

      const blob = await LogsService.exportLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Silently fail
    }
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setSelectedLevel('all');
    setSelectedCategory('all');
    setSelectedSource('all');
    setSelectedUsername('');
    setSelectedTimeRange('24h');
    setSearchQuery('');
    setSortBy('timestamp');
    setSortOrder('desc');
    setCurrentPage(0);
  };

  // Loading y error states
  if (logsState.isLoading && logsState.logs.length === 0) {
    return <LoadingSpinner message="Cargando registros..." />;
  }

  if (logsState.error && !logsState.logs.length) {
    return <ErrorMessage message={logsState.error} />;
  }

  return (
    <Container>
      <Header>
        <Title>
          📋 Registros del Sistema
        </Title>
        <HeaderActions>
          <ExportButton onClick={handleExport}>
            📥 Exportar CSV
          </ExportButton>
          <ClearButton onClick={handleClearFilters}>
            🔄 Limpiar filtros
          </ClearButton>
        </HeaderActions>
      </Header>

      {/* Stats Cards */}
      <StatsSection>
        <StatCard>
          <StatLabel>Total</StatLabel>
          <StatValue style={{ color: colors.text.primary }}>
            {stats.total.toLocaleString()}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Errores</StatLabel>
          <StatValue style={{ color: colors.semantic.danger }}>
            {stats.byLevel.error}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Advertencias</StatLabel>
          <StatValue style={{ color: colors.semantic.warning }}>
            {stats.byLevel.warning}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Info</StatLabel>
          <StatValue style={{ color: colors.semantic.info }}>
            {stats.byLevel.info}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Debug</StatLabel>
          <StatValue style={{ color: colors.neutral.darkGray }}>
            {stats.byLevel.debug}
          </StatValue>
        </StatCard>
      </StatsSection>

      {/* Filters */}
      <FiltersSection>
        <FilterRow>
          <FilterGroup>
            <FilterLabel>Nivel :</FilterLabel>
            <FilterSelect value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              <option value="all">Todos los niveles</option>
              <option value="error">Errores</option>
              <option value="warning">Advertencias</option>
              <option value="info">Información</option>
              <option value="debug">Debug</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Categoría :</FilterLabel>
            <FilterSelect value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Fuente :</FilterLabel>
            <FilterSelect value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
              <option value="all">Todas las fuentes</option>
              {sources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Período :</FilterLabel>
            <FilterSelect value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)}>
              <option value="1h">Última hora</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="all">Todo el período</option>
            </FilterSelect>
          </FilterGroup>
        </FilterRow>

        <FilterRow>
          <SearchGroup>
            <SearchInput
              type="text"
              placeholder="Buscar en registros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon>🔍</SearchIcon>
          </SearchGroup>

          <FilterGroup>
            <FilterLabel>Usuario :</FilterLabel>
            <FilterInput
              type="text"
              placeholder="Nombre de usuario"
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Ordenar por :</FilterLabel>
            <FilterSelect value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="timestamp">Hora</option>
              <option value="level">Nivel</option>
              <option value="category">Categoría</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Orden :</FilterLabel>
            <FilterSelect value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </FilterSelect>
          </FilterGroup>
        </FilterRow>
      </FiltersSection>

      {/* Logs Results */}
      {logsState.logs.length > 0 ? (
        <>
          <ResultsInfo>
            Mostrando {logsState.logs.length} de {logsState.total} registros
            {logsState.isLoading && <Spinner>⏳</Spinner>}
          </ResultsInfo>

          <LogsList>
            {logsState.logs.map((log: any) => {
              // Proteger contra valores undefined
              const logLevel = log.level || 'info';
              const logCategory = log.category || 'unknown';
              const logMessage = log.message || 'Sin mensaje';
              const logTimestamp = log.timestamp || new Date().toISOString();
              const logDetails = log.details || null;
              const logSource = log.source || 'system';
              const logDeviceName = log.deviceName || null;
              const logUsername = log.username || null;
              
              return (
                <LogEntryItem key={log.id || Math.random()} onClick={() => handleLogClick(log)}>
                  <LogMain>
                    <LogHeader>
                      <LogLevelStyled level={logLevel as LogLevelType}>
                        {getLevelIcon(logLevel as LogLevelType)}
                      </LogLevelStyled>
                      <LogCategory>
                        {getCategoryIcon(logCategory)} {logCategory}
                      </LogCategory>
                      <LogMessage>{logMessage}</LogMessage>
                      <LogTime>{getRelativeTime(logTimestamp)}</LogTime>
                    </LogHeader>
                    {logDetails && (
                      <LogDetails>
                        {String(logDetails).substring(0, 100)}
                        {String(logDetails).length > 100 ? '...' : ''}
                      </LogDetails>
                    )}
                    <LogMeta>
                      {logSource && <LogSource>📍 Fuente: {logSource}</LogSource>}
                      <LogTimestamp>{formatTimestamp(logTimestamp)}</LogTimestamp>
                      {logDeviceName && <LogDevice>🖥️ {logDeviceName}</LogDevice>}
                      {logUsername && <LogUser>👤 {logUsername}</LogUser>}
                    </LogMeta>
                  </LogMain>
                </LogEntryItem>
              );
            })}
          </LogsList>

          {/* Pagination */}
          <PaginationContainer>
            <PaginationInfo>
              Página {currentPage + 1} de {Math.ceil(logsState.total / pageSize)}
            </PaginationInfo>
            <PaginationControls>
              <PaginationButton 
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
              >
                ⬅️ Primera
              </PaginationButton>
              <PaginationButton 
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                &lt; Anterior
              </PaginationButton>
              <PaginationButton 
                onClick={() => setCurrentPage(Math.min(Math.ceil(logsState.total / pageSize) - 1, currentPage + 1))}
                disabled={currentPage >= Math.ceil(logsState.total / pageSize) - 1}
              >
                Siguiente &gt;
              </PaginationButton>
              <PaginationButton 
                onClick={() => setCurrentPage(Math.ceil(logsState.total / pageSize) - 1)}
                disabled={currentPage >= Math.ceil(logsState.total / pageSize) - 1}
              >
                Última ➡️
              </PaginationButton>
            </PaginationControls>
          </PaginationContainer>
        </>
      ) : (
        <EmptyState>
          <EmptyIcon>📋</EmptyIcon>
          <EmptyTitle>Sin registros</EmptyTitle>
          <EmptyMessage>
            No hay registros que coincidan con los filtros seleccionados.
            Intenta ajustar los criterios de búsqueda.
          </EmptyMessage>
        </EmptyState>
      )}

      {/* Modal para detalles */}
      {selectedLog && (
        <ModalOverlay onClick={() => setSelectedLog(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {getLevelIcon((selectedLog.level || 'info') as LogLevelType)} Detalles del Registro
              </ModalTitle>
              <CloseButton onClick={() => setSelectedLog(null)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>
              <DetailRow>
                <DetailLabel>Nivel</DetailLabel>
                <DetailBadge level={(selectedLog.level || 'info') as LogLevelType}>
                  {(selectedLog.level || 'INFO').toUpperCase()}
                </DetailBadge>
              </DetailRow>

              <DetailRow>
                <DetailLabel>Categoría</DetailLabel>
                <DetailValue>{selectedLog.category || 'Sin categoría'}</DetailValue>
              </DetailRow>

              <DetailRow>
                <DetailLabel>Mensaje</DetailLabel>
                <DetailValue>{selectedLog.message || 'Sin mensaje'}</DetailValue>
              </DetailRow>

              {selectedLog.details && (
                <DetailRow>
                  <DetailLabel>Detalles</DetailLabel>
                  <DetailValue style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {typeof selectedLog.details === 'string' ? selectedLog.details : JSON.stringify(selectedLog.details, null, 2)}
                  </DetailValue>
                </DetailRow>
              )}

              {selectedLog.timestamp && (
                <DetailRow>
                  <DetailLabel>Marca de Tiempo</DetailLabel>
                  <DetailValue>{formatTimestamp(selectedLog.timestamp)}</DetailValue>
                </DetailRow>
              )}

              {selectedLog.source && (
                <DetailRow>
                  <DetailLabel>Fuente</DetailLabel>
                  <DetailValue>{selectedLog.source}</DetailValue>
                </DetailRow>
              )}

              {selectedLog.deviceName && (
                <DetailRow>
                  <DetailLabel>Dispositivo</DetailLabel>
                  <DetailValue>{selectedLog.deviceName}</DetailValue>
                </DetailRow>
              )}

              {selectedLog.username && (
                <DetailRow>
                  <DetailLabel>Usuario</DetailLabel>
                  <DetailValue>{selectedLog.username}</DetailValue>
                </DetailRow>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

// ============================================================================
// ESTILOS
// ============================================================================

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${colors.text.primary};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ExportButton = styled(ActionButton)`
  background: ${colors.primary.blue};
  color: white;

  &:hover {
    background: ${colors.primary.blueDark};
  }
`;

const ClearButton = styled(ActionButton)`
  background: ${colors.neutral.lightGray};
  color: ${colors.text.primary};

  &:hover {
    background: ${colors.neutral.mediumGray};
    color: white;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${colors.border.light};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${colors.primary.blue};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text.secondary};
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${colors.border.light};
  margin-bottom: 24px;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: flex-end;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterGroup = styled.div`
  flex: 1;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${colors.border.light};
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: ${colors.text.primary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${colors.primary.blue};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary.blue};
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  }
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${colors.border.light};
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${colors.primary.blue};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary.blue};
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  }
`;

const SearchGroup = styled.div`
  flex: 1;
  min-width: 200px;
  position: relative;
  display: flex;
  align-items: flex-end;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid ${colors.border.light};
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${colors.primary.blue};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary.blue};
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  }

  &::placeholder {
    color: ${colors.text.secondary};
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  font-size: 16px;
  color: ${colors.text.secondary};
  pointer-events: none;
`;

const ResultsInfo = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Spinner = styled.span`
  display: inline-block;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LogsList = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${colors.border.light};
  max-height: 600px;
  overflow-y: auto;
  margin-bottom: 24px;
`;

const LogEntryItem = styled.div`
  background: white;
  border-bottom: 1px solid ${colors.border.light};
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${colors.background.secondary};
    transform: translateX(4px);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const LogMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LogHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const LogLevelStyled = styled.div<{ level: LogLevelType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 16px;
  flex-shrink: 0;
  background: ${props => {
    switch (props.level) {
      case 'error': return colors.semantic.danger;
      case 'warning': return colors.semantic.warning;
      case 'info': return colors.semantic.info;
      case 'debug': return colors.neutral.lightGray;
      default: return colors.primary.blue;
    }
  }};
`;

const LogCategory = styled.div`
  font-size: 12px;
  padding: 4px 8px;
  background: ${colors.background.secondary};
  border-radius: 6px;
  border: 1px solid ${colors.border.light};
  white-space: nowrap;
`;

const LogMessage = styled.div`
  font-weight: 600;
  color: ${colors.text.primary};
  flex: 1;
  font-size: 14px;
  min-width: 200px;
`;

const LogTime = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  white-space: nowrap;
`;

const LogDetails = styled.div`
  color: ${colors.text.secondary};
  font-size: 13px;
  line-height: 1.4;
  padding-left: 44px;
`;

const LogMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: ${colors.text.secondary};
  padding-left: 44px;
  flex-wrap: wrap;
`;

const LogSource = styled.span``;
const LogTimestamp = styled.span``;
const LogDevice = styled.span``;
const LogUser = styled.span``;

// Empty State Styles
const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: ${colors.text.secondary};
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0 0 12px 0;
`;

const EmptyMessage = styled.p`
  font-size: 16px;
  line-height: 1.5;
  max-width: 500px;
  margin: 0 auto;
  color: ${colors.text.secondary};
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
  background: ${colors.background.secondary};
  padding: 20px 24px;
  border-bottom: 1px solid ${colors.border.light};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: ${colors.text.secondary};
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: ${colors.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
`;

const DetailRow = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-weight: 600;
  color: ${colors.text.secondary};
  margin-bottom: 6px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.div`
  color: ${colors.text.primary};
  line-height: 1.5;
  background: ${colors.background.secondary};
  padding: 8px 12px;
  border-radius: 6px;
  word-break: break-word;
`;

const DetailBadge = styled.div<{ level: LogLevelType }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid ${colors.border.light};
  flex-wrap: wrap;
  gap: 16px;
`;

const PaginationInfo = styled.div`
  font-size: 14px;
  color: ${colors.text.secondary};
  font-weight: 500;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${colors.border.light};
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text.primary};
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${colors.background.secondary};
    border-color: ${colors.primary.blue};
    color: ${colors.primary.blue};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default Logs;
