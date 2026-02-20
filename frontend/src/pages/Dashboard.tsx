import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors } from '../config/colors';
import {
  Globe,
  Server,
  AlertTriangle,
  BarChart3,
  Activity,
  Database,
  HardDrive,
  Zap,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { API_BASE_URL } from '../config/api';

// ============ INTERFACES ============

interface ZabbixHost {
  hostid: string;
  name: string;
  status: number;
  interfaces?: Array<{ ip: string; dns: string; type: string }>;
}

interface ZabbixMetrics {
  hostId: string;
  hostName: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  uptime?: number;
}

interface ActivityLog {
  id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string;
  status: 'success' | 'error' | 'warning';
  ip_address?: string;
  created_at: string;
}

interface TimeSeriesData {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  timestamp: number;
}

// ============ STYLED COMPONENTS ============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  background: ${colors.background.tertiary};
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  background: ${colors.primary.blue};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 36px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: -0.5px;
`;

const RefreshButton = styled.button`
  background: ${colors.primary.blue};
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.4);
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover:not(:disabled) {
    background: ${colors.primary.blueDark};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RefreshIndicator = styled.span<{ isRefreshing: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
background: ${props => props.isRefreshing ? colors.semantic.success : colors.border.medium};
  animation: ${props => props.isRefreshing ? 'pulse 2s infinite' : 'none'};
  box-shadow: ${props => props.isRefreshing ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'};
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
    50% {
      opacity: 0.5;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
    }
  }
`;

const RefreshControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AutoRefreshToggle = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)'};
  color: ${props => props.active ? '#10b981' : '#6b7280'};
  border: 1px solid ${props => props.active ? 'rgba(16, 185, 129, 0.5)' : 'rgba(107, 114, 128, 0.3)'};
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)'};
    border-color: ${props => props.active ? 'rgba(16, 185, 129, 0.7)' : 'rgba(107, 114, 128, 0.5)'};
  }
`;

const CounterValue = styled.span`
  display: inline-block;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &.update {
    animation: counterFlip 0.5s ease;
  }
  
  @keyframes counterFlip {
    0% {
      transform: scale(1) rotateX(0deg);
      opacity: 1;
    }
    50% {
      transform: scale(1.1) rotateX(25deg);
      opacity: 0.8;
    }
    100% {
      transform: scale(1) rotateX(0deg);
      opacity: 1;
    }
  }
`;

const ErrorBox = styled.div`
  background: ${colors.alert.dangerBg};
  color: ${colors.alert.dangerText};
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  border-left: 3px solid ${colors.semantic.danger};
  margin-bottom: 12px;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  min-width: 140px;
  padding: 12px 20px;
  background: ${props => props.active ? colors.primary.blue : 'transparent'};
  color: ${props => props.active ? 'white' : '#64748b'};
  border: ${props => props.active ? 'none' : '1px solid #e2e8f0'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: ${props => props.active ? '0 4px 15px rgba(96, 165, 250, 0.3)' : 'none'};

  &:hover {
    background: ${props => props.active ? colors.primary.blue : 'rgba(96, 165, 250, 0.1)'};
    color: ${props => props.active ? 'white' : '#60a5fa'};
    border-color: rgba(96, 165, 250, 0.4);
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    box-shadow: 0 12px 40px rgba(96, 165, 250, 0.1);
    transform: translateY(-4px);
  }
`;

const CardTitle = styled.h3`
  color: #475569;
  font-size: 13px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardValue = styled.div`
  font-size: 36px;
  font-weight: 900;
  background: ${colors.primary.blue};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
`;

const CardSubtext = styled.div`
  font-size: 12px;
  color: #94a3b8;
`;

const ProgressBar = styled.div<{ value: number }>`
  width: 100%;
  height: 8px;
  background: rgba(96, 165, 250, 0.1);
  border-radius: 4px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.value}%;
    background: ${colors.primary.blue};
    border-radius: 3px;
    transition: width 0.3s ease;
    box-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
  }
`;

// ============ ALERTS STYLED COMPONENTS ============

const AlertsStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  grid-column: 1 / -1;
`;

const AlertStatCard = styled.div<{ type: 'critical' | 'warning' | 'resolved' }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid ${props => {
    switch (props.type) {
      case 'critical': return '#fee2e2';
      case 'warning': return '#fef3c7';
      case 'resolved': return '#dcfce7';
    }
  }};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => {
      switch (props.type) {
        case 'critical': return 'rgba(239, 68, 68, 0.15)';
        case 'warning': return 'rgba(245, 158, 11, 0.15)';
        case 'resolved': return 'rgba(16, 185, 129, 0.15)';
      }
    }};
  }
`;

const AlertStatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AlertStatValue = styled.div<{ type: 'critical' | 'warning' | 'resolved' }>`
  font-size: 32px;
  font-weight: 900;
  background: ${props => {
    switch (props.type) {
      case 'critical': return colors.semantic.danger;
      case 'warning': return colors.semantic.warning;
      case 'resolved': return colors.semantic.success;
      default: return colors.primary.blue;
    }
  }};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
`;

const AlertsContainer = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const AlertItemCard = styled.div<{ severity: 'critical' | 'warning' }>`
  background: white;
  border-radius: 12px;
  border-left: 5px solid ${props => props.severity === 'critical' ? '#ef4444' : '#f59e0b'};
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: -100%;
    width: 100%;
    height: 100%;
    background: ${props => props.severity === 'critical' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)'};
    transition: right 0.3s ease;
    z-index: -1;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px ${props => props.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
    
    &::before {
      right: 0;
    }
  }
`;

const AlertHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
`;

