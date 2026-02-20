import React, { useState } from 'react';
import styled from 'styled-components';
import { AlertTriangle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

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
  z-index: 10000;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const IconContainer = styled.div<{ isDangerous?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  background: ${props => props.isDangerous ? '#fee2e2' : '#fef3c7'};
  color: ${props => props.isDangerous ? '#ef4444' : '#f59e0b'};
`;

const Title = styled.h2`
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
`;

const Message = styled.p`
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' | 'danger'; isLoading?: boolean }>`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  min-width: 100px;

  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) {
            background: #2563eb;
          }
        `;
      case 'secondary':
        return `
          background: #e5e7eb;
          color: #1f2937;
          &:hover:not(:disabled) {
            background: #d1d5db;
          }
        `;
    }
  }};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ConfirmDialog: React.FC = () => {
  const { confirmDialog, closeConfirm } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  if (!confirmDialog) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setIsLoading(false);
      closeConfirm();
    }
  };

  const handleCancel = () => {
    confirmDialog.onCancel?.();
    closeConfirm();
  };

  return (
    <ModalOverlay onClick={handleCancel}>
      <Modal onClick={e => e.stopPropagation()}>
        <IconContainer isDangerous={confirmDialog.isDangerous}>
          <AlertTriangle size={28} />
        </IconContainer>

        <Title>{confirmDialog.title}</Title>
        <Message>{confirmDialog.message}</Message>

        <ButtonContainer>
          <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
            {confirmDialog.cancelText || 'Annuler'}
          </Button>
          <Button
            variant={confirmDialog.isDangerous ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '⏳ ...' : (confirmDialog.confirmText || 'Confirmer')}
          </Button>
        </ButtonContainer>
      </Modal>
    </ModalOverlay>
  );
};
