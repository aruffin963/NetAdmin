import React, { useState } from 'react';
import styled from 'styled-components';

interface NetworkScanResult {
  ip: string;
  status: 'online' | 'offline' | 'unknown';
  responseTime?: number;
}

interface SubnetConflict {
  subnet1: string;
  subnet2: string;
  overlap: string;
  severity: 'high' | 'medium' | 'low';
}

const AdvancedNetworkTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'scanner' | 'validator' | 'calculator' | 'converter'>('scanner');
  
  // Scanner de réseau
  const [scanNetwork, setScanNetwork] = useState('192.168.1.0/24');
  const [scanResults, setScanResults] = useState<NetworkScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Validateur de configuration
  const [configText, setConfigText] = useState(`192.168.1.0/24
192.168.2.0/24
10.0.0.0/8
172.16.0.0/12`);
  const [conflicts, setConflicts] = useState<SubnetConflict[]>([]);

  // Calculateur d'efficacité
  const [totalIPs, setTotalIPs] = useState('65536');
  const [usedIPs, setUsedIPs] = useState('32768');
  const [efficiency, setEfficiency] = useState(0);

  // Convertisseur de masques
  const [maskInput, setMaskInput] = useState('255.255.255.0');
  const [maskOutput, setMaskOutput] = useState('');

  // Scanner un réseau avec de vrais pings
  const handleNetworkScan = async () => {
    setIsScanning(true);
    setScanResults([]);

    try {
      const response = await fetch('http://localhost:5000/api/network/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ network: scanNetwork })
      });

      const result = await response.json();

      if (result.success) {
        setScanResults(result.data.hosts);
      } else {
        alert('Erreur lors du scan: ' + result.message);
      }
    } catch (error) {
      console.error('Erreur de scan réseau:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsScanning(false);
    }
  };

  // Valider la configuration réseau
  const validateConfiguration = () => {
    const subnets = configText.split('\n').filter(line => line.trim());
    const detectedConflicts: SubnetConflict[] = [];

    for (let i = 0; i < subnets.length; i++) {
      for (let j = i + 1; j < subnets.length; j++) {
        const subnet1 = subnets[i].trim();
        const subnet2 = subnets[j].trim();
        
        // Simulation de détection de conflits
        if (checkSubnetOverlap(subnet1, subnet2)) {
          detectedConflicts.push({
            subnet1,
            subnet2,
            overlap: 'Adressage qui se chevauche',
            severity: 'high'
          });
        }
      }
    }

    setConflicts(detectedConflicts);
  };

  // Vérifier le chevauchement de sous-réseaux (simplifiée)
  const checkSubnetOverlap = (subnet1: string, subnet2: string): boolean => {
    // Simulation simplifiée - en réalité il faudrait calculer les plages
    const base1 = subnet1.split('/')[0].split('.').slice(0, 2).join('.');
    const base2 = subnet2.split('/')[0].split('.').slice(0, 2).join('.');
    return base1 === base2 && subnet1 !== subnet2;
  };

  // Calculer l'efficacité du réseau
  const calculateEfficiency = () => {
    const total = parseInt(totalIPs);
    const used = parseInt(usedIPs);
    if (total > 0) {
      setEfficiency(Math.round((used / total) * 100));
    }
  };

  // Convertir les masques
  const convertMask = () => {
    if (maskInput.includes('.')) {
      // Convertir masque décimal vers CIDR
      const parts = maskInput.split('.').map(Number);
      let cidr = 0;
      parts.forEach(part => {
        cidr += part.toString(2).split('1').length - 1;
      });
      setMaskOutput(`/${cidr}`);
    } else if (maskInput.startsWith('/')) {
      // Convertir CIDR vers masque décimal
      const cidr = parseInt(maskInput.slice(1));
      const mask = (0xffffffff << (32 - cidr)) >>> 0;
      const maskStr = [
        (mask >>> 24) & 255,
        (mask >>> 16) & 255,
        (mask >>> 8) & 255,
        mask & 255
      ].join('.');
      setMaskOutput(maskStr);
    }
  };

  // Export des résultats
  const exportResults = () => {
    let csvContent = '';
    
    switch (activeTool) {
      case 'scanner':
        csvContent = [
          ['Adresse IP', 'Statut', 'Temps de Réponse (ms)'].join(';'),
          ...scanResults.map(result => [
            result.ip,
            result.status === 'online' ? 'En ligne' : 'Hors ligne',
            result.responseTime?.toString() || 'N/A'
          ].join(';'))
        ].join('\n');
        break;
      
      case 'validator':
        csvContent = [
          ['Sous-réseau 1', 'Sous-réseau 2', 'Type de Conflit', 'Sévérité'].join(';'),
          ...conflicts.map(conflict => [
            conflict.subnet1,
            conflict.subnet2,
            conflict.overlap,
            conflict.severity === 'high' ? 'Élevée' : conflict.severity === 'medium' ? 'Moyenne' : 'Faible'
          ].join(';'))
        ].join('\n');
        break;
        
      default:
        csvContent = 'Type;Valeur\nOutil;' + activeTool + '\nDate;' + new Date().toLocaleString('fr-FR');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `outils_avances_${activeTool}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Container>
      {/* Sélecteur d'outils */}
      <ToolSelector>
        <SelectorTitle>Outils Avancés de Planification Réseau</SelectorTitle>
        <ToolTabs>
          <ToolTab 
            active={activeTool === 'scanner'}
            onClick={() => setActiveTool('scanner')}
          >
            🔍 Scanner Réseau
          </ToolTab>
          <ToolTab 
            active={activeTool === 'validator'}
            onClick={() => setActiveTool('validator')}
          >
            ✅ Validateur Config
          </ToolTab>
          <ToolTab 
            active={activeTool === 'calculator'}
            onClick={() => setActiveTool('calculator')}
          >
            📊 Calculateur Efficacité
          </ToolTab>
          <ToolTab 
            active={activeTool === 'converter'}
            onClick={() => setActiveTool('converter')}
          >
            🔄 Convertisseur Masques
          </ToolTab>
        </ToolTabs>
      </ToolSelector>

      {/* Scanner Réseau */}
      {activeTool === 'scanner' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>🔍 Scanner de Réseau</ToolTitle>
            <ToolDescription>
              Simulez un scan réseau pour découvrir les hôtes actifs sur un sous-réseau donné.
              Utile pour la planification et la vérification de l'utilisation du réseau.
            </ToolDescription>
          </ToolHeader>

          <ConfigSection>
            <InputGroup>
              <Label>Réseau à Scanner</Label>
              <Input
                type="text"
                value={scanNetwork}
                onChange={(e) => setScanNetwork(e.target.value)}
                placeholder="192.168.1.0/24"
              />
            </InputGroup>
            <ActionButton onClick={handleNetworkScan} disabled={isScanning}>
              {isScanning ? '🔄 Scan en cours...' : '🔍 Démarrer le Scan'}
            </ActionButton>
          </ConfigSection>

          {scanResults.length > 0 && (
            <ResultsSection>
              <ResultsHeader>
                <ResultsTitle>Résultats du Scan</ResultsTitle>
                <ExportButton onClick={exportResults}>
                  📊 Exporter Résultats
                </ExportButton>
              </ResultsHeader>
              <ScanTable>
                <TableHeader>
                  <HeaderCell>Adresse IP</HeaderCell>
                  <HeaderCell>Statut</HeaderCell>
                  <HeaderCell>Temps de Réponse</HeaderCell>
                </TableHeader>
                <TableBody>
                  {scanResults.map((result, index) => (
                    <TableRow key={index}>
                      <IPCell>{result.ip}</IPCell>
                      <StatusCell status={result.status}>
                        {result.status === 'online' ? '🟢 En ligne' : '🔴 Hors ligne'}
                      </StatusCell>
                      <Cell>{result.responseTime ? `${result.responseTime}ms` : 'N/A'}</Cell>
                    </TableRow>
                  ))}
                </TableBody>
              </ScanTable>
            </ResultsSection>
          )}
        </ToolSection>
      )}

      {/* Validateur de Configuration */}
      {activeTool === 'validator' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>✅ Validateur de Configuration Réseau</ToolTitle>
            <ToolDescription>
              Analysez votre plan réseau pour détecter les conflits potentiels,
              chevauchements de sous-réseaux et problèmes de configuration.
            </ToolDescription>
          </ToolHeader>

          <ConfigSection>
            <InputGroup>
              <Label>Configuration Réseau (un sous-réseau par ligne)</Label>
              <TextArea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                placeholder="192.168.1.0/24&#10;192.168.2.0/24&#10;10.0.0.0/8"
                rows={6}
              />
            </InputGroup>
            <ActionButton onClick={validateConfiguration}>
              ✅ Valider Configuration
            </ActionButton>
          </ConfigSection>

          <ValidationResults>
            {conflicts.length === 0 ? (
              <SuccessMessage>
                ✅ Aucun conflit détecté dans la configuration
              </SuccessMessage>
            ) : (
              <ConflictsList>
                <ConflictsTitle>⚠️ Conflits Détectés</ConflictsTitle>
                {conflicts.map((conflict, index) => (
                  <ConflictItem key={index} severity={conflict.severity}>
                    <ConflictHeader>
                      <ConflictSeverity severity={conflict.severity}>
                        {conflict.severity === 'high' ? '🔴 Élevé' : 
                         conflict.severity === 'medium' ? '🟡 Moyen' : '🟢 Faible'}
                      </ConflictSeverity>
                    </ConflictHeader>
                    <ConflictDetails>
                      <strong>{conflict.subnet1}</strong> et <strong>{conflict.subnet2}</strong>
                      <br />
                      {conflict.overlap}
                    </ConflictDetails>
                  </ConflictItem>
                ))}
              </ConflictsList>
            )}
          </ValidationResults>
        </ToolSection>
      )}

      {/* Calculateur d'Efficacité */}
      {activeTool === 'calculator' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>📊 Calculateur d'Efficacité Réseau</ToolTitle>
            <ToolDescription>
              Calculez l'efficacité de votre utilisation d'adresses IP
              pour optimiser vos plans de sous-réseaux.
            </ToolDescription>
          </ToolHeader>

          <ConfigSection>
            <CalculatorGrid>
              <InputGroup>
                <Label>Total d'Adresses IP Disponibles</Label>
                <Input
                  type="number"
                  value={totalIPs}
                  onChange={(e) => setTotalIPs(e.target.value)}
                />
              </InputGroup>
              <InputGroup>
                <Label>Adresses IP Utilisées</Label>
                <Input
                  type="number"
                  value={usedIPs}
                  onChange={(e) => setUsedIPs(e.target.value)}
                />
              </InputGroup>
            </CalculatorGrid>
            <ActionButton onClick={calculateEfficiency}>
              📊 Calculer Efficacité
            </ActionButton>
          </ConfigSection>

          {efficiency > 0 && (
            <EfficiencyResult>
              <EfficiencyCard>
                <EfficiencyValue efficiency={efficiency}>{efficiency}%</EfficiencyValue>
                <EfficiencyLabel>Efficacité d'Utilisation</EfficiencyLabel>
                <EfficiencyAdvice efficiency={efficiency}>
                  {efficiency >= 80 ? '✅ Excellente utilisation' :
                   efficiency >= 60 ? '⚠️ Utilisation correcte' :
                   '🔴 Utilisation sous-optimale'}
                </EfficiencyAdvice>
              </EfficiencyCard>
            </EfficiencyResult>
          )}
        </ToolSection>
      )}

      {/* Convertisseur de Masques */}
      {activeTool === 'converter' && (
        <ToolSection>
          <ToolHeader>
            <ToolTitle>🔄 Convertisseur de Masques de Sous-réseau</ToolTitle>
            <ToolDescription>
              Convertissez facilement entre la notation CIDR et la notation décimale
              des masques de sous-réseau.
            </ToolDescription>
          </ToolHeader>

          <ConfigSection>
            <ConverterGrid>
              <InputGroup>
                <Label>Masque d'Entrée</Label>
                <Input
                  type="text"
                  value={maskInput}
                  onChange={(e) => setMaskInput(e.target.value)}
                  placeholder="255.255.255.0 ou /24"
                />
              </InputGroup>
              <ConvertButton onClick={convertMask}>
                🔄 Convertir
              </ConvertButton>
              <InputGroup>
                <Label>Masque Converti</Label>
                <Output value={maskOutput} readOnly />
              </InputGroup>
            </ConverterGrid>
          </ConfigSection>

          <ConversionTable>
            <TableTitle>Table de Référence Rapide</TableTitle>
            <QuickRefTable>
              <TableHeader>
                <HeaderCell>CIDR</HeaderCell>
                <HeaderCell>Masque Décimal</HeaderCell>
                <HeaderCell>Hôtes Disponibles</HeaderCell>
              </TableHeader>
              <TableBody>
                {[
                  { cidr: '/24', mask: '255.255.255.0', hosts: '254' },
                  { cidr: '/25', mask: '255.255.255.128', hosts: '126' },
                  { cidr: '/26', mask: '255.255.255.192', hosts: '62' },
                  { cidr: '/27', mask: '255.255.255.224', hosts: '30' },
                  { cidr: '/28', mask: '255.255.255.240', hosts: '14' },
                  { cidr: '/29', mask: '255.255.255.248', hosts: '6' },
                  { cidr: '/30', mask: '255.255.255.252', hosts: '2' }
                ].map((row, index) => (
                  <TableRow key={index}>
                    <CidrCell>{row.cidr}</CidrCell>
                    <MaskCell>{row.mask}</MaskCell>
                    <Cell>{row.hosts}</Cell>
                  </TableRow>
                ))}
              </TableBody>
            </QuickRefTable>
          </ConversionTable>
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

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
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

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  
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

const ScanTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background: #f8fafc;
`;

const HeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f9fafb;
  }
`;

const Cell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #1e293b;
`;

const IPCell = styled(Cell)`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
`;

const StatusCell = styled(Cell)<{ status: string }>`
  color: ${props => props.status === 'online' ? '#059669' : '#dc2626'};
  font-weight: 600;
`;

const ValidationResults = styled.div``;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 16px;
  border-radius: 8px;
  font-weight: 500;
`;

const ConflictsList = styled.div``;

const ConflictsTitle = styled.h4`
  color: #dc2626;
  margin-bottom: 16px;
`;

const ConflictItem = styled.div<{ severity: string }>`
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

const ConflictHeader = styled.div`
  margin-bottom: 8px;
`;

const ConflictSeverity = styled.span<{ severity: string }>`
  font-weight: 600;
  color: ${props => {
    switch (props.severity) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      default: return '#059669';
    }
  }};
`;

const ConflictDetails = styled.div`
  font-size: 14px;
  color: #374151;
`;

const CalculatorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`;

const EfficiencyResult = styled.div`
  display: flex;
  justify-content: center;
`;

const EfficiencyCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  max-width: 300px;
`;

const EfficiencyValue = styled.div<{ efficiency: number }>`
  font-size: 48px;
  font-weight: 800;
  color: ${props => {
    if (props.efficiency >= 80) return '#059669';
    if (props.efficiency >= 60) return '#d97706';
    return '#dc2626';
  }};
  margin-bottom: 8px;
`;

const EfficiencyLabel = styled.div`
  font-size: 14px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
`;

const EfficiencyAdvice = styled.div<{ efficiency: number }>`
  font-weight: 600;
  color: ${props => {
    if (props.efficiency >= 80) return '#059669';
    if (props.efficiency >= 60) return '#d97706';
    return '#dc2626';
  }};
`;

const ConverterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: end;
`;

const ConvertButton = styled.button`
  padding: 10px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  height: fit-content;
`;

const Output = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #f9fafb;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ConversionTable = styled.div``;

const TableTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
`;

const QuickRefTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`;

const CidrCell = styled(Cell)`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #059669;
  font-weight: 600;
`;

const MaskCell = styled(Cell)`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #dc2626;
  font-weight: 600;
`;

export { AdvancedNetworkTools };