const AlertHostName = styled.h4`
  margin: 0;
  color: #000000;
  font-size: 15px;
  font-weight: 700;
  flex: 1;
`;

const AlertSeverityBadge = styled.span<{ severity: 'critical' | 'warning' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.severity === 'critical' ? '#fee2e2' : '#fef3c7'};
  color: ${props => props.severity === 'critical' ? '#991b1b' : '#92400e'};
  white-space: nowrap;
`;

const AlertMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AlertMetricItem = styled.div<{ severity: 'critical' | 'warning' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: ${props => props.severity === 'critical' ? '#fee2e2' : '#fef3c7'};
  border-radius: 8px;
  font-size: 13px;
`;

const AlertMetricLabel = styled.span`
  font-weight: 600;
  color: #6b7280;
`;

const AlertMetricValue = styled.span<{ severity: 'critical' | 'warning' }>`
  font-weight: 700;
  color: ${props => props.severity === 'critical' ? '#991b1b' : '#92400e'};
  font-family: 'Courier New', monospace;
`;

const AlertTimestamp = styled.div`
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NoAlertsState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
  gap: 12px;
  
  div:first-child {
    font-size: 48px;
  }
  
  div:nth-child(2) {
    font-size: 18px;
    font-weight: 600;
    color: #6b7280;
  }
  
  div:nth-child(3) {
    font-size: 13px;
  }
`;

const HealthScoreContainer = styled.div`
  grid-column: 1 / -1;
  background: white;
  border-radius: 12px;
  padding: 24px;
  background: white;
  border: 1px solid #e2e8f0;
  backdrop-filter: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 32px;
`;

const CircularGaugeWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
`;

const CircularGauge = styled.svg`
  width: 100%;
  height: 100%;
`;

const HealthScoreContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HealthTitle = styled.h3`
  color: #000000;
  font-size: 18px;
  margin: 0;
  font-weight: 700;
`;

const HealthMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const HealthMetricItem = styled.div<{ severity: 'ok' | 'warning' | 'critical' }>`
  padding: 12px;
  border-radius: 8px;
  background: ${props => {
    switch (props.severity) {
      case 'critical': return '#fee2e2';
      case 'warning': return '#fef3c7';
      default: return '#d1fae5';
    }
  }};
  
  font-size: 12px;
  color: ${props => {
    switch (props.severity) {
      case 'critical': return '#991b1b';
      case 'warning': return '#92400e';
      default: return '#065f46';
    }
  }};
  font-weight: 600;
`;

const StatusDistributionGrid = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`;

const StatusCard = styled.div<{ type: 'online' | 'warning' | 'offline' }>`
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${props => {
    switch (props.type) {
      case 'online': return '#dcfce7';
      case 'warning': return '#fef3c7';
      case 'offline': return '#fee2e2';
    }
  }};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: #f8fafc;
    transform: translateY(-4px);
    box-shadow: ${props => {
      switch (props.type) {
        case 'online': return '0 12px 40px rgba(16, 185, 129, 0.15)';
        case 'warning': return '0 12px 40px rgba(245, 158, 11, 0.15)';
        case 'offline': return '0 12px 40px rgba(239, 68, 68, 0.15)';
      }
    }};
  }
`;

const StatusNumber = styled.div<{ type: 'online' | 'warning' | 'offline' }>`
  font-size: 48px;
  font-weight: 900;
  background: ${props => {
    switch (props.type) {
      case 'online': return colors.semantic.success;
      case 'warning': return colors.semantic.warning;
      case 'offline': return colors.semantic.danger;
      default: return colors.primary.blue;
    }
  }};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatusLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusPercent = styled.div<{ type: 'online' | 'warning' | 'offline' }>`
  font-size: 13px;
  font-weight: 700;
  color: ${props => {
    switch (props.type) {
      case 'online': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'offline': return '#ef4444';
    }
  }};
  font-weight: 700;
`;

const TopProblemsContainer = styled.div`
  grid-column: 1 / -1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TopProblemsTitle = styled.h3`
  color: #000000;
  font-size: 16px;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
`;

const ProblemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const ProblemItem = styled.div<{ severity: 'warning' | 'critical' }>`
  background: ${props => props.severity === 'critical' ? '#fee2e2' : '#fef3c7'};
  border-left: 4px solid ${props => props.severity === 'critical' ? '#ef4444' : '#f59e0b'};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProblemHostName = styled.div`
  font-weight: 700;
  color: #1f2937;
  font-size: 13px;
`;

const ProblemMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProblemMetricLine = styled.div<{ value: number }>`
  font-size: 12px;
  color: ${props => props.value >= 90 ? '#991b1b' : props.value >= 80 ? '#92400e' : '#65a30d'};
  font-weight: 600;
`;

const TrendBadge = styled.div<{ direction: 'up' | 'down' | 'stable' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${props => {
    switch (props.direction) {
      case 'up': return '#fee2e2';
      case 'down': return '#d1fae5';
      case 'stable': return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.direction) {
      case 'up': return '#991b1b';
      case 'down': return '#065f46';
      case 'stable': return '#6b7280';
    }
  }};
`;

const TrendsContainer = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const TrendCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    box-shadow: 0 12px 40px rgba(96, 165, 250, 0.1);
    transform: translateY(-4px);
  }
`;

const TrendLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TrendValue = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const TrendNumber = styled.span`
  font-size: 28px;
  font-weight: 900;
  background: ${colors.primary.blue};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TrendIndicator = styled.span<{ direction: 'up' | 'down' | 'stable' }>`
  font-size: 20px;
  filter: drop-shadow(0 0 4px ${props => {
    switch (props.direction) {
      case 'up': return 'rgba(239, 68, 68, 0.4)';
      case 'down': return 'rgba(16, 185, 129, 0.4)';
      case 'stable': return 'rgba(107, 114, 128, 0.4)';
    }
  }});
`;

