import React from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PerformanceMetric, ChartDataPoint, MetricType } from '../../types/monitoring';

interface MetricChartProps {
  title: string;
  data: ChartDataPoint[];
  metric?: PerformanceMetric;
  color?: string;
  height?: number;
  showWarningLine?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
}

const MetricChart: React.FC<MetricChartProps> = ({
  title,
  data,
  metric,
  color = '#3b82f6',
  height = 200,
  showWarningLine = true,
  warningThreshold,
  criticalThreshold
}) => {
  // Formatage de la valeur pour l'affichage
  const formatValue = (value: number): string => {
    if (!metric) return value.toString();
    
    switch (metric.metricType) {
      case MetricType.CPU_USAGE:
      case MetricType.MEMORY_USAGE:
      case MetricType.DISK_USAGE:
        return `${value.toFixed(1)}%`;
      case MetricType.LATENCY:
        return `${value.toFixed(0)}ms`;
      case MetricType.NETWORK_IN:
      case MetricType.NETWORK_OUT:
        return formatBytes(value);
      case MetricType.TEMPERATURE:
        return `${value.toFixed(1)}°C`;
      default:
        return value.toFixed(2);
    }
  };

  // Formateur pour les bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Déterminer la couleur basée sur les seuils
  const getLineColor = (): string => {
    if (!metric || data.length === 0) return color;
    
    const lastValue = data[data.length - 1].value;
    
    if (criticalThreshold && lastValue > criticalThreshold) {
      return '#dc2626'; // Rouge critique
    }
    if (warningThreshold && lastValue > warningThreshold) {
      return '#f59e0b'; // Orange warning
    }
    return color; // Bleu normal
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <TooltipContainer>
          <TooltipLabel>{label}</TooltipLabel>
          <TooltipValue>
            {formatValue(payload[0].value)}
          </TooltipValue>
        </TooltipContainer>
      );
    }
    return null;
  };

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>{title}</ChartTitle>
        {metric && (
          <CurrentValue color={getLineColor()}>
            {formatValue(metric.value)}
          </CurrentValue>
        )}
      </ChartHeader>
      
      <ChartWrapper height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Ligne de seuil d'alerte */}
            {showWarningLine && warningThreshold && (
              <Line
                type="monotone"
                dataKey={() => warningThreshold}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
              />
            )}
            
            {/* Ligne de seuil critique */}
            {showWarningLine && criticalThreshold && (
              <Line
                type="monotone"
                dataKey={() => criticalThreshold}
                stroke="#dc2626"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
              />
            )}
            
            {/* Ligne principale des données */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={getLineColor()}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: getLineColor() }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
      
      {/* Légende des seuils */}
      {showWarningLine && (warningThreshold || criticalThreshold) && (
        <ThresholdLegend>
          {warningThreshold && (
            <ThresholdItem>
              <ThresholdLine color="#f59e0b" />
              <span>Warning: {formatValue(warningThreshold)}</span>
            </ThresholdItem>
          )}
          {criticalThreshold && (
            <ThresholdItem>
              <ThresholdLine color="#dc2626" />
              <span>Critical: {formatValue(criticalThreshold)}</span>
            </ThresholdItem>
          )}
        </ThresholdLegend>
      )}
    </ChartContainer>
  );
};

// Styled Components
const ChartContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ChartTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
`;

const CurrentValue = styled.div<{ color: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.color};
`;

const ChartWrapper = styled.div<{ height: number }>`
  height: ${props => props.height}px;
`;

const TooltipContainer = styled.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const TooltipLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const TooltipValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const ThresholdLegend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
`;

const ThresholdItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ThresholdLine = styled.div<{ color: string }>`
  width: 16px;
  height: 2px;
  background: ${props => props.color};
  border-radius: 1px;
`;

export default MetricChart;