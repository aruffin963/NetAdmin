import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  margin: 1rem;
  
  .error-icon {
    width: 48px;
    height: 48px;
    background: #e53e3e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    margin-bottom: 1rem;
  }
  
  .error-message {
    color: #e53e3e;
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 0.5rem;
  }
  
  .error-details {
    color: #9b2c2c;
    font-size: 14px;
    text-align: center;
    opacity: 0.8;
  }
`;

interface ErrorMessageProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  details, 
  onRetry 
}) => {
  return (
    <ErrorContainer>
      <div className="error-icon">!</div>
      <div className="error-message">{message}</div>
      {details && <div className="error-details">{details}</div>}
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            marginTop: '1rem',
            padding: '8px 16px',
            background: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
      )}
    </ErrorContainer>
  );
};