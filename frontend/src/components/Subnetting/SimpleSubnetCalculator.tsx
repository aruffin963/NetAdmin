import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const CalculatorContainer = styled.div`
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
  grid-template-columns: 2fr 1fr;
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

  &.error {
    border-color: #e74c3c;
  }
`;

const Label = styled.label`
  display: block;
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 8px;
`;

const ResultsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const ResultCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #3498db;
`;

const ResultTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 16px;
  font-size: 1.1rem;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  .label {
    color: #6c757d;
    font-weight: 500;
  }
  
  .value {
    color: #2c3e50;
    font-family: monospace;
    font-weight: 600;
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #f5c6cb;
`;

const BinaryDisplay = styled.div`
  background: #2c3e50;
  color: #ecf0f1;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.9rem;
  margin-top: 16px;
  
  .binary-row {
    margin-bottom: 8px;
    
    .label {
      color: #3498db;
      font-weight: bold;
    }
  }
`;

interface SubnetResult {
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  subnetMask: string;
  wildcardMask: string;
  cidr: number;
  totalHosts: number;
  usableHosts: number;
  networkClass: 'A' | 'B' | 'C';
  isPrivate: boolean;
  binaryRepresentation: {
    network: string;
    mask: string;
    broadcast: string;
  };
}

export const SimpleSubnetCalculator: React.FC<{ onResultChange?: (result: SubnetResult | null) => void }> = ({ 
  onResultChange 
}) => {
  const [ip, setIp] = useState('192.168.1.1');
  const [cidr, setCidr] = useState(24);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState<string>('');

  // Fonction de validation IP
  const isValidIP = (ip: string): boolean => {
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipRegex);
    if (!match) return false;
    
    return match.slice(1).every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  };

  // Fonction de calcul du sous-réseau
  const calculateSubnet = (ipAddress: string, cidrValue: number): SubnetResult | null => {
    if (!isValidIP(ipAddress) || cidrValue < 0 || cidrValue > 32) {
      return null;
    }

    const ip32 = ipAddress.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const mask32 = (0xFFFFFFFF << (32 - cidrValue)) >>> 0;
    const network32 = (ip32 & mask32) >>> 0;
    const broadcast32 = (network32 | (~mask32)) >>> 0;

    const ip32ToAddress = (ip: number) => {
      return [
        (ip >>> 24) & 255,
        (ip >>> 16) & 255,
        (ip >>> 8) & 255,
        ip & 255
      ].join('.');
    };

    const ip32ToBinary = (ip: number) => {
      return ip.toString(2).padStart(32, '0');
    };

    const networkAddress = ip32ToAddress(network32);
    const broadcastAddress = ip32ToAddress(broadcast32);
    const subnetMask = ip32ToAddress(mask32);
    const wildcardMask = ip32ToAddress(~mask32 >>> 0);
    
    const totalHosts = Math.pow(2, 32 - cidrValue);
    const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0;
    
    const firstOctet = parseInt(ipAddress.split('.')[0], 10);
    let networkClass: 'A' | 'B' | 'C';
    if (firstOctet <= 126) networkClass = 'A';
    else if (firstOctet <= 191) networkClass = 'B';
    else networkClass = 'C';

    const isPrivate = (
      (firstOctet === 10) ||
      (firstOctet === 172 && parseInt(ipAddress.split('.')[1], 10) >= 16 && parseInt(ipAddress.split('.')[1], 10) <= 31) ||
      (firstOctet === 192 && parseInt(ipAddress.split('.')[1], 10) === 168)
    );

    return {
      networkAddress,
      broadcastAddress,
      firstHost: ip32ToAddress(network32 + 1),
      lastHost: ip32ToAddress(broadcast32 - 1),
      subnetMask,
      wildcardMask,
      cidr: cidrValue,
      totalHosts,
      usableHosts,
      networkClass,
      isPrivate,
      binaryRepresentation: {
        network: ip32ToBinary(network32),
        mask: ip32ToBinary(mask32),
        broadcast: ip32ToBinary(broadcast32)
      }
    };
  };

  useEffect(() => {
    setError('');
    
    if (!isValidIP(ip)) {
      setError('Adresse IP invalide');
      setResult(null);
      return;
    }

    if (cidr < 0 || cidr > 32) {
      setError('CIDR doit être entre 0 et 32');
      setResult(null);
      return;
    }

    const calculatedResult = calculateSubnet(ip, cidr);
    setResult(calculatedResult);
    
    if (onResultChange) {
      onResultChange(calculatedResult);
    }
  }, [ip, cidr, onResultChange]);

  return (
    <CalculatorContainer>
      <Title>🔢 Calculateur de Sous-réseau CIDR</Title>
      
      <InputGroup>
        <div>
          <Label>Adresse IP</Label>
          <Input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.1"
            className={error && !isValidIP(ip) ? 'error' : ''}
          />
        </div>
        <div>
          <Label>CIDR (/{cidr})</Label>
          <Input
            type="number"
            min="0"
            max="32"
            value={cidr}
            onChange={(e) => setCidr(parseInt(e.target.value, 10) || 0)}
            className={error && (cidr < 0 || cidr > 32) ? 'error' : ''}
          />
        </div>
      </InputGroup>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {result && (
        <ResultsContainer>
          <ResultCard>
            <ResultTitle>📍 Informations Réseau</ResultTitle>
            <ResultItem>
              <span className="label">Adresse réseau:</span>
              <span className="value">{result.networkAddress}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Adresse broadcast:</span>
              <span className="value">{result.broadcastAddress}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Premier hôte:</span>
              <span className="value">{result.firstHost}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Dernier hôte:</span>
              <span className="value">{result.lastHost}</span>
            </ResultItem>
          </ResultCard>

          <ResultCard>
            <ResultTitle>🎭 Masques</ResultTitle>
            <ResultItem>
              <span className="label">Masque de sous-réseau:</span>
              <span className="value">{result.subnetMask}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Masque wildcard:</span>
              <span className="value">{result.wildcardMask}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Notation CIDR:</span>
              <span className="value">/{result.cidr}</span>
            </ResultItem>
          </ResultCard>

          <ResultCard>
            <ResultTitle>📊 Statistiques</ResultTitle>
            <ResultItem>
              <span className="label">Total d'hôtes:</span>
              <span className="value">{result.totalHosts.toLocaleString()}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Hôtes utilisables:</span>
              <span className="value">{result.usableHosts.toLocaleString()}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Classe réseau:</span>
              <span className="value">Classe {result.networkClass}</span>
            </ResultItem>
            <ResultItem>
              <span className="label">Type:</span>
              <span className="value">{result.isPrivate ? 'Privé' : 'Public'}</span>
            </ResultItem>
          </ResultCard>

          <ResultCard>
            <ResultTitle>💻 Représentation Binaire</ResultTitle>
            <BinaryDisplay>
              <div className="binary-row">
                <span className="label">Réseau: </span>
                {result.binaryRepresentation.network.match(/.{8}/g)?.join(' ')}
              </div>
              <div className="binary-row">
                <span className="label">Masque:  </span>
                {result.binaryRepresentation.mask.match(/.{8}/g)?.join(' ')}
              </div>
              <div className="binary-row">
                <span className="label">Broadcast: </span>
                {result.binaryRepresentation.broadcast.match(/.{8}/g)?.join(' ')}
              </div>
            </BinaryDisplay>
          </ResultCard>
        </ResultsContainer>
      )}
    </CalculatorContainer>
  );
};