import React, { Suspense, lazy } from 'react';
import styled from 'styled-components';

// Lazy load du composant lourd D3.js
const SimpleNetworkMap = lazy(() => import('./SimpleNetworkMap'));

// Composant de chargement pour le fallback
const LoadingContainer = styled.div`
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-left: 4px solid #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-left: 16px;
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
`;

const NetworkMapFallback: React.FC = () => (
  <LoadingContainer>
    <LoadingSpinner />
    <LoadingText>Chargement de la visualisation réseau...</LoadingText>
  </LoadingContainer>
);

interface NetworkNode {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'firewall' | 'server' | 'workstation' | 'access_point' | 'cloud';
  ip: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
}

interface NetworkLink {
  source: string;
  target: string;
  type: 'ethernet' | 'fiber' | 'wireless';
  bandwidth: number;
  status: 'active' | 'inactive';
}

interface NetworkTopologyData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface LazyNetworkMapProps {
  data: NetworkTopologyData;
  width?: number;
  height?: number;
  onNodeClick?: (node: NetworkNode) => void;
}

const LazyNetworkMap: React.FC<LazyNetworkMapProps> = ({ data, width, height, onNodeClick }) => {
  return (
    <Suspense fallback={<NetworkMapFallback />}>
      <SimpleNetworkMap 
        data={data}
        width={width}
        height={height}
        onNodeClick={onNodeClick}
      />
    </Suspense>
  );
};export default LazyNetworkMap;