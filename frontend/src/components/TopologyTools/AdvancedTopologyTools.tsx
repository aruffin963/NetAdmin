import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface NetworkPathResult {
  source: string;
  destination: string;
  path: string[];
  hops: number;
  latency: number;
  status: 'success' | 'failed' | 'partial';
}

interface SecurityAnalysis {
  vulnerabilities: Array<{
    device: string;
    severity: 'high' | 'medium' | 'low';
    type: string;
    description: string;
  }>;
  recommendations: string[];
  securityScore: number;
}

interface PerformanceMetric {
  device: string;
  cpuUsage: number;
  memoryUsage: number;
  bandwidth: number;
  status: 'normal' | 'warning' | 'critical';
}

const AdvancedTopologyTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pathfinder' | 'security' | 'performance' | 'optimization'>('pathfinder');
  
  // Path Finder
  const [sourceIP, setSourceIP] = useState('192.168.1.10');
  const [destIP, setDestIP] = useState('192.168.2.20');
  const [pathResults, setPathResults] = useState<NetworkPathResult[]>([]);
  const [isTracing, setIsTracing] = useState(false);

  // Security Analysis
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Performance Monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Optimization
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);

  // Simuler une analyse de chemin réseau
  const traceNetworkPath = async () => {
    setIsTracing(true);
    setPathResults([]);

    // Simulation de trace route
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockPath: NetworkPathResult = {
      source: sourceIP,
      destination: destIP,
      path: [
        sourceIP,
        '192.168.1.1',    // Gateway
        '10.0.0.1',       // Router
        '172.16.0.1',     // External router
        destIP
      ],
      hops: 4,
      latency: 45.2,
      status: 'success'
    };

    setPathResults([mockPath]);
    setIsTracing(false);
  };

  // Simuler une analyse de sécurité
  const runSecurityAnalysis = async () => {
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockAnalysis: SecurityAnalysis = {
      vulnerabilities: [
        {
          device: '192.168.1.1',
          severity: 'high',
          type: 'Firmware obsolète',
          description: 'Le firmware du routeur principal n\'est pas à jour'
        },
        {
          device: '192.168.1.10',
          severity: 'medium',
          type: 'Port ouvert',
          description: 'Port SSH ouvert sans restriction d\'accès'
        },
        {
          device: '192.168.2.5',
          severity: 'low',
          type: 'Configuration SNMP',
          description: 'Communauté SNMP par défaut détectée'
        }
      ],
      recommendations: [
        'Mettre à jour le firmware de tous les équipements réseau',
        'Configurer des règles de pare-feu strictes',
        'Changer les mots de passe par défaut',
        'Activer l\'authentification à deux facteurs',
        'Segmenter le réseau en VLANs sécurisés'
      ],
      securityScore: 68
    };

    setSecurityAnalysis(mockAnalysis);
    setIsAnalyzing(false);
  };

  // Simuler le monitoring de performance
  const startPerformanceMonitoring = async () => {
    setIsMonitoring(true);
    
    const mockMetrics: PerformanceMetric[] = [
      {
        device: '192.168.1.1',
        cpuUsage: 78,
        memoryUsage: 65,
        bandwidth: 850,
        status: 'warning'
      },
      {
        device: '192.168.1.10',
        cpuUsage: 45,
        memoryUsage: 55,
        bandwidth: 320,
        status: 'normal'
      },
      {
        device: '192.168.2.1',
        cpuUsage: 92,
        memoryUsage: 88,
        bandwidth: 950,
        status: 'critical'
      }
    ];

    setPerformanceMetrics(mockMetrics);
    setIsMonitoring(false);
  };

  // Générer des suggestions d'optimisation
  useEffect(() => {
    const suggestions = [
      '🔧 Configurer la QoS pour prioriser le trafic critique',
      '⚡ Optimiser le placement des serveurs selon l\'utilisation',
      '📊 Implémenter un load balancing pour distribuer la charge',
      '🛡️ Segmenter le réseau en zones de sécurité',
      '🔄 Configurer la redondance sur les liens critiques',
      '📈 Mettre en place un monitoring proactif des performances'
    ];
    setOptimizationSuggestions(suggestions);
  }, []);

  // Export des résultats
  const exportResults = () => {
    let csvContent = '';
    
    switch (activeTab) {
      case 'pathfinder':
        csvContent = [
          ['Source', 'Destination', 'Chemin', 'Sauts', 'Latence (ms)', 'Statut'].join(';'),
          ...pathResults.map(result => [
            result.source,
            result.destination,
            result.path.join(' → '),
            result.hops.toString(),
            result.latency.toString(),
            result.status
          ].join(';'))
        ].join('\n');
        break;
      
      case 'security':
        if (securityAnalysis) {
          csvContent = [
            ['Appareil', 'Sévérité', 'Type', 'Description'].join(';'),
            ...securityAnalysis.vulnerabilities.map(vuln => [
              vuln.device,
              vuln.severity,
              vuln.type,
              vuln.description
            ].join(';'))
          ].join('\n');
        }
        break;
        
      case 'performance':
        csvContent = [
          ['Appareil', 'CPU (%)', 'Mémoire (%)', 'Bande Passante (Mbps)', 'Statut'].join(';'),
          ...performanceMetrics.map(metric => [
            metric.device,
            metric.cpuUsage.toString(),
            metric.memoryUsage.toString(),
            metric.bandwidth.toString(),
            metric.status
          ].join(';'))
        ].join('\n');
        break;
        
      default:
        csvContent = 'Type;Valeur\nOutil;' + activeTab + '\nDate;' + new Date().toLocaleString('fr-FR');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `topology_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Container>
      {/* Sélecteur d'outils */}
      <ToolSelector>
        <SelectorTitle>Outils Avancés de Topologie</SelectorTitle>
        <ToolTabs>
          <ToolTab 
            active={activeTab === 'pathfinder'}
            onClick={() => setActiveTab('pathfinder')}
          >
            🛣️ Path Finder
          </ToolTab>
          <ToolTab 
            active={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
          >
            🛡️ Analyse Sécurité
          </ToolTab>
          <ToolTab 
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
          >
            📊 Performance
          </ToolTab>
          <ToolTab 
            active={activeTab === 'optimization'}
            onClick={() => setActiveTab('optimization')}
          >
            ⚡ Optimisation
          </ToolTab>
        </ToolTabs>
      </ToolSelector>

      {/* Path Finder */}
      {activeTab === 'pathfinder' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>🛣️ Analyseur de Chemin Réseau</ToolTitle>
            <ToolDescription>
              Tracez et analysez les chemins réseau entre deux points pour identifier
              les goulots d'étranglement et optimiser les routes.
            </ToolDescription>
          </ToolHeader>

          <ConfigSection>
            <InputGrid>
              <InputGroup>
                <Label>Adresse Source</Label>
                <Input
                  type="text"
                  value={sourceIP}
                  onChange={(e) => setSourceIP(e.target.value)}
                  placeholder="192.168.1.10"
                />
              </InputGroup>
              <InputGroup>
                <Label>Adresse Destination</Label>
                <Input
                  type="text"
                  value={destIP}
                  onChange={(e) => setDestIP(e.target.value)}
                  placeholder="192.168.2.20"
                />
              </InputGroup>
            </InputGrid>
            <ActionButton onClick={traceNetworkPath} disabled={isTracing}>
              {isTracing ? '🔄 Analyse en cours...' : '🔍 Tracer le Chemin'}
            </ActionButton>
          </ConfigSection>

          {pathResults.length > 0 && (
            <ResultsSection>
              <ResultsHeader>
                <ResultsTitle>Résultats du Tracé</ResultsTitle>
                <ExportButton onClick={exportResults}>
                  📊 Exporter
                </ExportButton>
              </ResultsHeader>
              {pathResults.map((result, index) => (
                <PathResult key={index}>
                  <PathHeader>
                    <PathStatus status={result.status}>
                      {result.status === 'success' ? '✅ Succès' : '❌ Échec'}
                    </PathStatus>
                    <PathStats>
                      {result.hops} sauts • {result.latency}ms
                    </PathStats>
                  </PathHeader>
                  <PathTrace>
                    {result.path.map((hop, hopIndex) => (
                      <React.Fragment key={hopIndex}>
                        <HopNode>{hop}</HopNode>
                        {hopIndex < result.path.length - 1 && <HopArrow>→</HopArrow>}
                      </React.Fragment>
                    ))}
                  </PathTrace>
                </PathResult>
              ))}
            </ResultsSection>
          )}
        </ToolSection>
      )}

      {/* Security Analysis */}
      {activeTab === 'security' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>🛡️ Analyse de Sécurité Réseau</ToolTitle>
            <ToolDescription>
              Évaluez la sécurité de votre infrastructure réseau et identifiez
              les vulnérabilités potentielles avec des recommandations.
            </ToolDescription>
          </ToolHeader>

          <ConfigSection>
            <ActionButton onClick={runSecurityAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? '🔄 Analyse en cours...' : '🛡️ Lancer l\'Analyse'}
            </ActionButton>
          </ConfigSection>

          {securityAnalysis && (
            <ResultsSection>
              <SecurityScore score={securityAnalysis.securityScore}>
                <ScoreValue>{securityAnalysis.securityScore}/100</ScoreValue>
                <ScoreLabel>Score de Sécurité</ScoreLabel>
              </SecurityScore>

              <VulnerabilityList>
                <SectionTitle>⚠️ Vulnérabilités Détectées</SectionTitle>
                {securityAnalysis.vulnerabilities.map((vuln, index) => (
                  <VulnerabilityItem key={index} severity={vuln.severity}>
                    <VulnHeader>
                      <VulnSeverity severity={vuln.severity}>
                        {vuln.severity === 'high' ? '🔴 Élevée' : 
                         vuln.severity === 'medium' ? '🟡 Moyenne' : '🟢 Faible'}
                      </VulnSeverity>
                      <VulnDevice>{vuln.device}</VulnDevice>
                    </VulnHeader>
                    <VulnType>{vuln.type}</VulnType>
                    <VulnDescription>{vuln.description}</VulnDescription>
                  </VulnerabilityItem>
                ))}
              </VulnerabilityList>

              <RecommendationsList>
                <SectionTitle>💡 Recommandations</SectionTitle>
                {securityAnalysis.recommendations.map((rec, index) => (
                  <RecommendationItem key={index}>
                    {rec}
                  </RecommendationItem>
                ))}
              </RecommendationsList>
            </ResultsSection>
          )}
        </ToolSection>
      )}

      {/* Performance Monitoring */}
      {activeTab === 'performance' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>📊 Monitoring de Performance</ToolTitle>
            <ToolDescription>
              Surveillez les performances en temps réel de vos équipements réseau
              pour identifier les problèmes avant qu'ils n'impactent les utilisateurs.
            </ToolDescription>
          </ToolHeader>

          <ConfigSection>
            <ActionButton onClick={startPerformanceMonitoring} disabled={isMonitoring}>
              {isMonitoring ? '🔄 Collecte en cours...' : '📊 Démarrer le Monitoring'}
            </ActionButton>
          </ConfigSection>

          {performanceMetrics.length > 0 && (
            <ResultsSection>
              <ResultsHeader>
                <ResultsTitle>Métriques de Performance</ResultsTitle>
                <ExportButton onClick={exportResults}>
                  📊 Exporter
                </ExportButton>
              </ResultsHeader>
              <MetricsGrid>
                {performanceMetrics.map((metric, index) => (
                  <MetricCard key={index} status={metric.status}>
                    <MetricHeader>
                      <MetricDevice>{metric.device}</MetricDevice>
                      <MetricStatus status={metric.status}>
                        {metric.status === 'normal' ? '🟢' : 
                         metric.status === 'warning' ? '🟡' : '🔴'}
                      </MetricStatus>
                    </MetricHeader>
                    <MetricsList>
                      <MetricItem>
                        <MetricLabel>CPU</MetricLabel>
                        <MetricBar>
                          <MetricFill width={metric.cpuUsage} type="cpu" />
                        </MetricBar>
                        <MetricValue>{metric.cpuUsage}%</MetricValue>
                      </MetricItem>
                      <MetricItem>
                        <MetricLabel>Mémoire</MetricLabel>
                        <MetricBar>
                          <MetricFill width={metric.memoryUsage} type="memory" />
                        </MetricBar>
                        <MetricValue>{metric.memoryUsage}%</MetricValue>
                      </MetricItem>
                      <MetricItem>
                        <MetricLabel>Bande Passante</MetricLabel>
                        <MetricValue>{metric.bandwidth} Mbps</MetricValue>
                      </MetricItem>
                    </MetricsList>
                  </MetricCard>
                ))}
              </MetricsGrid>
            </ResultsSection>
          )}
        </ToolSection>
      )}

      {/* Optimization */}
      {activeTab === 'optimization' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>⚡ Suggestions d'Optimisation</ToolTitle>
            <ToolDescription>
              Recommandations personnalisées pour améliorer les performances,
              la sécurité et la fiabilité de votre infrastructure réseau.
            </ToolDescription>
          </ToolHeader>

          <OptimizationGrid>
            {optimizationSuggestions.map((suggestion, index) => (
              <OptimizationCard key={index}>
                <OptimizationIcon>
                  {suggestion.split(' ')[0]}
                </OptimizationIcon>
                <OptimizationText>
                  {suggestion.substring(suggestion.indexOf(' ') + 1)}
                </OptimizationText>
              </OptimizationCard>
            ))}
          </OptimizationGrid>
        </ToolSection>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const ToolSelector = styled.div`
  background: #f8fafc;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const SelectorTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
`;

const ToolTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ToolTab = styled.button<{ active: boolean }>`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? 
    'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)' : 
    'white'};
  color: ${props => props.active ? 'white' : '#64748b'};
  border: ${props => props.active ? 'none' : '1px solid #e2e8f0'};

  &:hover {
    background: ${props => props.active ? 
      'linear-gradient(135deg, #34d399 0%, #60a5fa 100%)' : 
      '#f1f5f9'};
  }
`;

const ToolSection = styled.div`
  padding: 24px;
`;

const ToolHeader = styled.div`
  margin-bottom: 24px;
`;

const ToolTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

const ToolDescription = styled.p`
  color: #64748b;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
`;

const ConfigSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const InputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #60a5fa 0%, #34d399 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultsSection = styled.div``;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ResultsTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ExportButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const PathResult = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const PathHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const PathStatus = styled.span<{ status: string }>`
  font-weight: 600;
  color: ${props => props.status === 'success' ? '#059669' : '#dc2626'};
`;

const PathStats = styled.span`
  color: #64748b;
  font-size: 14px;
`;

const PathTrace = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const HopNode = styled.span`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #1e293b;
`;

const HopArrow = styled.span`
  color: #64748b;
  font-weight: bold;
`;

const SecurityScore = styled.div<{ score: number }>`
  background: ${props => {
    if (props.score >= 80) return '#f0fdf4';
    if (props.score >= 60) return '#fffbeb';
    return '#fef2f2';
  }};
  border: 1px solid ${props => {
    if (props.score >= 80) return '#bbf7d0';
    if (props.score >= 60) return '#fed7aa';
    return '#fecaca';
  }};
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;
`;

const ScoreValue = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: ${props => {
    const score = parseInt(props.children as string);
    if (score >= 80) return '#059669';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  }};
  margin-bottom: 8px;
`;

const ScoreLabel = styled.div`
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const VulnerabilityList = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
`;

const VulnerabilityItem = styled.div<{ severity: string }>`
  background: ${props => {
    switch (props.severity) {
      case 'high': return '#fef2f2';
      case 'medium': return '#fffbeb';
      default: return '#f0fdf4';
    }
  }};
  border: 1px solid ${props => {
    switch (props.severity) {
      case 'high': return '#fecaca';
      case 'medium': return '#fed7aa';
      default: return '#bbf7d0';
    }
  }};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const VulnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const VulnSeverity = styled.span<{ severity: string }>`
  font-weight: 600;
  color: ${props => {
    switch (props.severity) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      default: return '#059669';
    }
  }};
