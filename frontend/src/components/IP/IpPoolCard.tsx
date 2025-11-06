import React from 'react';
import styled from 'styled-components';
import { IpPool } from '../../hooks/useIpApi';

interface IpPoolCardProps {
  pool: IpPool;
  onView?: (poolId: number) => void;
  onEdit?: (poolId: number) => void;
  onDelete?: (poolId: number) => void;
  onScan?: (poolId: number) => void;
  className?: string;
}

export const IpPoolCard: React.FC<IpPoolCardProps> = ({
  pool,
  onView,
  onEdit,
  onDelete,
  onScan,
  className
}) => {
  const getUtilizationPercentage = () => {
    if (!pool.total_addresses || pool.total_addresses === 0) return '0.0';
    return ((pool.allocated_addresses! / pool.total_addresses) * 100).toFixed(1);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return '#4CAF50';
    if (percentage < 80) return '#FF9800';
    return '#f44336';
  };

  const utilizationPercentage = parseFloat(getUtilizationPercentage());

  return (
    <CardContainer className={className} isActive={pool.is_active}>
      <CardHeader>
        <PoolInfo>
          <PoolName>{pool.name}</PoolName>
          {pool.description && (
            <PoolDescription>{pool.description}</PoolDescription>
          )}
        </PoolInfo>
        {/* Badge de type supprimé car plus dans la nouvelle interface */}
      </CardHeader>
      
      <NetworkSection>
        <NetworkLabel>Réseau</NetworkLabel>
        <NetworkValue>{pool.network}</NetworkValue>
        {/* Gateway temporairement désactivé */}
      </NetworkSection>

      <StatsGrid>
        <StatItem>
          <StatLabel>Total</StatLabel>
          <StatValue>{pool.total_addresses?.toLocaleString() || '0'}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Disponibles</StatLabel>
          <StatValue color="#4CAF50">
            {pool.available_addresses?.toLocaleString() || '0'}
          </StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Allouées</StatLabel>
          <StatValue color="#FF9800">
            {pool.allocated_addresses?.toLocaleString() || '0'}
          </StatValue>
        </StatItem>
        {/* Réservées temporairement supprimé */}
      </StatsGrid>

      <UtilizationSection>
        <UtilizationHeader>
          <UtilizationLabel>Utilisation</UtilizationLabel>
          <UtilizationPercent color={getUtilizationColor(utilizationPercentage)}>
            {getUtilizationPercentage()}%
          </UtilizationPercent>
        </UtilizationHeader>
        <UtilizationBar>
          <UtilizationFill 
            percentage={utilizationPercentage}
            color={getUtilizationColor(utilizationPercentage)}
          />
        </UtilizationBar>
      </UtilizationSection>

      {/* Pool inactif temporairement supprimé */}

      <CardActions>
        {onView && (
          <ActionButton
            primary
            onClick={() => onView(pool.id)}
          >
            Voir détails
          </ActionButton>
        )}
        {onScan && (
          <ActionButton 
            onClick={() => onScan(pool.id)}
          >
            🔍 Scanner
          </ActionButton>
        )}
        {onEdit && (
          <ActionButton 
            onClick={() => onEdit(pool.id)}
          >
            ✏️ Modifier
          </ActionButton>
        )}
        {onDelete && (
          <ActionButton 
            danger
            onClick={() => onDelete(pool.id)}
          >
            🗑️ Supprimer
          </ActionButton>
        )}
      </CardActions>
    </CardContainer>
  );
};

// Styled Components
const CardContainer = styled.div<{ isActive: boolean }>`
  background: white;
  border: 1px solid ${props => props.isActive ? '#e1e1e1' : '#f87171'};
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  opacity: ${props => props.isActive ? 1 : 0.8};

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #2563eb;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const PoolInfo = styled.div`
  flex: 1;
`;

const PoolName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px 0;
`;

const PoolDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
`;

// PoolTypeBadge supprimé car plus utilisé avec la nouvelle interface

const NetworkSection = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const NetworkLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
`;

const NetworkValue = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
`;

// Styled components temporairement supprimés pour éviter les warnings

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.color || '#1a1a1a'};
`;

const UtilizationSection = styled.div`
  margin-bottom: 16px;
`;

const UtilizationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const UtilizationLabel = styled.div`
  font-size: 14px;
  color: #374151;
  font-weight: 500;
`;

const UtilizationPercent = styled.div<{ color: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.color};
`;

const UtilizationBar = styled.div`
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
`;

const UtilizationFill = styled.div<{ percentage: number; color: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.color};
  transition: width 0.3s ease;
`;

// InactiveNotice temporairement supprimé

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ primary?: boolean; danger?: boolean }>`
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  border: 1px solid ${props => 
    props.primary ? '#2563eb' : 
    props.danger ? '#ef4444' : '#e1e1e1'
  };
  background: ${props => 
    props.primary ? '#2563eb' : 
    props.danger ? '#ef4444' : 'white'
  };
  color: ${props => 
    props.primary || props.danger ? 'white' : '#666'
  };
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => 
      props.primary ? '#1d4ed8' : 
      props.danger ? '#dc2626' : '#f9f9f9'
    };
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default IpPoolCard;