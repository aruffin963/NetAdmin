import React from 'react';
import styled from 'styled-components';
import { NetworkDevice } from '../../types/monitoring';

interface DeleteDeviceModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const ModalOverlay = styled.div`
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
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 500px;
  margin: 20px;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: white;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WarningIcon = styled.div`
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const DeviceInfo = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
`;

const DeviceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DeviceLabel = styled.span`
  font-weight: 500;
  color: #475569;
`;

const DeviceValue = styled.span`
  color: #1e293b;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'online': return '#dcfce7';
      case 'offline': return '#fee2e2';
      case 'warning': return '#fef3c7';
      case 'critical': return '#fecaca';
      case 'maintenance': return '#e0e7ff';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'online': return '#166534';
      case 'offline': return '#991b1b';
      case 'warning': return '#92400e';
      case 'critical': return '#b91c1c';
      case 'maintenance': return '#3730a3';
      default: return '#475569';
    }
  }};
`;

const WarningMessage = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  color: #92400e;
`;

const WarningTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WarningList = styled.ul`
  margin: 8px 0 0 0;
  padding-left: 20px;
`;

const WarningListItem = styled.li`
  margin-bottom: 4px;
`;

const ModalFooter = styled.div`
  background: #f8fafc;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant: 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;

  ${props => props.variant === 'secondary' ? `
    background: white;
    color: #475569;
    border: 1px solid #d1d5db;

    &:hover {
      background: #f8fafc;
      border-color: #9ca3af;
    }
  ` : `
    background: #dc2626;
    color: white;

    &:hover {
      background: #b91c1c;
    }

    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `}
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const DeleteDeviceModal: React.FC<DeleteDeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  if (!isOpen || !device) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'offline': return 'Hors ligne';
      case 'warning': return 'Avertissement';
      case 'critical': return 'Critique';
      case 'maintenance': return 'Maintenance';
      default: return 'Inconnu';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'router': return 'Routeur';
      case 'switch': return 'Commutateur';
      case 'firewall': return 'Pare-feu';
      case 'server': return 'Serveur';
      case 'printer': return 'Imprimante';
      case 'access_point': return 'Point d\'accès';
      default: return type;
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            <WarningIcon>⚠️</WarningIcon>
            Supprimer l'équipement
          </ModalTitle>
        </ModalHeader>

        <ModalBody>
          <p>
            Êtes-vous sûr de vouloir supprimer cet équipement ? 
            Cette action est <strong>irréversible</strong>.
          </p>

          <DeviceInfo>
            <DeviceRow>
              <DeviceLabel>Nom :</DeviceLabel>
              <DeviceValue>{device.name}</DeviceValue>
            </DeviceRow>
            <DeviceRow>
              <DeviceLabel>Adresse IP :</DeviceLabel>
              <DeviceValue>{device.ipAddress}</DeviceValue>
            </DeviceRow>
            <DeviceRow>
              <DeviceLabel>Type :</DeviceLabel>
              <DeviceValue>{getTypeLabel(device.type)}</DeviceValue>
            </DeviceRow>
            <DeviceRow>
              <DeviceLabel>Localisation :</DeviceLabel>
              <DeviceValue>{device.location}</DeviceValue>
            </DeviceRow>
            <DeviceRow>
              <DeviceLabel>Statut :</DeviceLabel>
              <StatusBadge status={device.status}>
                {getStatusLabel(device.status)}
              </StatusBadge>
            </DeviceRow>
            {device.description && (
              <DeviceRow>
                <DeviceLabel>Description :</DeviceLabel>
                <DeviceValue>{device.description}</DeviceValue>
              </DeviceRow>
            )}
          </DeviceInfo>

          <WarningMessage>
            <WarningTitle>
              ⚠️ Attention
            </WarningTitle>
            <p>La suppression de cet équipement entraînera :</p>
            <WarningList>
              <WarningListItem>La perte de toutes les métriques historiques</WarningListItem>
              <WarningListItem>La suppression de toutes les alertes associées</WarningListItem>
              <WarningListItem>L'arrêt de la surveillance de cet équipement</WarningListItem>
              <WarningListItem>La mise à jour des statistiques du dashboard</WarningListItem>
            </WarningList>
          </WarningMessage>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <LoadingSpinner />
                Suppression...
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};