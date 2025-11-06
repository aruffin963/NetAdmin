import React, { useState } from 'react';
import styled from 'styled-components';

const PlannerContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 600;
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Label = styled.label`
  display: block;
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background: #2980b9;
  }
`;

const RequirementsList = styled.div`
  margin-bottom: 24px;
`;

const RequirementItem = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const RemoveButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #c0392b;
  }
`;

const ResultsContainer = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 24px;
`;

const ResultItem = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 0.9rem;
  
  .header {
    font-weight: bold;
    background: #3498db;
    color: white;
  }
`;

interface VLSMRequirement {
  id: string;
  name: string;
  hostsRequired: number;
}

interface VLSMResult {
  requirement: VLSMRequirement;
  subnet: string;
  cidr: number;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
}

export const SimpleVLSMPlanner: React.FC = () => {
  const [baseNetwork, setBaseNetwork] = useState('192.168.1.0/24');
  const [requirements, setRequirements] = useState<VLSMRequirement[]>([]);
  const [newReqName, setNewReqName] = useState('');
  const [newReqHosts, setNewReqHosts] = useState(0);
  const [results, setResults] = useState<VLSMResult[]>([]);

  const addRequirement = () => {
    if (newReqName && newReqHosts > 0) {
      const newReq: VLSMRequirement = {
        id: Date.now().toString(),
        name: newReqName,
        hostsRequired: newReqHosts
      };
      setRequirements([...requirements, newReq]);
      setNewReqName('');
      setNewReqHosts(0);
    }
  };

  const removeRequirement = (id: string) => {
    setRequirements(requirements.filter(req => req.id !== id));
  };

  const calculateVLSM = () => {
    if (!baseNetwork || requirements.length === 0) return;

    // Parse base network
    const [baseIP, baseCIDR] = baseNetwork.split('/');
    const baseCIDRNum = parseInt(baseCIDR, 10);
    
    // Sort requirements by hosts needed (descending)
    const sortedReqs = [...requirements].sort((a, b) => b.hostsRequired - a.hostsRequired);
    
    // Calculate subnets
    const newResults: VLSMResult[] = [];
    let currentNetwork = ipToNumber(baseIP);
    const baseNetworkMask = (0xFFFFFFFF << (32 - baseCIDRNum)) >>> 0;
    const baseNetworkAddr = (currentNetwork & baseNetworkMask) >>> 0;
    
    currentNetwork = baseNetworkAddr;

    for (const req of sortedReqs) {
      // Calculate required subnet size
      const hostsNeeded = req.hostsRequired + 2; // +2 for network and broadcast
      const subnetBits = Math.ceil(Math.log2(hostsNeeded));
      const cidr = 32 - subnetBits;
      const subnetSize = Math.pow(2, subnetBits);
      
      if (cidr < baseCIDRNum) {
        continue; // Skip if subnet is larger than base network
      }

      const networkAddr = currentNetwork;
      const broadcastAddr = networkAddr + subnetSize - 1;
      const firstHost = networkAddr + 1;
      const lastHost = broadcastAddr - 1;

      newResults.push({
        requirement: req,
        subnet: numberToIP(networkAddr),
        cidr,
        firstHost: numberToIP(firstHost),
        lastHost: numberToIP(lastHost),
        totalHosts: subnetSize,
        usableHosts: subnetSize - 2
      });

      currentNetwork = networkAddr + subnetSize;
    }

    setResults(newResults);
  };

  // Utility functions
  const ipToNumber = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  };

  const numberToIP = (num: number): string => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');
  };

  return (
    <PlannerContainer>
      <Title>🌐 Planificateur VLSM Simplifié</Title>
      
      <InputGroup>
        <div>
          <Label>Réseau de base</Label>
          <Input
            type="text"
            value={baseNetwork}
            onChange={(e) => setBaseNetwork(e.target.value)}
            placeholder="192.168.1.0/24"
          />
        </div>
      </InputGroup>

      <div style={{ marginBottom: '24px' }}>
        <Label>Ajouter un segment</Label>
        <InputGroup>
          <Input
            type="text"
            value={newReqName}
            onChange={(e) => setNewReqName(e.target.value)}
            placeholder="Nom du segment (ex: LAN Bureau)"
          />
          <Input
            type="number"
            value={newReqHosts || ''}
            onChange={(e) => setNewReqHosts(parseInt(e.target.value, 10) || 0)}
            placeholder="Nombre d'hôtes requis"
          />
        </InputGroup>
        <Button onClick={addRequirement} style={{ marginTop: '12px' }}>
          Ajouter Segment
        </Button>
      </div>

      {requirements.length > 0 && (
        <RequirementsList>
          <h3 style={{ color: '#2c3e50', marginBottom: '16px' }}>Segments à créer:</h3>
          {requirements.map((req) => (
            <RequirementItem key={req.id}>
              <span>{req.name}</span>
              <span>{req.hostsRequired} hôtes</span>
              <span>CIDR: /{32 - Math.ceil(Math.log2(req.hostsRequired + 2))}</span>
              <RemoveButton onClick={() => removeRequirement(req.id)}>
                Supprimer
              </RemoveButton>
            </RequirementItem>
          ))}
          <Button onClick={calculateVLSM} style={{ marginTop: '16px' }}>
            Calculer VLSM
          </Button>
        </RequirementsList>
      )}

      {results.length > 0 && (
        <ResultsContainer>
          <h3 style={{ color: '#2c3e50', marginBottom: '16px' }}>Résultats VLSM:</h3>
          
          <ResultItem className="header">
            <div style={{ padding: '8px' }}>Segment</div>
            <div style={{ padding: '8px' }}>Réseau</div>
            <div style={{ padding: '8px' }}>CIDR</div>
            <div style={{ padding: '8px' }}>Premier IP</div>
            <div style={{ padding: '8px' }}>Dernier IP</div>
          </ResultItem>
          
          {results.map((result, index) => (
            <ResultItem key={index}>
              <div>{result.requirement.name}</div>
              <div>{result.subnet}/{result.cidr}</div>
              <div>/{result.cidr}</div>
              <div>{result.firstHost}</div>
              <div>{result.lastHost}</div>
            </ResultItem>
          ))}
          
          <div style={{ marginTop: '16px', padding: '12px', background: '#e8f4f8', borderRadius: '6px' }}>
            <strong>Résumé:</strong>
            <br />
            • {results.length} segments créés
            <br />
            • {results.reduce((sum, r) => sum + r.usableHosts, 0)} adresses IP utilisables au total
            <br />
            • Efficacité: {Math.round((requirements.reduce((sum, r) => sum + r.hostsRequired, 0) / results.reduce((sum, r) => sum + r.usableHosts, 0)) * 100)}%
          </div>
        </ResultsContainer>
      )}
    </PlannerContainer>
  );
};