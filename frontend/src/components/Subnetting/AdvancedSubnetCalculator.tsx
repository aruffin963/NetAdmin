import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface SubnetResult {
  id: number;
  networkAddress: string;
  firstHost: string;
  lastHost: string;
  broadcastAddress: string;
  subnetMask: string;
  totalHosts: number;
  usableHosts: number;
  cidr: number;
}

interface CalculatorResult {
  subnets: SubnetResult[];
  totalSubnets: number;
  hostsPerSubnet: number;
  wastedIPs: number;
}

const AdvancedSubnetCalculator: React.FC<{ onResultChange?: (result: any) => void }> = ({ onResultChange }) => {
  const [networkAddress, setNetworkAddress] = useState('192.168.1.0');
  const [subnetMask, setSubnetMask] = useState('24');
  const [requiredHosts, setRequiredHosts] = useState('50');
  const [requiredSubnets, setRequiredSubnets] = useState('4');
  const [calculationMode, setCalculationMode] = useState<'hosts' | 'subnets'>('subnets');
  const [results, setResults] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string>('');

  // Validation des adresses IP
  const isValidIP = (ip: string): boolean => {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part);
      return !isNaN(num) && num >= 0 && num <= 255;
    });
  };

  // Conversion IP vers nombre
  const ipToNumber = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  };

  // Conversion nombre vers IP
  const numberToIP = (num: number): string => {
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
  };

  // Calcul du masque de sous-réseau
  const calculateSubnetMask = (cidr: number): string => {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return numberToIP(mask);
  };

  // Calcul principal
  const calculateSubnets = (): CalculatorResult | null => {
    try {
      setError('');

      if (!isValidIP(networkAddress)) {
        throw new Error('Adresse réseau invalide');
      }

      const originalCidr = parseInt(subnetMask);
      if (originalCidr < 8 || originalCidr > 30) {
        throw new Error('Masque CIDR doit être entre 8 et 30');
      }

      let newCidr: number;
      let actualSubnets: number;
      let hostsPerSubnet: number;

      if (calculationMode === 'subnets') {
        const reqSubnets = parseInt(requiredSubnets);
        if (reqSubnets < 1 || reqSubnets > 1024) {
          throw new Error('Nombre de sous-réseaux doit être entre 1 et 1024');
        }

        // Calculer le nombre de bits nécessaires pour les sous-réseaux
        const bitsNeeded = Math.ceil(Math.log2(reqSubnets));
        newCidr = originalCidr + bitsNeeded;

        if (newCidr > 30) {
          throw new Error('Pas assez d\'espace d\'adressage pour ce nombre de sous-réseaux');
        }

        actualSubnets = Math.pow(2, bitsNeeded);
        hostsPerSubnet = Math.pow(2, 32 - newCidr) - 2;
      } else {
        const reqHosts = parseInt(requiredHosts);
        if (reqHosts < 1 || reqHosts > 65534) {
          throw new Error('Nombre d\'hôtes doit être entre 1 et 65534');
        }

        // Calculer le nombre de bits nécessaires pour les hôtes (+2 pour réseau et broadcast)
        const bitsNeeded = Math.ceil(Math.log2(reqHosts + 2));
        newCidr = 32 - bitsNeeded;

        if (newCidr < originalCidr) {
          throw new Error('Pas assez d\'espace d\'adressage pour ce nombre d\'hôtes');
        }

        hostsPerSubnet = Math.pow(2, bitsNeeded) - 2;
        actualSubnets = Math.pow(2, newCidr - originalCidr);
      }

      // Calculer les sous-réseaux
      const networkNum = ipToNumber(networkAddress);
      const subnetSize = Math.pow(2, 32 - newCidr);
      const subnets: SubnetResult[] = [];

      for (let i = 0; i < actualSubnets; i++) {
        const subnetStart = networkNum + (i * subnetSize);
        const subnetEnd = subnetStart + subnetSize - 1;
        
        subnets.push({
          id: i + 1,
          networkAddress: numberToIP(subnetStart),
          firstHost: numberToIP(subnetStart + 1),
          lastHost: numberToIP(subnetEnd - 1),
          broadcastAddress: numberToIP(subnetEnd),
          subnetMask: calculateSubnetMask(newCidr),
          totalHosts: subnetSize,
          usableHosts: hostsPerSubnet,
          cidr: newCidr
        });
      }

      const totalAvailableHosts = Math.pow(2, 32 - originalCidr) - 2;
      const usedHosts = actualSubnets * (hostsPerSubnet + 2);
      const wastedIPs = totalAvailableHosts - usedHosts;

      return {
        subnets,
        totalSubnets: actualSubnets,
        hostsPerSubnet,
        wastedIPs: Math.max(0, wastedIPs)
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de calcul');
      return null;
    }
  };

  // Calcul automatique lors des changements
  useEffect(() => {
    const result = calculateSubnets();
    setResults(result);
    
    if (result && onResultChange) {
      onResultChange({
        networkAddress: networkAddress,
        cidr: parseInt(subnetMask),
        totalSubnets: result.totalSubnets
      });
    }
  }, [networkAddress, subnetMask, requiredHosts, requiredSubnets, calculationMode]);

  // Fonction d'export CSV
  const handleExport = () => {
    if (!results) return;

    const csvContent = [
      // En-têtes
      ['Sous-réseau', 'Adresse Réseau', 'CIDR', 'Première IP', 'Dernière IP', 'Broadcast', 'Masque', 'Hôtes Utilisables', 'Total Hôtes'].join(';'),
      // Données des sous-réseaux
      ...results.subnets.map(subnet => [
        subnet.id.toString(),
        subnet.networkAddress,
        subnet.cidr.toString(),
        subnet.firstHost,
        subnet.lastHost,
        subnet.broadcastAddress,
        subnet.subnetMask,
        subnet.usableHosts.toString(),
        subnet.totalHosts.toString()
      ].join(';')),
      // Ligne vide
      '',
      // Résumé
      'RÉSUMÉ DU CALCUL',
      `Adresse réseau originale;${networkAddress}/${subnetMask}`,
      `Nombre total de sous-réseaux;${results.totalSubnets}`,
      `Hôtes par sous-réseau;${results.hostsPerSubnet}`,
      `Nouveau masque CIDR;${results.subnets[0]?.cidr || 0}`,
      `IPs non utilisées;${results.wastedIPs}`,
      `Mode de calcul;${calculationMode === 'subnets' ? 'Par nombre de sous-réseaux' : 'Par nombre d\'hôtes'}`,
      `Date de génération;${new Date().toLocaleString('fr-FR')}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subnetting_${networkAddress.replace(/\./g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Container>
      {/* Configuration */}
      <ConfigSection>
        <SectionTitle>Configuration du Calcul</SectionTitle>
        
        <ConfigGrid>
          <InputGroup>
            <Label>Adresse Réseau</Label>
            <Input
              type="text"
              value={networkAddress}
              onChange={(e) => setNetworkAddress(e.target.value)}
              placeholder="192.168.1.0"
            />
          </InputGroup>

          <InputGroup>
            <Label>Masque Original (CIDR)</Label>
            <Input
              type="number"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              min="8"
              max="30"
            />
          </InputGroup>

          <InputGroup>
            <Label>Mode de Calcul</Label>
            <Select
              value={calculationMode}
              onChange={(e) => setCalculationMode(e.target.value as 'hosts' | 'subnets')}
            >
              <option value="subnets">Par nombre de sous-réseaux</option>
              <option value="hosts">Par nombre d'hôtes</option>
            </Select>
          </InputGroup>

          {calculationMode === 'subnets' ? (
            <InputGroup>
              <Label>Nombre de Sous-réseaux Voulus</Label>
              <Input
                type="number"
                value={requiredSubnets}
                onChange={(e) => setRequiredSubnets(e.target.value)}
                min="1"
                max="1024"
              />
            </InputGroup>
          ) : (
            <InputGroup>
              <Label>Nombre d'Hôtes par Sous-réseau</Label>
              <Input
                type="number"
                value={requiredHosts}
                onChange={(e) => setRequiredHosts(e.target.value)}
                min="1"
                max="65534"
              />
            </InputGroup>
          )}
        </ConfigGrid>

        {error && (
          <ErrorMessage>
            ⚠️ {error}
          </ErrorMessage>
        )}
      </ConfigSection>

      {/* Résultats */}
      {results && !error && (
        <>
          <SummarySection>
            <SectionTitle>Résumé du Calcul</SectionTitle>
            <SummaryGrid>
              <SummaryCard>
                <SummaryValue>{results.totalSubnets}</SummaryValue>
                <SummaryLabel>Sous-réseaux créés</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryValue>{results.hostsPerSubnet}</SummaryValue>
                <SummaryLabel>Hôtes par sous-réseau</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryValue>{results.subnets[0]?.cidr || 0}</SummaryValue>
                <SummaryLabel>Nouveau masque CIDR</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryValue>{results.wastedIPs}</SummaryValue>
                <SummaryLabel>IPs non utilisées</SummaryLabel>
              </SummaryCard>
            </SummaryGrid>
          </SummarySection>

          <ResultsSection>
            <ResultsHeader>
              <SectionTitle>Liste des Sous-réseaux</SectionTitle>
              <ExportButton onClick={handleExport}>
                📊 Exporter CSV
              </ExportButton>
            </ResultsHeader>
            <SubnetsTable>
              <TableHeader>
                <HeaderCell>#</HeaderCell>
                <HeaderCell>Réseau</HeaderCell>
                <HeaderCell>Première IP</HeaderCell>
                <HeaderCell>Dernière IP</HeaderCell>
                <HeaderCell>Broadcast</HeaderCell>
                <HeaderCell>Masque</HeaderCell>
                <HeaderCell>Hôtes Utilisables</HeaderCell>
              </TableHeader>
              <TableBody>
                {results.subnets.map((subnet) => (
                  <TableRow key={subnet.id}>
                    <Cell>{subnet.id}</Cell>
                    <Cell>
                      <NetworkAddress>
                        {subnet.networkAddress}/{subnet.cidr}
                      </NetworkAddress>
                    </Cell>
                    <Cell>{subnet.firstHost}</Cell>
                    <Cell>{subnet.lastHost}</Cell>
                    <Cell>{subnet.broadcastAddress}</Cell>
                    <Cell>{subnet.subnetMask}</Cell>
                    <Cell>{subnet.usableHosts}</Cell>
                  </TableRow>
                ))}
              </TableBody>
            </SubnetsTable>
          </ResultsSection>
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

const ConfigSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

const SummarySection = styled.div`
  margin-bottom: 32px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
`;

const SummaryCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`;

const SummaryLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ResultsSection = styled.div``;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ExportButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SubnetsTable = styled.table`
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
  border-bottom: 1px solid #e2e8f0;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f9fafb;
  }
  
  &:hover {
    background: #f3f4f6;
  }
`;

const Cell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
`;

const NetworkAddress = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: #059669;
`;

export { AdvancedSubnetCalculator };