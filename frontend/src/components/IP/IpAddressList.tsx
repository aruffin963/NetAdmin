import React, { useState } from 'react';
import styled from 'styled-components';
import { IpAddressTable } from './IpAddressTable';
import { IpAddressForm } from './IpAddressForm';
import { 
  useIpAddresses, 
  useReleaseIpAddress,
  type IpAddress 
} from '../../hooks/useIpApi';

interface IpAddressListProps {
  poolId?: number;
  className?: string;
}

export const IpAddressList: React.FC<IpAddressListProps> = ({ 
  poolId, 
  className 
}) => {
  const [editingAddress, setEditingAddress] = useState<IpAddress | null>(null);
  const [showForm, setShowForm] = useState(false);

  // React Query hooks
  const { 
    data: addresses = [], 
    isLoading, 
    error 
  } = useIpAddresses(poolId);

  const releaseMutation = useReleaseIpAddress();

  // Adaptateur pour convertir les nouvelles données vers l'ancien format
  const adaptAddresses = (newAddresses: IpAddress[]) => {
    return newAddresses.map(addr => ({
      id: addr.id.toString(),
      address: addr.ip_address,
      status: addr.status,
      poolId: addr.pool_id.toString(),
      poolName: addr.pool_name,
      hostname: addr.hostname,
      macAddress: addr.mac_address,
      description: addr.description,
      allocatedTo: addr.allocated_to,
      allocatedAt: addr.allocated_at,
      lastSeen: undefined
    }));
  };

  // Gestion des actions
  const handleEdit = (address: IpAddress) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleRelease = async (addressId: number) => {
    try {
      await releaseMutation.mutateAsync(addressId);
    } catch (error) {
      console.error('Erreur lors de la libération:', error);
      alert('Erreur lors de la libération de l\'adresse IP');
    }
  };

  const handleFormSubmit = async () => {
    try {
      // Pour l'instant, on simplifie en fermant juste le formulaire
      // TODO: Implémenter la mise à jour avec les nouvelles routes
      setShowForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'adresse IP');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  if (error) {
    return (
      <ErrorContainer className={className}>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>Erreur de chargement</ErrorTitle>
        <ErrorMessage>
          Impossible de charger les adresses IP. Veuillez réessayer.
        </ErrorMessage>
        <RetryButton onClick={() => window.location.reload()}>
          Réessayer
        </RetryButton>
      </ErrorContainer>
    );
  }

  return (
    <Container className={className}>
      <Header>
        <HeaderTitle>
          Adresses IP {poolId && `(Pool sélectionné)`}
        </HeaderTitle>
        <HeaderActions>
          <AddButton onClick={() => setShowForm(true)}>
            ➕ Ajouter une adresse
          </AddButton>
        </HeaderActions>
      </Header>

      {showForm && (
        <FormOverlay>
          <FormModal>
            <FormHeader>
              <FormTitle>
                {editingAddress ? 'Modifier l\'adresse IP' : 'Ajouter une adresse IP'}
              </FormTitle>
              <CloseButton onClick={handleFormCancel}>✕</CloseButton>
            </FormHeader>
            <IpAddressForm
              initialData={editingAddress || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={false}
            />
          </FormModal>
        </FormOverlay>
      )}

      <TableContainer>
        <IpAddressTable
          addresses={adaptAddresses(addresses)}
          onEdit={(addr) => {
            const originalAddr = addresses.find(a => a.id.toString() === addr.id);
            if (originalAddr) handleEdit(originalAddr);
          }}
          onRelease={(addressId) => handleRelease(parseInt(addressId))}
          isLoading={isLoading || releaseMutation.isPending}
        />
      </TableContainer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const HeaderTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const AddButton = styled.button`
  padding: 10px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }
`;

const TableContainer = styled.div`
  flex: 1;
`;

const FormOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const FormModal = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e1e1e1;
`;

const FormTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #1a1a1a;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #fecaca;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #dc2626;
  margin: 0 0 8px 0;
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
`;

const RetryButton = styled.button`
  padding: 10px 20px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #b91c1c;
  }
`;

export default IpAddressList;