const AlertBadge = styled.span<{ severity: 'ok' | 'warning' | 'critical' }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: ${props => {
    switch (props.severity) {
      case 'critical': return '#fee2e2';
      case 'warning': return '#fef3c7';
      default: return '#d1fae5';
    }
  }};
  color: ${props => {
    switch (props.severity) {
      case 'critical': return '#991b1b';
      case 'warning': return '#92400e';
      default: return '#065f46';
    }
  }};
`;

const ActivityTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  
  thead {
    background: rgba(96, 165, 250, 0.1);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }
  
  th {
    padding: 14px 16px;
    text-align: left;
    font-weight: 700;
    color: #cbd5e1;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    font-size: 13px;
    color: #cbd5e1;
  }
  
  tr:hover {
    background: rgba(96, 165, 250, 0.05);
    transition: background 0.2s ease;
  }
`;

const StatusBadge = styled.span<{ status: 'success' | 'error' | 'warning' }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: ${props => {
    switch (props.status) {
      case 'error': return 'rgba(239, 68, 68, 0.15)';
      case 'warning': return 'rgba(245, 158, 11, 0.15)';
      default: return 'rgba(16, 185, 129, 0.15)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'error': return '#991b1b';
      case 'warning': return '#92400e';
      default: return '#065f46';
    }
  }};
`;

const HostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const HostCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const HostName = styled.h4`
  color: #000000;
  font-size: 14px;
  margin: 0 0 12px 0;
  font-weight: 700;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const MetricLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const MetricValue = styled.span<{ severity?: 'ok' | 'warning' | 'critical' }>`
  color: ${props => {
    switch (props.severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  }};
  font-weight: 700;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #9ca3af;
  font-size: 14px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #9ca3af;
  gap: 12px;
  grid-column: 1 / -1;
`;

