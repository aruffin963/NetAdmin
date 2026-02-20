import React from 'react';
import styled from 'styled-components';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const NotificationContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;

  @media (max-width: 640px) {
    right: 12px;
    left: 12px;
    max-width: none;
  }
`;

const NotificationItem = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  background: white;
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
    }
  }};
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: slideIn 0.3s ease;
  pointer-events: auto;

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const IconWrapper = styled.div<{ type: 'success' | 'error' | 'warning' | 'info' }>`
  color: ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
    }
  }};
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.div`
  font-weight: 700;
  color: #1f2937;
  font-size: 14px;
`;

const Message = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s;

  &:hover {
    color: #1f2937;
  }
`;

export const NotificationManager: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'info': return <Info size={20} />;
    }
  };

  return (
    <NotificationContainer>
      {notifications.map(notification => (
        <NotificationItem key={notification.id} type={notification.type}>
          <IconWrapper type={notification.type}>
            {getIcon(notification.type)}
          </IconWrapper>
          <Content>
            <Title>{notification.title}</Title>
            {notification.message && <Message>{notification.message}</Message>}
          </Content>
          <CloseButton onClick={() => removeNotification(notification.id)}>
            <X size={16} />
          </CloseButton>
        </NotificationItem>
      ))}
    </NotificationContainer>
  );
};
