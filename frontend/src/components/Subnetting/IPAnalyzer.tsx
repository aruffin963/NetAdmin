import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface IPAnalysis {
  ip: string;
  isValid: boolean;
  class: 'A' | 'B' | 'C' | 'D' | 'E' | 'Invalid';
  type: 'Private' | 'Public' | 'Loopback' | 'Multicast' | 'Reserved' | 'Invalid';
  binary: string;
  hexadecimal: string;
  decimal: number;
  octets: {
    first: { decimal: number; binary: string; hex: string };
    second: { decimal: number; binary: string; hex: string };
    third: { decimal: number; binary: string; hex: string };
    fourth: { decimal: number; binary: string; hex: string };
  };
  networkInfo?: {
    defaultMask: string;
    defaultCIDR: number;
    networkBits: number;
    hostBits: number;
  };
}

const IPAnalyzer: React.FC = () => {
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [analysis, setAnalysis] = useState<IPAnalysis | null>(null);
  const [error, setError] = useState<string>('');

  // Validation IP
  const isValidIP = (ip: string): boolean => {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part);
      return !isNaN(num) && num >= 0 && num <= 255;
    });
  };

  // Déterminer la classe IP
  const getIPClass = (firstOctet: number): 'A' | 'B' | 'C' | 'D' | 'E' => {
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D';
    return 'E';
  };

  // Déterminer le type IP
  const getIPType = (ip: string): 'Private' | 'Public' | 'Loopback' | 'Multicast' | 'Reserved' => {
    const parts = ip.split('.').map(Number);
    const [first, second] = parts;

    // Loopback
    if (first === 127) return 'Loopback';
    
    // Multicast
    if (first >= 224 && first <= 239) return 'Multicast';
    
    // Reserved
    if (first === 0 || first >= 240) return 'Reserved';
    
    // Private ranges
    if (first === 10) return 'Private';
    if (first === 172 && second >= 16 && second <= 31) return 'Private';
    if (first === 192 && second === 168) return 'Private';
    if (first === 169 && second === 254) return 'Private'; // APIPA
    
    return 'Public';
  };

  // Conversion en binaire
  const toBinary = (num: number): string => {
    return num.toString(2).padStart(8, '0');
  };

  // Conversion en hexadécimal
  const toHex = (num: number): string => {
    return num.toString(16).toUpperCase().padStart(2, '0');
  };

  // Obtenir les informations réseau par défaut
  const getNetworkInfo = (ipClass: string) => {
    switch (ipClass) {
      case 'A':
        return {
          defaultMask: '255.0.0.0',
          defaultCIDR: 8,
          networkBits: 8,
          hostBits: 24
        };
      case 'B':
        return {
          defaultMask: '255.255.0.0',
          defaultCIDR: 16,
          networkBits: 16,
          hostBits: 16
        };
      case 'C':
        return {
          defaultMask: '255.255.255.0',
          defaultCIDR: 24,
          networkBits: 24,
          hostBits: 8
        };
      default:
        return undefined;
    }
  };

  // Analyser l'IP
  const analyzeIP = (ip: string): IPAnalysis => {
    try {
      setError('');

      if (!isValidIP(ip)) {
        throw new Error('Adresse IP invalide');
      }

      const parts = ip.split('.').map(Number);
      const [first, second, third, fourth] = parts;
      
      const ipClass = getIPClass(first);
      const ipType = getIPType(ip);
      
      // Conversion en nombre décimal
      const decimal = (first << 24) + (second << 16) + (third << 8) + fourth;
      
      // Conversion en binaire complète
      const binary = parts.map(toBinary).join('.');
      
      // Conversion en hexadécimal
      const hexadecimal = '0x' + parts.map(toHex).join('');

      const result: IPAnalysis = {
        ip,
        isValid: true,
        class: ipClass,
        type: ipType,
        binary,
        hexadecimal,
        decimal: decimal >>> 0, // Conversion en unsigned
        octets: {
          first: { decimal: first, binary: toBinary(first), hex: '0x' + toHex(first) },
          second: { decimal: second, binary: toBinary(second), hex: '0x' + toHex(second) },
          third: { decimal: third, binary: toBinary(third), hex: '0x' + toHex(third) },
          fourth: { decimal: fourth, binary: toBinary(fourth), hex: '0x' + toHex(fourth) }
        },
        networkInfo: getNetworkInfo(ipClass)
      };

      return result;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'analyse');
      return {
        ip,
        isValid: false,
        class: 'Invalid',
        type: 'Invalid',
        binary: '',
        hexadecimal: '',
        decimal: 0,
        octets: {
          first: { decimal: 0, binary: '', hex: '' },
          second: { decimal: 0, binary: '', hex: '' },
          third: { decimal: 0, binary: '', hex: '' },
          fourth: { decimal: 0, binary: '', hex: '' }
        }
      };
    }
  };

  // Analyse automatique
  useEffect(() => {
    const result = analyzeIP(ipAddress);
    setAnalysis(result);
  }, [ipAddress]);

  // Export des résultats
  const handleExport = () => {
    if (!analysis || !analysis.isValid) return;

    const csvContent = [
      // En-têtes
      ['Propriété', 'Valeur'].join(';'),
      // Informations générales
      ['Adresse IP', analysis.ip].join(';'),
      ['Classe', analysis.class].join(';'),
      ['Type', analysis.type].join(';'),
      ['Valide', analysis.isValid ? 'Oui' : 'Non'].join(';'),
      '',
      // Représentations
      'REPRÉSENTATIONS',
      ['Binaire', analysis.binary].join(';'),
      ['Hexadécimal', analysis.hexadecimal].join(';'),
      ['Décimal (32-bit)', analysis.decimal.toString()].join(';'),
      '',
      // Octets détaillés
      'ANALYSE PAR OCTET',
      ['Octet', 'Décimal', 'Binaire', 'Hexadécimal'].join(';'),
      ['Premier', analysis.octets.first.decimal, analysis.octets.first.binary, analysis.octets.first.hex].join(';'),
      ['Deuxième', analysis.octets.second.decimal, analysis.octets.second.binary, analysis.octets.second.hex].join(';'),
      ['Troisième', analysis.octets.third.decimal, analysis.octets.third.binary, analysis.octets.third.hex].join(';'),
      ['Quatrième', analysis.octets.fourth.decimal, analysis.octets.fourth.binary, analysis.octets.fourth.hex].join(';'),
      '',
      // Informations réseau
      'INFORMATIONS RÉSEAU',
      analysis.networkInfo ? [
        ['Masque par défaut', analysis.networkInfo.defaultMask].join(';'),
        ['CIDR par défaut', analysis.networkInfo.defaultCIDR.toString()].join(';'),
        ['Bits réseau', analysis.networkInfo.networkBits.toString()].join(';'),
        ['Bits hôte', analysis.networkInfo.hostBits.toString()].join(';')
      ].join('\n') : 'Classe sans informations réseau standard',
      '',
      ['Date d\'analyse', new Date().toLocaleString('fr-FR')].join(';')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analyse_ip_${analysis.ip.replace(/\./g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Container>
      {/* Configuration */}
      <InputSection>
        <SectionTitle>Adresse IP à Analyser</SectionTitle>
        <InputGroup>
          <IPInput
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="192.168.1.100"
            isValid={!error}
          />
          <ExampleButtons>
            <ExampleButton onClick={() => setIpAddress('8.8.8.8')}>
              Public (8.8.8.8)
            </ExampleButton>
            <ExampleButton onClick={() => setIpAddress('192.168.1.1')}>
              Privé (192.168.1.1)
            </ExampleButton>
            <ExampleButton onClick={() => setIpAddress('127.0.0.1')}>
              Loopback (127.0.0.1)
            </ExampleButton>
          </ExampleButtons>
        </InputGroup>

        {error && (
          <ErrorMessage>
            ⚠️ {error}
          </ErrorMessage>
        )}
      </InputSection>

      {/* Résultats */}
      {analysis && analysis.isValid && (
        <>
          {/* Informations générales */}
          <ResultsSection>
            <ResultsHeader>
              <SectionTitle>Analyse de l'Adresse IP</SectionTitle>
              <ExportButton onClick={handleExport}>
                📊 Exporter Analyse
              </ExportButton>
            </ResultsHeader>
            
            <OverviewGrid>
              <OverviewCard type={analysis.type}>
                <CardIcon>
                  {analysis.type === 'Private' ? '🏠' : 
                   analysis.type === 'Public' ? '🌐' :
                   analysis.type === 'Loopback' ? '🔄' :
                   analysis.type === 'Multicast' ? '📡' : '⚠️'}
                </CardIcon>
                <CardValue>{analysis.type}</CardValue>
                <CardLabel>Type d'adresse</CardLabel>
              </OverviewCard>
              
              <OverviewCard>
                <CardIcon>📊</CardIcon>
                <CardValue>Classe {analysis.class}</CardValue>
                <CardLabel>Classification IP</CardLabel>
              </OverviewCard>
              
              <OverviewCard>
                <CardIcon>🔢</CardIcon>
                <CardValue>{analysis.decimal.toLocaleString()}</CardValue>
                <CardLabel>Valeur décimale</CardLabel>
              </OverviewCard>
              
              {analysis.networkInfo && (
                <OverviewCard>
                  <CardIcon>🌐</CardIcon>
                  <CardValue>/{analysis.networkInfo.defaultCIDR}</CardValue>
                  <CardLabel>CIDR par défaut</CardLabel>
                </OverviewCard>
              )}
            </OverviewGrid>
          </ResultsSection>

          {/* Représentations */}
          <RepresentationsSection>
            <SectionTitle>Représentations Numériques</SectionTitle>
            <RepresentationCard>
              <RepresentationLabel>Notation Décimale</RepresentationLabel>
              <RepresentationValue>{analysis.ip}</RepresentationValue>
            </RepresentationCard>
            <RepresentationCard>
              <RepresentationLabel>Notation Binaire</RepresentationLabel>
              <RepresentationValue>{analysis.binary}</RepresentationValue>
            </RepresentationCard>
            <RepresentationCard>
              <RepresentationLabel>Notation Hexadécimale</RepresentationLabel>
              <RepresentationValue>{analysis.hexadecimal}</RepresentationValue>
            </RepresentationCard>
          </RepresentationsSection>

          {/* Analyse par octet */}
          <OctetsSection>
            <SectionTitle>Analyse Détaillée par Octet</SectionTitle>
            <OctetsTable>
              <TableHeader>
                <HeaderCell>Octet</HeaderCell>
                <HeaderCell>Décimal</HeaderCell>
                <HeaderCell>Binaire</HeaderCell>
                <HeaderCell>Hexadécimal</HeaderCell>
                <HeaderCell>Plage</HeaderCell>
              </TableHeader>
              <TableBody>
                {Object.entries(analysis.octets).map(([position, octet], index) => (
                  <TableRow key={position}>
                    <OctetCell>{index + 1}er</OctetCell>
                    <Cell>{octet.decimal}</Cell>
                    <BinaryCell>{octet.binary}</BinaryCell>
                    <HexCell>{octet.hex}</HexCell>
                    <Cell>0-255</Cell>
                  </TableRow>
                ))}
              </TableBody>
            </OctetsTable>
          </OctetsSection>

          {/* Informations réseau */}
          {analysis.networkInfo && (
            <NetworkSection>
              <SectionTitle>Informations Réseau (Classe {analysis.class})</SectionTitle>
              <NetworkGrid>
                <NetworkCard>
                  <NetworkLabel>Masque par Défaut</NetworkLabel>
                  <NetworkValue>{analysis.networkInfo.defaultMask}</NetworkValue>
                </NetworkCard>
                <NetworkCard>
                  <NetworkLabel>Notation CIDR</NetworkLabel>
                  <NetworkValue>/{analysis.networkInfo.defaultCIDR}</NetworkValue>
                </NetworkCard>
                <NetworkCard>
                  <NetworkLabel>Bits Réseau</NetworkLabel>
                  <NetworkValue>{analysis.networkInfo.networkBits}</NetworkValue>
                </NetworkCard>
                <NetworkCard>
                  <NetworkLabel>Bits Hôte</NetworkLabel>
                  <NetworkValue>{analysis.networkInfo.hostBits}</NetworkValue>
                </NetworkCard>
              </NetworkGrid>
            </NetworkSection>
          )}
        </>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const InputSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const IPInput = styled.input<{ isValid: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.isValid ? '#d1d5db' : '#ef4444'};
  border-radius: 8px;
  font-size: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  max-width: 200px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.isValid ? '#3b82f6' : '#ef4444'};
    box-shadow: 0 0 0 3px ${props => props.isValid ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  }
`;

const ExampleButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ExampleButton = styled.button`
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
`;

const ResultsSection = styled.div`
  margin-bottom: 32px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
  }
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const OverviewCard = styled.div<{ type?: string }>`
  background: ${props => {
    switch (props.type) {
      case 'Private': return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
      case 'Public': return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
      case 'Loopback': return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
      case 'Multicast': return 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)';
      default: return 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'Private': return '#bbf7d0';
      case 'Public': return '#bfdbfe';
      case 'Loopback': return '#fed7aa';
      case 'Multicast': return '#ddd6fe';
      default: return '#e2e8f0';
    }
  }};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const CardIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

const CardValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`;

const CardLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RepresentationsSection = styled.div`
  margin-bottom: 32px;
`;

const RepresentationCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const RepresentationLabel = styled.div`
  font-weight: 500;
  color: #374151;
`;

const RepresentationValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: #059669;
`;

const OctetsSection = styled.div`
  margin-bottom: 32px;
`;

const OctetsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
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
  letter-spacing: 0.5px;
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

const OctetCell = styled(Cell)`
  font-weight: 600;
`;

const BinaryCell = styled(Cell)`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #059669;
`;

const HexCell = styled(Cell)`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #dc2626;
`;

const NetworkSection = styled.div``;

const NetworkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const NetworkCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
`;

const NetworkLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const NetworkValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

export { IPAnalyzer };