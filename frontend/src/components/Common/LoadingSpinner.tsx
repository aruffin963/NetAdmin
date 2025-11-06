import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div<{ size?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  .spinner {
    width: ${props => props.size || 40}px;
    height: ${props => props.size || 40}px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  .message {
    color: #666;
    font-size: 14px;
    text-align: center;
  }
`;

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Chargement...', 
  size 
}) => {
  return (
    <SpinnerContainer size={size}>
      <div className="spinner" />
      {message && <div className="message">{message}</div>}
    </SpinnerContainer>
  );
};