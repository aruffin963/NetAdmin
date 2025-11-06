import React from 'react';
import styled from 'styled-components';

// Types pour les adresses IP
interface IpAddress {
  id: string;
  address: string;
  status: 'available' | 'allocated' | 'reserved' | 'blocked';
  poolId: string;
  poolName?: string;
  hostname?: string;
  macAddress?: string;
  description?: string;
  allocatedTo?: string;
  allocatedAt?: Date;
  lastSeen?: Date;
}

interface IpAddressTableProps {
  addresses: IpAddress[];
  onEdit?: (address: IpAddress) => void;
  onDelete?: (addressId: string) => void;
  onRelease?: (addressId: string) => void;
  onReserve?: (addressId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const IpAddressTable: React.FC<IpAddressTableProps> = ({
  addresses,
  onEdit,
  onDelete,
  onRelease,
  onReserve,
  isLoading = false,
  className
}) => {
  const getStatusColor = (status: IpAddress['status']) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'allocated': return '#FF9800';
      case 'reserved': return '#9C27B0';
      case 'blocked': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: IpAddress['status']) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'allocated': return 'Allouée';
      case 'reserved': return 'Réservée';
      case 'blocked': return 'Bloquée';
      default: return status;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <LoadingContainer className={className}>
        <LoadingSpinner />
        <LoadingText>Chargement des adresses IP...</LoadingText>
      </LoadingContainer>
    );
  }

  if (addresses.length === 0) {
    return (
      <EmptyContainer className={className}>
        <EmptyIcon>📭</EmptyIcon>
        <EmptyTitle>Aucune adresse IP</EmptyTitle>
        <EmptyText>Aucune adresse IP trouvée dans ce pool</EmptyText>
      </EmptyContainer>
    );
  }

  return (
    <TableContainer className={className}>
      <Table>
        <TableHeader>
          <HeaderRow>
            <HeaderCell>Adresse IP</HeaderCell>
            <HeaderCell>Statut</HeaderCell>
            <HeaderCell>Nom d'hôte</HeaderCell>
            <HeaderCell>MAC</HeaderCell>
            <HeaderCell>Attribué à</HeaderCell>
            <HeaderCell>Pool</HeaderCell>
            <HeaderCell>Dernière vue</HeaderCell>
            <HeaderCell>Actions</HeaderCell>
          </HeaderRow>
        </TableHeader>
        <TableBody>
          {addresses.map((address) => (
            <TableRow key={address.id}>
              <TableCell>
                <IpAddressCell>{address.address}</IpAddressCell>
              </TableCell>
              <TableCell>
                <StatusBadge color={getStatusColor(address.status)}>
                  {getStatusLabel(address.status)}
                </StatusBadge>
              </TableCell>
              <TableCell>
                {address.hostname ? (
                  <HostnameCell>{address.hostname}</HostnameCell>
                ) : (
                  <EmptyValue>-</EmptyValue>
                )}
              </TableCell>
              <TableCell>
                {address.macAddress ? (
                  <MacAddressCell>{address.macAddress}</MacAddressCell>
                ) : (
                  <EmptyValue>-</EmptyValue>
                )}
              </TableCell>
              <TableCell>
                {address.allocatedTo ? (
                  <AllocatedToCell>{address.allocatedTo}</AllocatedToCell>
                ) : (
                  <EmptyValue>-</EmptyValue>
                )}
              </TableCell>
              <TableCell>
                <PoolCell>{address.poolName || 'Pool inconnu'}</PoolCell>
              </TableCell>
              <TableCell>
                <DateCell>{formatDate(address.lastSeen)}</DateCell>
              </TableCell>
              <TableCell>
                <ActionsCell>
                  {onEdit && (
                    <ActionButton
                      onClick={() => onEdit(address)}
                      title="Modifier"
                    >
                      ✏️
                    </ActionButton>
                  )}
                  {onRelease && address.status === 'allocated' && (
                    <ActionButton
                      onClick={() => onRelease(address.id)}
                      title="Libérer"
                    >
                      🔓
                    </ActionButton>
                  )}
                  {onReserve && address.status === 'available' && (
                    <ActionButton
                      onClick={() => onReserve(address.id)}
                      title="Réserver"
                    >
                      🔒
                    </ActionButton>
                  )}
                  {onDelete && (
                    <ActionButton
                      danger
                      onClick={() => onDelete(address.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </ActionButton>
                  )}
                </ActionsCell>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Styled Components
const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e1e1e1;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
`;

const HeaderRow = styled.tr`
  border-bottom: 1px solid #e1e1e1;
`;

const HeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  vertical-align: middle;
`;

const IpAddressCell = styled.span`
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1a1a1a;
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 4px 8px;
  background: ${props => props.color};
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

const HostnameCell = styled.span`
  color: #2563eb;
  font-weight: 500;
`;

const MacAddressCell = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
`;

const AllocatedToCell = styled.span`
  color: #374151;
`;

const PoolCell = styled.span`
  color: #666;
  font-size: 13px;
`;

const DateCell = styled.span`
  color: #666;
  font-size: 12px;
`;

const EmptyValue = styled.span`
  color: #9ca3af;
  font-style: italic;
`;

const ActionsCell = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 4px 6px;
  border: none;
  background: ${props => props.danger ? '#fee2e2' : '#f3f4f6'};
  color: ${props => props.danger ? '#dc2626' : '#374151'};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.danger ? '#fecaca' : '#e5e7eb'};
    transform: scale(1.05);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e1e1e1;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 14px;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e1e1e1;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

export default IpAddressTable;