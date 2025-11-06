import React, { Suspense, lazy, ComponentType } from 'react';
import styled from 'styled-components';

// Composant de chargement pour les pages
const PageLoadingContainer = styled.div`
  width: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 16px;
  padding: 48px 24px;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-left: 4px solid #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingTitle = styled.h2`
  margin: 24px 0 8px 0;
  color: #334155;
  font-size: 24px;
  font-weight: 600;
`;

const LoadingText = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 16px;
  text-align: center;
  max-width: 400px;
  line-height: 1.5;
`;

interface PageLoadingFallbackProps {
  title?: string;
  description?: string;
}

const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({ 
  title = "Chargement de la page...",
  description = "Préparation des composants et récupération des données"
}) => (
  <PageLoadingContainer>
    <LoadingSpinner />
    <LoadingTitle>{title}</LoadingTitle>
    <LoadingText>{description}</LoadingText>
  </PageLoadingContainer>
);

// HOC pour wrapper les pages avec lazy loading
export function withLazyLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackProps?: PageLoadingFallbackProps
) {
  const LazyComponent = lazy(importFn);
  
  const WrappedComponent: React.FC<React.ComponentProps<T>> = (props) => (
    <Suspense fallback={<PageLoadingFallback {...fallbackProps} />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return WrappedComponent;
}

export default PageLoadingFallback;