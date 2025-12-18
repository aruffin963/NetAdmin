import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

interface MetricData {
  id: number;
  hostname: string;
  dns_name?: string;
  cpu_usage: number | null;
  memory_usage: number | null;
  memory_total: number | null;
  disk_usage: number | null;
  disk_total: number | null;
  uptime: number | null;
  status: 'online' | 'offline';
  response_time: number;
  source: 'snmp' | 'ssh' | 'wmi' | 'ping' | 'local';
  collected_at: string;
}

const MetricsSearchPanel: React.FC = () => {
  const [searchIP, setSearchIP] = useState('');
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchIP.trim()) {
      setError('Veuillez entrer une adresse IP');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMetrics([]);

      const response = await fetch(
        `http://localhost:5000/api/agentless/metrics/by-ip/${encodeURIComponent(searchIP)}?limit=50&hours=24`
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Équipement non trouvé');
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setMetrics(result.data);
        if (result.data.length === 0) {
          setError('Aucune métrique disponible pour cette IP');
        }
      } else {
        setError(result.message || 'Erreur lors de la récupération des métriques');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
      console.error('Erreur fetch métriques:', err);
    } finally {
      setLoading(false);
    }
  }, [searchIP]);

  return (
    <Container>
      <SearchForm onSubmit={handleSearch}>
        <SearchInput
          type="text"
          placeholder="Entrez une adresse IP (ex: 192.168.1.100)"
          value={searchIP}
          onChange={(e) => setSearchIP(e.target.value)}
        />
        <SearchButton type="submit" disabled={loading || !searchIP.trim()}>
          {loading ? 'Recherche...' : 'Rechercher'}
        </SearchButton>
      </SearchForm>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {metrics.length > 0 && (
        <MetricsContainer>
          <MetricsTitle>Métriques pour {searchIP}</MetricsTitle>
          <MetricsList>
            {metrics.map((metric, idx) => (
              <MetricCard key={idx}>
                <MetricTime>{new Date(metric.collected_at).toLocaleString('fr-FR')}</MetricTime>
                <MetricsGrid>
                  {metric.cpu_usage !== null && (
                    <MetricItem>
                      <MetricLabel>CPU</MetricLabel>
                      <MetricValue>{metric.cpu_usage.toFixed(1)}%</MetricValue>
                    </MetricItem>
                  )}
                  {metric.memory_usage !== null && metric.memory_total !== null && (
                    <MetricItem>
                      <MetricLabel>Mémoire</MetricLabel>
                      <MetricValue>
                        {((metric.memory_usage / metric.memory_total) * 100).toFixed(1)}%
                      </MetricValue>
                      <MetricSmall>
                        {(metric.memory_usage / 1024 / 1024 / 1024).toFixed(1)}GB / {(metric.memory_total / 1024 / 1024 / 1024).toFixed(1)}GB
                      </MetricSmall>
                    </MetricItem>
                  )}
                  {metric.disk_usage !== null && metric.disk_total !== null && (
                    <MetricItem>
                      <MetricLabel>Disque</MetricLabel>
                      <MetricValue>
                        {((metric.disk_usage / metric.disk_total) * 100).toFixed(1)}%
                      </MetricValue>
                    </MetricItem>
                  )}
                  {metric.status && (
                    <MetricItem>
                      <MetricLabel>Statut</MetricLabel>
                      <StatusBadge status={metric.status}>
                        {metric.status === 'online' ? '🟢 En ligne' : '🔴 Hors ligne'}
                      </StatusBadge>
                    </MetricItem>
                  )}
                </MetricsGrid>
              </MetricCard>
            ))}
          </MetricsList>
        </MetricsContainer>
      )}
    </Container>
  );
};

// ============= STYLES =============

const Container = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  border-radius: 16px;
  border: 1px solid #e0e8ff;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(0, 102, 255, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  background: white;
  color: #1f2937;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #0066ff;
    box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
  }

  &:hover {
    border-color: #0066ff;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #0066ff 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #c33;
  font-size: 14px;
  margin-bottom: 16px;
`;

const MetricsContainer = styled.div`
  margin-top: 24px;
`;

const MetricsTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
`;

const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 102, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 102, 255, 0.3);
    border-radius: 10px;

    &:hover {
      background: rgba(0, 102, 255, 0.5);
    }
  }
`;

const MetricCard = styled.div`
  padding: 16px;
  background: rgba(0, 102, 255, 0.03);
  border: 1px solid rgba(0, 102, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 102, 255, 0.06);
    border-color: rgba(0, 102, 255, 0.2);
  }
`;

const MetricTime = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`;

const MetricItem = styled.div`
  padding: 10px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e0e8ff;
`;

const MetricLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  font-weight: 700;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const MetricValue = styled.div`
  font-size: 16px;
  font-weight: 900;
  color: #0066ff;
`;

const MetricSmall = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => props.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.status === 'online' ? '#10b981' : '#ef4444'};
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
`;

export default MetricsSearchPanel;