`;

const VulnDevice = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #64748b;
`;

const VulnType = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
`;

const VulnDescription = styled.div`
  color: #64748b;
  font-size: 14px;
`;

const RecommendationsList = styled.div``;

const RecommendationItem = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  color: #166534;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`;

const MetricCard = styled.div<{ status: string }>`
  background: white;
  border: 2px solid ${props => {
    switch (props.status) {
      case 'critical': return '#dc2626';
      case 'warning': return '#d97706';
      default: return '#059669';
    }
  }};
  border-radius: 12px;
  padding: 16px;
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MetricDevice = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const MetricStatus = styled.div<{ status: string }>`
  font-size: 20px;
`;

const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MetricItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MetricLabel = styled.div`
  min-width: 60px;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
`;

const MetricBar = styled.div`
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
`;

const MetricFill = styled.div<{ width: number; type: string }>`
  height: 100%;
  width: ${props => props.width}%;
  background: ${props => {
    if (props.width > 80) return '#dc2626';
    if (props.width > 60) return '#d97706';
    return '#059669';
  }};
  transition: width 0.3s ease;
`;

const MetricValue = styled.div`
  font-weight: 600;
  color: #1e293b;
  min-width: 50px;
  text-align: right;
`;

const OptimizationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const OptimizationCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const OptimizationIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`;

const OptimizationText = styled.div`
  color: #1e293b;
  font-weight: 500;
  line-height: 1.4;
`;

export { AdvancedTopologyTools };