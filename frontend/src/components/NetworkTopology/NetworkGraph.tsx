import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import ForceGraph2D from 'react-force-graph-2d';
import { topologyService } from '../../services/topology';
import { LoadingSpinner, ErrorMessage } from '../Common';
import { 
  GraphData, 
  NetworkDevice, 
  DeviceType
} from '../../types/topology';

const NetworkGraphContainer = styled.div`
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;

  .graph-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    display: flex;
    gap: 8px;
  }

  .control-button {
    padding: 8px 12px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    color: #212529;
    transition: all 0.2s ease;

    &:hover {
      background: #007bff;
      color: white;
    }

    &.active {
      background: #007bff;
      color: white;
    }
  }
`;

const DeviceTooltip = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.12);
  font-size: 12px;
  max-width: 250px;

  .device-name {
    font-weight: 600;
    margin-bottom: 8px;
    color: #212529;
  }

  .device-info {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 8px;
    font-size: 11px;

    .label {
      color: #6c757d;
    }

    .value {
      color: #212529;
    }
  }

  .device-status {
    margin-top: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    text-align: center;
    font-weight: 500;
    font-size: 10px;
    text-transform: uppercase;

    &.online { background: #d4edda; color: #155724; }
    &.offline { background: #f8d7da; color: #721c24; }
    &.warning { background: #fff3cd; color: #856404; }
    &.critical { background: #f8d7da; color: #721c24; }
    &.maintenance { background: #d1ecf1; color: #0c5460; }
    &.unknown { background: #e9ecef; color: #495057; }
  }
`;

interface NetworkGraphProps {
  topologyId?: string;
  height?: number;
  onDeviceClick?: (device: NetworkDevice) => void;
  onDeviceHover?: (device: NetworkDevice | null) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  topologyId,
  height = 600,
  onDeviceClick,
  onDeviceHover
}) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  // Device type colors
  const deviceColors = useMemo(() => ({
    router: '#FF6B6B',
    switch: '#4ECDC4',
    firewall: '#45B7D1',
    server: '#96CEB4',
    access_point: '#FFEAA7',
    workstation: '#DDA0DD',
    printer: '#98D8C8',
    phone: '#F7DC6F',
    camera: '#BB8FCE',
    sensor: '#85C1E9',
    hub: '#F8C471',
    bridge: '#82E0AA',
    unknown: '#BDC3C7'
  }), []);

  // Status colors
  const statusColors = useMemo(() => ({
    online: '#27AE60',
    offline: '#E74C3C',
    warning: '#F39C12',
    critical: '#C0392B',
    maintenance: '#3498DB',
    unknown: '#95A5A6'
  }), []);

  // Charger la topologie
  useEffect(() => {
    const loadTopology = async () => {
      if (!topologyId) {
        // Charger la première topologie disponible
        try {
          setLoading(true);
          const topologies = await topologyService.getAllTopologies();
          if (topologies.length > 0) {
            const firstTopology = topologies[0];
            const graph = await topologyService.getGraphData(firstTopology.id);
            setGraphData(graph);
          } else {
            setError('Aucune topologie disponible');
          }
        } catch (err) {
          setError('Erreur lors du chargement des topologies');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        // Charger topologie spécifique
        try {
          setLoading(true);
          const topo = await topologyService.getTopologyById(topologyId);
          if (topo) {
            const graph = await topologyService.getGraphData(topologyId);
            setGraphData(graph);
          } else {
            setError('Topologie non trouvée');
          }
        } catch (err) {
          setError('Erreur lors du chargement de la topologie');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTopology();
  }, [topologyId]);

  // Gestionnaire de clic sur nœud
  const handleNodeClick = useCallback((node: any) => {
    if (onDeviceClick && node.device) {
      onDeviceClick(node.device);
    }
  }, [onDeviceClick]);

  // Gestionnaire de survol
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);
    if (onDeviceHover) {
      onDeviceHover(node?.device || null);
    }
  }, [onDeviceHover]);

  // Rendu des nœuds
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const device = node.device as NetworkDevice;
    if (!device) return;

    const size = 12;
    const color = deviceColors[device.type] || deviceColors.unknown;
    const statusColor = statusColors[device.status] || statusColors.unknown;

    // Dessiner le nœud principal
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Bordure de statut
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icône (optionnel)
    if (showIcons) {
      const iconSize = 8;
      ctx.fillStyle = 'white';
      ctx.font = `${iconSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(getDeviceIcon(device.type), node.x, node.y);
    }

    // Label
    if (showLabels) {
      const label = device.name || device.hostname || device.ip;
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, node.x, node.y + size + 12);
    }
  }, [deviceColors, statusColors, showIcons, showLabels]);

  // Icônes pour les types d'appareils
  const getDeviceIcon = (type: DeviceType): string => {
    const icons = {
      router: '⚡',
      switch: '⧉',
      firewall: '🛡',
      server: '▣',
      access_point: '📶',
      workstation: '🖥',
      printer: '🖨',
      phone: '📞',
      camera: '📹',
      sensor: '📡',
      hub: '⬢',
      bridge: '🌉',
      unknown: '?'
    };
    return icons[type] || icons.unknown;
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de la topologie..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!graphData || !graphData.nodes.length) {
    return <ErrorMessage message="Aucune donnée de topologie à afficher" />;
  }

  return (
    <NetworkGraphContainer style={{ height }}>
      <div className="graph-controls">
        <button
          className={`control-button ${showLabels ? 'active' : ''}`}
          onClick={() => setShowLabels(!showLabels)}
        >
          Labels
        </button>
        <button
          className={`control-button ${showIcons ? 'active' : ''}`}
          onClick={() => setShowIcons(!showIcons)}
        >
          Icônes
        </button>
      </div>

      <ForceGraph2D
        graphData={graphData}
        width={undefined}
        height={height}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 15, 0, 2 * Math.PI);
          ctx.fill();
        }}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkColor={() => '#999'}
        linkWidth={2}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={100}
        nodeRelSize={1}
      />

      {/* Tooltip */}
      {hoveredNode && hoveredNode.device && (
        <div
          style={{
            position: 'absolute',
            left: hoveredNode.x + 20,
            top: hoveredNode.y - 10,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <DeviceTooltip>
            <div className="device-name">
              {hoveredNode.device.name || hoveredNode.device.hostname}
            </div>
            <div className="device-info">
              <span className="label">Type:</span>
              <span className="value">{hoveredNode.device.type}</span>
              <span className="label">IP:</span>
              <span className="value">{hoveredNode.device.ip}</span>
              <span className="label">MAC:</span>
              <span className="value">{hoveredNode.device.mac || 'N/A'}</span>
              <span className="label">Vendor:</span>
              <span className="value">{hoveredNode.device.vendor || 'Inconnu'}</span>
            </div>
            <div className={`device-status ${hoveredNode.device.status}`}>
              {hoveredNode.device.status}
            </div>
          </DeviceTooltip>
        </div>
      )}
    </NetworkGraphContainer>
  );
};