const ChartContainer = styled.div`
  grid-column: 1 / -1;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

// ============ ANIMATED COUNTER COMPONENT ============

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 500 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [value, duration]);

  return (
    <CounterValue className={isAnimating ? 'update' : ''}>
      {displayValue}
    </CounterValue>
  );
};

// ============ MAIN COMPONENT ============

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'zabbix' | 'alerts' | 'analytics' | 'activity'>('overview');
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [metrics, setMetrics] = useState<ZabbixMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [zabbixConnected, setZabbixConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh intervals (in milliseconds)
  const REFRESH_INTERVALS = {
    overview: 5000,    // 5 seconds for system metrics
    zabbix: 8000,      // 8 seconds for Zabbix hosts
    alerts: 10000,     // 10 seconds for alerts
    analytics: 15000,  // 15 seconds for analytics
    activity: 12000    // 12 seconds for activity logs
  };

  useEffect(() => {
    // Load system metrics on mount
    loadSystemMetrics();
    // Then check Zabbix status
    loadZabbixStatus();
  }, []);

  useEffect(() => {
    if (zabbixConnected) {
      loadZabbixData();
    }
  }, [zabbixConnected]);

  // Auto-refresh system metrics with configurable interval
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadSystemMetrics();
    }, REFRESH_INTERVALS.overview);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled]);

  // Auto-refresh Zabbix data
  useEffect(() => {
    if (!isAutoRefreshEnabled || !zabbixConnected) return;

    const interval = setInterval(() => {
      loadZabbixData();
    }, REFRESH_INTERVALS.zabbix);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, zabbixConnected]);

  // Auto-refresh activity logs when on that tab
  useEffect(() => {
    if (activeTab !== 'activity' || !isAutoRefreshEnabled) return;

    loadActivityLogs();
    const interval = setInterval(() => {
      loadActivityLogs();
    }, REFRESH_INTERVALS.activity);

    return () => clearInterval(interval);
  }, [activeTab, isAutoRefreshEnabled]);

  const loadZabbixStatus = async () => {
    try {
      console.log('🔍 Checking Zabbix status...');
      const response = await fetch(`${API_BASE_URL}/zabbix/status`);
      const result = await response.json();
      console.log('✅ Zabbix Status:', result);
      setZabbixConnected(result.data?.connected || false);
      
      if (result.data?.connected) {
        console.log('✅ Zabbix is connected, loading data...');
        loadZabbixData();
      } else {
        console.warn('⚠️ Zabbix is not connected');
        setError('Zabbix is not connected. Please configure it in the Monitoring page.');
      }
    } catch (error) {
      console.error('❌ Error checking Zabbix status:', error);
      setError(`Error checking Zabbix: ${error}`);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      setIsRefreshing(true);
      console.log('💻 Loading system metrics...');
      const response = await fetch(`${API_BASE_URL}/system/metrics`);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ System metrics loaded:', result.data);
        setSystemMetrics(result.data);
        setLastRefreshTime(new Date());
        // Clear error if system metrics load successfully
        if (!zabbixConnected) {
          setError('');
        }
      }
    } catch (error) {
      console.error('❌ Error loading system metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadZabbixData = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      console.log('📊 Loading Zabbix data...');
      const [hostsRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/zabbix/hosts`),
        fetch(`${API_BASE_URL}/zabbix/metrics`)
      ]);

      const hostsData = await hostsRes.json();
      const metricsData = await metricsRes.json();

      console.log('📋 Hosts Response:', hostsData);
      console.log('📈 Metrics Response:', metricsData);

      if (hostsData.success && hostsData.data) {
        console.log(`✅ Loaded ${hostsData.data.length} hosts`);
        setHosts(hostsData.data);
      }
      
      if (metricsData.success && metricsData.data) {
        console.log(`✅ Loaded ${metricsData.data.length} metrics`);
        setMetrics(metricsData.data);
      }

      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('❌ Error loading Zabbix data:', error);
      setError(`Error loading data: ${error}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadActivityLogs = async () => {
    setActivityLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/logs/recent?limit=20`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setActivityLogs(data.data);
        setLastRefreshTime(new Date());
      }
    } catch (error) {
      console.error('❌ Error loading activity logs:', error);
    } finally {
      setActivityLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    if (activeTab === 'activity') {
      loadActivityLogs();
    } else {
      setLoading(true);
      loadZabbixData();
    }
  };

  const getSeverity = (metric: string, value: number | undefined): 'ok' | 'warning' | 'critical' => {
    if (value === undefined) return 'ok';
    if (metric === 'cpu') {
      if (value >= 90) return 'critical';
      if (value >= 80) return 'warning';
    }
    if (metric === 'memory') {
      if (value >= 95) return 'critical';
      if (value >= 85) return 'warning';
    }
    if (metric === 'disk') {
      if (value >= 90) return 'critical';
      if (value >= 80) return 'warning';
    }
    return 'ok';
  };

  // Calculer le Health Score (0-100%)
  const calculateHealthScore = (cpu: number, memory: number, disk: number, onlineHosts: number, totalHosts: number): number => {
    let score = 100;
    
    // CPU: Max -40 points si >= 90%, -20 si >= 80%
    if (cpu >= 90) score -= 40;
    else if (cpu >= 80) score -= 20;
    else if (cpu >= 70) score -= 10;
    
    // Memory: Max -30 points si >= 95%, -15 si >= 85%
    if (memory >= 95) score -= 30;
    else if (memory >= 85) score -= 15;
    else if (memory >= 75) score -= 8;
    
    // Disk: Max -20 points si >= 90%, -10 si >= 80%
    if (disk >= 90) score -= 20;
    else if (disk >= 80) score -= 10;
    else if (disk >= 70) score -= 5;
    
    // Hosts: -10 points si < 50% online
    const hostsHealthPercent = (onlineHosts / totalHosts) * 100;
    if (hostsHealthPercent < 50) score -= 10;
    else if (hostsHealthPercent < 75) score -= 5;
    
    return Math.max(0, score);
  };

  // Calculer la distribution des statuts des hosts
  const calculateStatusDistribution = (metrics: ZabbixMetrics[]) => {
    let online = 0;
    let warning = 0;
    let offline = 0;

    metrics.forEach(m => {
      const hasIssue = (m.cpu || 0) >= 80 || (m.memory || 0) >= 85 || (m.disk || 0) >= 80;
      if (hasIssue) {
        warning++;
      } else {
        online++;
      }
    });

    // Si pas de data, considérer comme offline
    if (metrics.length === 0) {
      offline = 1;
    }

    return { online, warning, offline };
  };

  // Trouver les top 3 hosts avec les pires métriques
  const getTopProblems = (metrics: ZabbixMetrics[]): ZabbixMetrics[] => {
    return metrics
      .map(m => ({
        ...m,
        maxMetric: Math.max(m.cpu || 0, m.memory || 0, m.disk || 0),
        worstMetric: Math.max(m.cpu || 0, m.memory || 0, m.disk || 0) >= 80
      }))
      .filter(m => m.worstMetric)
      .sort((a, b) => b.maxMetric - a.maxMetric)
      .slice(0, 3)
      .map(({ worstMetric, maxMetric, ...m }) => m);
  };

  // Calculer les tendances des métriques
  const getTrends = (cpu: number, memory: number, disk: number): { cpu: { value: number; trend: 'up' | 'down' | 'stable' }; memory: { value: number; trend: 'up' | 'down' | 'stable' }; disk: { value: number; trend: 'up' | 'down' | 'stable' } } => {
    // Seuils critiques et avertissement
    const cpuTrend: 'up' | 'down' | 'stable' = cpu >= 85 ? 'up' : cpu <= 60 ? 'down' : 'stable';
    const memoryTrend: 'up' | 'down' | 'stable' = memory >= 85 ? 'up' : memory <= 70 ? 'down' : 'stable';
    const diskTrend: 'up' | 'down' | 'stable' = disk >= 85 ? 'up' : disk <= 60 ? 'down' : 'stable';
    
    return {
      cpu: { value: cpu, trend: cpuTrend },
      memory: { value: memory, trend: memoryTrend },
      disk: { value: disk, trend: diskTrend }
    };
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
    }
  };

  // Component du gauge circulaire
  const HealthScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    let color = '#10b981'; // green
    if (score < 50) color = '#ef4444'; // red
    else if (score < 75) color = '#f59e0b'; // orange
    
    return (
      <CircularGaugeWrapper>
        <CircularGauge viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e0e8ff" strokeWidth="4" />
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          
          {/* Center text */}
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill={color}
          >
            {score.toFixed(0)}
          </text>
        </CircularGauge>
      </CircularGaugeWrapper>
    );
  };

  // ============ OVERVIEW TAB ============
  const renderOverview = () => {
    // Use system metrics if available, otherwise use Zabbix metrics
    const avgCpu = metrics.length > 0
      ? (metrics.reduce((sum, m) => sum + (m.cpu || 0), 0) / metrics.length)
      : systemMetrics?.cpu || 0;
    
    const avgMemory = metrics.length > 0
      ? (metrics.reduce((sum, m) => sum + (m.memory || 0), 0) / metrics.length)
      : systemMetrics?.memory || 0;
    
    const avgDisk = metrics.length > 0
      ? (metrics.reduce((sum, m) => sum + (m.disk || 0), 0) / metrics.length)
      : systemMetrics?.disk || 0;

    const onlineHosts = hosts.filter(h => h.status === 0).length || 1;
    const totalHosts = hosts.length > 0 ? hosts.length : 1;
    const healthScore = calculateHealthScore(avgCpu, avgMemory, avgDisk, onlineHosts, totalHosts);

    return (
      <Content>
        <HealthScoreContainer>
          <HealthScoreGauge score={healthScore} />
          <HealthScoreContent>
            <HealthTitle>
              💚 Santé Système Global
            </HealthTitle>
            <HealthMetricsGrid>
              <HealthMetricItem severity={getSeverity('cpu', avgCpu)}>
                CPU: {avgCpu.toFixed(1)}%
              </HealthMetricItem>
              <HealthMetricItem severity={getSeverity('memory', avgMemory)}>
                Mémoire: {avgMemory.toFixed(1)}%
              </HealthMetricItem>
              <HealthMetricItem severity={getSeverity('disk', avgDisk)}>
                Disque: {avgDisk.toFixed(1)}%
              </HealthMetricItem>
              <HealthMetricItem severity={onlineHosts === totalHosts ? 'ok' : onlineHosts / totalHosts > 0.75 ? 'warning' : 'critical'}>
                Hosts: {onlineHosts}/{totalHosts} online
              </HealthMetricItem>
              <HealthMetricItem severity="ok">
                Score: {healthScore.toFixed(0)}/100
              </HealthMetricItem>
            </HealthMetricsGrid>
          </HealthScoreContent>
        </HealthScoreContainer>

        {(() => {
          const distribution = calculateStatusDistribution(metrics);
          const total = distribution.online + distribution.warning + distribution.offline;
          const onlinePercent = total > 0 ? ((distribution.online / total) * 100).toFixed(0) : 0;
          const warningPercent = total > 0 ? ((distribution.warning / total) * 100).toFixed(0) : 0;
          const offlinePercent = total > 0 ? ((distribution.offline / total) * 100).toFixed(0) : 0;
          
          return (
            <StatusDistributionGrid>
              <StatusCard type="online">
                <StatusNumber type="online">
                  <AnimatedCounter value={distribution.online} duration={400} />
                </StatusNumber>
                <StatusLabel>🟢 En ligne</StatusLabel>
                <StatusPercent type="online">
                  {onlinePercent}%
                </StatusPercent>
              </StatusCard>

              <StatusCard type="warning">
                <StatusNumber type="warning">
                  <AnimatedCounter value={distribution.warning} duration={400} />
                </StatusNumber>
                <StatusLabel>🟡 Avertissements</StatusLabel>
                <StatusPercent type="warning">
                  {warningPercent}%
                </StatusPercent>
              </StatusCard>

              <StatusCard type="offline">
                <StatusNumber type="offline">
                  <AnimatedCounter value={distribution.offline} duration={400} />
                </StatusNumber>
                <StatusLabel>🔴 Hors ligne</StatusLabel>
                <StatusPercent type="offline">
                  {offlinePercent}%
                </StatusPercent>
              </StatusCard>
            </StatusDistributionGrid>
          );
        })()}

        {getTopProblems(metrics).length > 0 && (
          <TopProblemsContainer>
            <TopProblemsTitle>🚨 Top 3 Problèmes</TopProblemsTitle>
            <ProblemsGrid>
              {getTopProblems(metrics).map((metric, idx) => {
                const maxValue = Math.max(metric.cpu || 0, metric.memory || 0, metric.disk || 0);
                const severity = maxValue >= 90 ? 'critical' : 'warning';
                
                return (
                  <ProblemItem key={idx} severity={severity}>
                    <ProblemHostName>{metric.hostName}</ProblemHostName>
                    <ProblemMetrics>
                      {(metric.cpu || 0) >= 80 && (
                        <ProblemMetricLine value={metric.cpu || 0}>
                          🔥 CPU: {(metric.cpu || 0).toFixed(1)}%
                        </ProblemMetricLine>
                      )}
                      {(metric.memory || 0) >= 85 && (
                        <ProblemMetricLine value={metric.memory || 0}>
                          💾 Mém: {(metric.memory || 0).toFixed(1)}%
                        </ProblemMetricLine>
                      )}
                      {(metric.disk || 0) >= 80 && (
                        <ProblemMetricLine value={metric.disk || 0}>
                          💿 Disq: {(metric.disk || 0).toFixed(1)}%
                        </ProblemMetricLine>
                      )}
                    </ProblemMetrics>
                  </ProblemItem>
                );
              })}
            </ProblemsGrid>
          </TopProblemsContainer>
        )}

        <TrendsContainer>
          {(() => {
            const trends = getTrends(avgCpu, avgMemory, avgDisk);
            return (
              <>
                <TrendCard>
                  <TrendLabel>CPU Trend</TrendLabel>
                  <TrendValue>
                    <TrendNumber>{avgCpu.toFixed(1)}%</TrendNumber>
                    <TrendBadge direction={trends.cpu.trend}>
                      <TrendIndicator direction={trends.cpu.trend}>{getTrendIcon(trends.cpu.trend)}</TrendIndicator>
                    </TrendBadge>
                  </TrendValue>
                </TrendCard>

                <TrendCard>
                  <TrendLabel>Memory Trend</TrendLabel>
                  <TrendValue>
                    <TrendNumber>{avgMemory.toFixed(1)}%</TrendNumber>
                    <TrendBadge direction={trends.memory.trend}>
                      <TrendIndicator direction={trends.memory.trend}>{getTrendIcon(trends.memory.trend)}</TrendIndicator>
                    </TrendBadge>
                  </TrendValue>
                </TrendCard>

                <TrendCard>
                  <TrendLabel>Disk Trend</TrendLabel>
                  <TrendValue>
                    <TrendNumber>{avgDisk.toFixed(1)}%</TrendNumber>
                    <TrendBadge direction={trends.disk.trend}>
                      <TrendIndicator direction={trends.disk.trend}>{getTrendIcon(trends.disk.trend)}</TrendIndicator>
                    </TrendBadge>
                  </TrendValue>
                </TrendCard>
              </>
            );
          })()}
        </TrendsContainer>

        <Card>
          <CardTitle>
            <Server size={18} /> Total Hosts
          </CardTitle>
          <CardValue>
            <AnimatedCounter value={hosts.length > 0 ? hosts.length : 1} duration={400} />
          </CardValue>
          <CardSubtext>
            <AnimatedCounter value={onlineHosts} duration={400} /> online
          </CardSubtext>
        </Card>

        <Card>
          <CardTitle>
            <Zap size={18} /> Avg CPU Usage
          </CardTitle>
          <CardValue>{avgCpu.toFixed(1)}%</CardValue>
          <ProgressBar value={avgCpu} />
        </Card>

        <Card>
          <CardTitle>
            <HardDrive size={18} /> Avg Memory Usage
          </CardTitle>
          <CardValue>{avgMemory.toFixed(1)}%</CardValue>
          <ProgressBar value={avgMemory} />
      </Card>

        <Card>
          <CardTitle>
            <Database size={18} /> Avg Disk Usage
          </CardTitle>
          <CardValue>{avgDisk.toFixed(1)}%</CardValue>
          <ProgressBar value={avgDisk} />
        </Card>

        <Card>
          <CardTitle>
            <AlertTriangle size={18} /> Critical Alerts
          </CardTitle>
          <CardValue>
            <AnimatedCounter 
              value={metrics.filter(m => (m.cpu || 0) >= 90 || (m.memory || 0) >= 95 || (m.disk || 0) >= 90).length}
              duration={300}
            />
          </CardValue>
          <CardSubtext>Hosts with critical metrics</CardSubtext>
        </Card>

        <Card>
          <CardTitle>
            <Activity size={18} /> Warning Alerts
          </CardTitle>
          <CardValue>
            <AnimatedCounter
              value={metrics.filter(m => ((m.cpu || 0) >= 80 && (m.cpu || 0) < 90) || ((m.memory || 0) >= 85 && (m.memory || 0) < 95) || ((m.disk || 0) >= 80 && (m.disk || 0) < 90)).length}
              duration={300}
            />
          </CardValue>
          <CardSubtext>Hosts with warning metrics</CardSubtext>
        </Card>
      </Content>
    );
  };
  const renderZabbix = () => {
    if (!zabbixConnected) {
      return (
        <EmptyState>
          <AlertTriangle size={40} />
          <div>Zabbix not connected</div>
          <div style={{ fontSize: '12px' }}>Go to Monitoring page to configure Zabbix</div>
        </EmptyState>
      );
    }

    if (loading) {
      return <LoadingSpinner>Loading Zabbix data...</LoadingSpinner>;
    }

    if (metrics.length === 0) {
      return (
        <EmptyState>
          <Server size={40} />
          <div>No hosts available</div>
        </EmptyState>
      );
    }

    return (
      <HostGrid>
        {metrics.map(metric => (
          <HostCard key={metric.hostId}>
            <HostName>{metric.hostName}</HostName>

            {metric.cpu !== undefined && (
              <MetricRow>
                <MetricLabel>🔥 CPU</MetricLabel>
                <MetricValue severity={getSeverity('cpu', metric.cpu)}>
                  {metric.cpu.toFixed(1)}%
                </MetricValue>
              </MetricRow>
            )}

            {metric.memory !== undefined && (
              <MetricRow>
                <MetricLabel>💾 Memory</MetricLabel>
                <MetricValue severity={getSeverity('memory', metric.memory)}>
                  {metric.memory.toFixed(1)}%
                </MetricValue>
              </MetricRow>
            )}

            {metric.disk !== undefined && (
              <MetricRow>
                <MetricLabel>💿 Disk</MetricLabel>
                <MetricValue severity={getSeverity('disk', metric.disk)}>
                  {metric.disk.toFixed(1)}%
                </MetricValue>
              </MetricRow>
            )}

            {metric.uptime !== undefined && (
              <MetricRow>
                <MetricLabel>⏱️ Uptime</MetricLabel>
                <MetricValue>{(metric.uptime / 86400).toFixed(1)} days</MetricValue>
              </MetricRow>
            )}
          </HostCard>
        ))}
      </HostGrid>
    );
  };

  // ============ ALERTS TAB ============
  const renderAlerts = () => {
    const criticalHosts = metrics.filter(m => (m.cpu || 0) >= 90 || (m.memory || 0) >= 95 || (m.disk || 0) >= 90);
    const warningHosts = metrics.filter(m => ((m.cpu || 0) >= 80 && (m.cpu || 0) < 90) || ((m.memory || 0) >= 85 && (m.memory || 0) < 95) || ((m.disk || 0) >= 80 && (m.disk || 0) < 90));
    
    const totalAlerts = criticalHosts.length + warningHosts.length;
    const allHosts = metrics.length;
    const resolvedAlerts = Math.max(0, allHosts - totalAlerts);

    return (
      <Content>
        {/* Statistics Cards */}
        <AlertsStatsGrid>
          <AlertStatCard type="critical">
            <AlertStatLabel>🚨 Critical Alerts</AlertStatLabel>
            <AlertStatValue type="critical">
              <AnimatedCounter value={criticalHosts.length} duration={400} />
            </AlertStatValue>
          </AlertStatCard>

          <AlertStatCard type="warning">
            <AlertStatLabel>⚠️ Warning Alerts</AlertStatLabel>
            <AlertStatValue type="warning">
              <AnimatedCounter value={warningHosts.length} duration={400} />
            </AlertStatValue>
          </AlertStatCard>

          <AlertStatCard type="resolved">
            <AlertStatLabel>✅ Healthy Hosts</AlertStatLabel>
            <AlertStatValue type="resolved">
              <AnimatedCounter value={resolvedAlerts} duration={400} />
            </AlertStatValue>
          </AlertStatCard>
        </AlertsStatsGrid>

        {/* Critical Alerts */}
        {criticalHosts.length > 0 && (
          <>
            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
              <CardTitle style={{ color: '#991b1b', fontSize: '14px' }}>
                🔴 Critical Issues
              </CardTitle>
            </div>
            <AlertsContainer>
              {criticalHosts.map((host) => {
                const metricsWarnings = [];
                if ((host.cpu || 0) >= 90) metricsWarnings.push({ label: '🔥 CPU', value: host.cpu });
                if ((host.memory || 0) >= 95) metricsWarnings.push({ label: '💾 Memory', value: host.memory });
                if ((host.disk || 0) >= 90) metricsWarnings.push({ label: '💿 Disk', value: host.disk });

                return (
                  <AlertItemCard key={host.hostId} severity="critical">
                    <AlertHeader>
                      <AlertHostName>{host.hostName}</AlertHostName>
                      <AlertSeverityBadge severity="critical">Critical</AlertSeverityBadge>
                    </AlertHeader>
                    
                    <AlertMetrics>
                      {metricsWarnings.map((metric, idx) => (
                        <AlertMetricItem key={idx} severity="critical">
                          <AlertMetricLabel>{metric.label}</AlertMetricLabel>
                          <AlertMetricValue severity="critical">
                            {metric.value?.toFixed(1)}%
                          </AlertMetricValue>
                        </AlertMetricItem>
                      ))}
                    </AlertMetrics>
                    
                    <AlertTimestamp>
                      ⏰ Updated just now
                    </AlertTimestamp>
                  </AlertItemCard>
                );
              })}
            </AlertsContainer>
          </>
        )}

        {/* Warning Alerts */}
        {warningHosts.length > 0 && (
          <>
            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
              <CardTitle style={{ color: '#92400e', fontSize: '14px' }}>
                🟡 Warnings
              </CardTitle>
            </div>
            <AlertsContainer>
              {warningHosts.map((host) => {
                const metricsWarnings = [];
                if ((host.cpu || 0) >= 80 && (host.cpu || 0) < 90) metricsWarnings.push({ label: '🔥 CPU', value: host.cpu });
                if ((host.memory || 0) >= 85 && (host.memory || 0) < 95) metricsWarnings.push({ label: '💾 Memory', value: host.memory });
                if ((host.disk || 0) >= 80 && (host.disk || 0) < 90) metricsWarnings.push({ label: '💿 Disk', value: host.disk });

                return (
                  <AlertItemCard key={host.hostId} severity="warning">
                    <AlertHeader>
                      <AlertHostName>{host.hostName}</AlertHostName>
                      <AlertSeverityBadge severity="warning">Warning</AlertSeverityBadge>
                    </AlertHeader>
                    
                    <AlertMetrics>
                      {metricsWarnings.map((metric, idx) => (
                        <AlertMetricItem key={idx} severity="warning">
                          <AlertMetricLabel>{metric.label}</AlertMetricLabel>
                          <AlertMetricValue severity="warning">
                            {metric.value?.toFixed(1)}%
                          </AlertMetricValue>
                        </AlertMetricItem>
                      ))}
                    </AlertMetrics>
                    
                    <AlertTimestamp>
                      ⏰ Updated just now
                    </AlertTimestamp>
                  </AlertItemCard>
                );
              })}
            </AlertsContainer>
          </>
        )}

        {/* No Alerts State */}
        {totalAlerts === 0 && (
          <NoAlertsState>
            <div>✅</div>
            <div>All Systems Healthy</div>
            <div>No critical or warning alerts detected</div>
          </NoAlertsState>
        )}
      </Content>
    );
  };

  // Generate 24h time series data
  const generate24HoursData = (): TimeSeriesData[] => {
    const data: TimeSeriesData[] = [];
    const now = new Date();
    
    // Generate data for every hour in the last 24 hours
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = time.getHours();
      
      // Simulate realistic usage patterns
      // Higher CPU/Memory usage during business hours (8-18)
      const businessMultiplier = hour >= 8 && hour <= 18 ? 1.3 : 0.7;
      
      // Add some variation to make it realistic
      const cpuNoise = Math.sin(hour / 6) * 15 + Math.random() * 10;
      const memoryNoise = Math.cos(hour / 8) * 12 + Math.random() * 8;
      const diskNoise = Math.random() * 3;
      
      data.push({
        time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        cpu: Math.max(10, Math.min(95, 35 + cpuNoise * businessMultiplier)),
        memory: Math.max(15, Math.min(90, 45 + memoryNoise * businessMultiplier)),
        disk: Math.max(20, Math.min(92, 55 + diskNoise)),
        timestamp: time.getTime(),
      });
    }
    
    return data;
  };

  // ============ ANALYTICS TAB ============
  const renderAnalytics = () => {
    const timeSeriesData = generate24HoursData();

    return (
      <Content>
        {/* CPU Usage over 24h */}
        <ChartContainer>
          <CardTitle>
            <TrendingUp size={18} /> 🔥 CPU Usage - Last 24 Hours
          </CardTitle>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={timeSeriesData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8ff" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: '% Usage', angle: -90, position: 'insideLeft', offset: 10 }}
                stroke="#9ca3af"
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any) => [`${value?.toFixed(1)}%`, 'CPU']}
                labelFormatter={(label) => `⏰ ${label}`}
                cursor={{ stroke: '#ef4444', strokeWidth: 2 }}
              />
              <Line 
                type="monotone"
                dataKey="cpu" 
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6, fill: '#dc2626' }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Memory Usage over 24h */}
        <ChartContainer>
          <CardTitle>
            <TrendingUp size={18} /> 💾 Memory Usage - Last 24 Hours
          </CardTitle>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={timeSeriesData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8ff" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: '% Usage', angle: -90, position: 'insideLeft', offset: 10 }}
                stroke="#9ca3af"
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any) => [`${value?.toFixed(1)}%`, 'Memory']}
                labelFormatter={(label) => `⏰ ${label}`}
                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone"
                dataKey="memory" 
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6, fill: '#1d4ed8' }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Disk Usage over 24h */}
        <ChartContainer>
          <CardTitle>
            <TrendingUp size={18} /> 💿 Disk Usage - Last 24 Hours
          </CardTitle>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={timeSeriesData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8ff" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: '% Usage', angle: -90, position: 'insideLeft', offset: 10 }}
                stroke="#9ca3af"
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any) => [`${value?.toFixed(1)}%`, 'Disk']}
                labelFormatter={(label) => `⏰ ${label}`}
                cursor={{ stroke: '#f59e0b', strokeWidth: 2 }}
              />
              <Line 
                type="monotone"
                dataKey="disk" 
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6, fill: '#d97706' }}
                isAnimationActive={true}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Combined View */}
        <ChartContainer>
          <CardTitle>
            <TrendingUp size={18} /> 📊 All Metrics - Last 24 Hours
          </CardTitle>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart 
              data={timeSeriesData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e8ff" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: '% Usage', angle: -90, position: 'insideLeft', offset: 10 }}
                stroke="#9ca3af"
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any) => `${value?.toFixed(1)}%`}
                labelFormatter={(label) => `⏰ ${label}`}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="line"
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Line 
                type="monotone"
                dataKey="cpu" 
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={500}
                name="CPU"
              />
              <Line 
                type="monotone"
                dataKey="memory" 
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={500}
                name="Memory"
              />
              <Line 
                type="monotone"
                dataKey="disk" 
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={500}
                name="Disk"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Content>
    );
  };

  const renderActivity = () => {
    if (activityLoading) {
      return <LoadingSpinner>Chargement des logs...</LoadingSpinner>;
    }

    if (activityLogs.length === 0) {
      return (
        <EmptyState>
          <FileText size={40} />
          <div>Aucun log d'activité</div>
        </EmptyState>
      );
    }

    return (
      <Content>
        <ActivityTable>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Ressource</th>
              <th>Statut</th>
              <th>IP</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {activityLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontWeight: 600, color: '#0066ff' }}>{log.username}</td>
                <td>
                  <span style={{ 
                    background: '#f0f4ff',
                    color: '#0066ff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>
                    {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}
                  </span>
                </td>
                <td>
                  <StatusBadge status={log.status}>
                    {log.status.toUpperCase()}
                  </StatusBadge>
                </td>
                <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {log.ip_address || '-'}
                </td>
                <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </ActivityTable>
      </Content>
    );
  };

  return (
    <Container>
      <Header>
        <Title>
          <Globe size={32} /> Dashboard
        </Title>
        <RefreshControls>
          <AutoRefreshToggle 
            active={isAutoRefreshEnabled}
            onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
            title={isAutoRefreshEnabled ? 'Auto-refresh activé' : 'Auto-refresh désactivé'}
          >
            <RefreshIndicator isRefreshing={isRefreshing} />
            {isAutoRefreshEnabled ? '⏸️ Auto' : '▶️ Manuel'}
          </AutoRefreshToggle>
          {lastRefreshTime && (
            <div style={{ 
              fontSize: '11px', 
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              🕐 {lastRefreshTime.toLocaleTimeString('fr-FR')}
            </div>
          )}
          <RefreshButton 
            onClick={handleManualRefresh}
            disabled={loading || activityLoading || isRefreshing}
            title="Rafraîchir immédiatement"
          >
            {isRefreshing ? '⏳' : '🔄'}
          </RefreshButton>
        </RefreshControls>
      </Header>

      {error && (
        <ErrorBox>
          <strong>⚠️ Erreur:</strong> {error}
        </ErrorBox>
      )}

      {!zabbixConnected && (
        <ErrorBox>
          <strong>⚠️ Attention:</strong> Zabbix n'est pas connecté. Allez à la page <a href="/monitoring" style={{ color: '#ef4444', textDecoration: 'underline' }}>Monitoring</a> pour configurer la connexion.
        </ErrorBox>
      )}

      <TabsContainer>
        <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          <Globe size={16} /> Overview
        </Tab>
        <Tab active={activeTab === 'zabbix'} onClick={() => setActiveTab('zabbix')}>
          <Server size={16} /> Zabbix Hosts
        </Tab>
        <Tab active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>
          <AlertTriangle size={16} /> Alerts
        </Tab>
        <Tab active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={16} /> Analytics
        </Tab>
        <Tab active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
          <Activity size={16} /> Activity
        </Tab>
      </TabsContainer>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'zabbix' && renderZabbix()}
      {activeTab === 'alerts' && renderAlerts()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'activity' && renderActivity()}
    </Container>
  );
};

export default Dashboard;
