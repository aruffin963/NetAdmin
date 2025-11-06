import React, { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import * as d3 from 'd3';
import styled from 'styled-components';

interface NetworkNode {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'firewall' | 'server' | 'workstation' | 'access_point' | 'cloud';
  ip: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
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

interface SimpleNetworkMapProps {
  data: NetworkTopologyData;
  width?: number;
  height?: number;
  onNodeClick?: (node: NetworkNode) => void;
}

const MapContainer = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`;

const ControlPanel = styled.div`
  display: flex;
  gap: 10px;
  padding: 15px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #2563eb;
  }
`;

const SVGContainer = styled.div`
  overflow: hidden;
`;

const SimpleNetworkMap: React.FC<SimpleNetworkMapProps> = memo(({
  data,
  width = 800,
  height = 600,
  onNodeClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  // Mémoriser les données processées pour éviter les recalculs
  const processedData = useMemo(() => {
    if (!data || !data.nodes || !data.links) {
      return { nodes: [], links: [] };
    }
    return {
      nodes: data.nodes.map(node => ({ ...node })),
      links: data.links.map(link => ({ ...link }))
    };
  }, [data]);

  const nodeColors = {
    router: '#FF6B6B',
    switch: '#4ECDC4',
    firewall: '#45B7D1',
    server: '#96CEB4',
    workstation: '#FFEAA7',
    access_point: '#DDA0DD',
    cloud: '#74B9FF'
  };

  const nodeIcons = {
    router: '⚡',
    switch: '⧉',
    firewall: '🛡️',
    server: '🖥️',
    workstation: '💻',
    access_point: '📶',
    cloud: '☁️'
  };

  const renderNetwork = useCallback(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Conteneur principal
    const container = svg.append('g');

    // Simulation de force
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links)
        .id((d: any) => d.id)
        .distance(80)
        .strength(0.1))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Liens
    const links = container.append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', d => d.status === 'active' ? '#60a5fa' : '#ccc')
      .attr('stroke-width', d => Math.max(1, d.bandwidth / 1000))
      .attr('stroke-opacity', 0.6);

    // Nœuds
    const nodes = container.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Cercles des nœuds
    nodes.append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        if (d.status === 'offline') return '#ccc';
        if (d.status === 'critical') return '#FF4757';
        if (d.status === 'warning') return '#FFA502';
        return nodeColors[d.type];
      })
      .attr('stroke', d => selectedNode?.id === d.id ? '#fff' : '#333')
      .attr('stroke-width', d => selectedNode?.id === d.id ? 3 : 1);

    // Icônes
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '14px')
      .attr('fill', '#fff')
      .text(d => nodeIcons[d.type]);

    // Labels
    nodes.append('text')
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => d.name);

    // Événements
    nodes.on('click', (_, d) => {
      setSelectedNode(d);
      onNodeClick?.(d);
    });

    // Animation
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }, [processedData, width, height, selectedNode, nodeColors, nodeIcons, onNodeClick]);

  useEffect(() => {
    renderNetwork();
  }, [renderNetwork]);

  const exportSVG = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `network_topology_${new Date().toISOString().split('T')[0]}.svg`;
    link.click();
  };

  return (
    <MapContainer>
      <ControlPanel>
        <Button onClick={exportSVG}>
          🖼️ Exporter SVG
        </Button>
        {selectedNode && (
          <div style={{ marginLeft: 'auto', color: '#666' }}>
            Sélectionné: {selectedNode.name} ({selectedNode.ip})
          </div>
        )}
      </ControlPanel>
      
      <SVGContainer>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ background: '#f8fafc' }}
        />
      </SVGContainer>
    </MapContainer>
  );
});

export default SimpleNetworkMap;