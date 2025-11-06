import React from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationControls } from '../../hooks/usePagination';

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-top: 16px;
  flex-wrap: wrap;
  gap: 16px;
`;

const PaginationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  color: #64748b;
  font-size: 14px;
`;

const LimitSelector = styled.select`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #334155;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
`;

const PaginationControlsStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaginationButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: ${props => props.disabled ? '#f8fafc' : 'white'};
  color: ${props => props.disabled ? '#cbd5e1' : '#64748b'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #60a5fa;
    color: #60a5fa;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PageButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid ${props => props.active ? '#60a5fa' : '#e2e8f0'};
  border-radius: 8px;
  background: ${props => props.active ? '#60a5fa' : 'white'};
  color: ${props => props.active ? 'white' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};

  &:hover:not(:disabled) {
    background: ${props => props.active ? '#3b82f6' : '#f8fafc'};
    border-color: #60a5fa;
    color: ${props => props.active ? 'white' : '#60a5fa'};
  }
`;

const PageNumbers = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

interface PaginationProps {
  controls: PaginationControls;
  showLimitSelector?: boolean;
  limitOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  controls,
  showLimitSelector = true,
  limitOptions = [10, 25, 50, 100]
}) => {
  const { 
    currentPage, 
    totalPages, 
    hasNext, 
    hasPrevious, 
    goToPage, 
    nextPage, 
    previousPage,
    setLimit,
    limit,
    total,
    startIndex,
    endIndex
  } = controls;

  // Calculer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Nombre max de pages à afficher
    
    if (totalPages <= showPages) {
      // Afficher toutes les pages si peu de pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour afficher pages avec ellipses
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <PaginationContainer>
      <PaginationInfo>
        <span>
          Affichage de {startIndex} à {endIndex} sur {total} éléments
        </span>
        {showLimitSelector && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Éléments par page :</span>
            <LimitSelector 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {limitOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </LimitSelector>
          </div>
        )}
      </PaginationInfo>

      <PaginationControlsStyled>
        <PaginationButton 
          onClick={() => goToPage(1)} 
          disabled={!hasPrevious}
          title="Première page"
        >
          <ChevronsLeft />
        </PaginationButton>
        
        <PaginationButton 
          onClick={previousPage} 
          disabled={!hasPrevious}
          title="Page précédente"
        >
          <ChevronLeft />
        </PaginationButton>

        <PageNumbers>
          {getPageNumbers().map((page, index) => (
            <PageButton
              key={index}
              active={page === currentPage}
              onClick={() => typeof page === 'number' ? goToPage(page) : undefined}
              disabled={typeof page === 'string'}
            >
              {page}
            </PageButton>
          ))}
        </PageNumbers>

        <PaginationButton 
          onClick={nextPage} 
          disabled={!hasNext}
          title="Page suivante"
        >
          <ChevronRight />
        </PaginationButton>
        
        <PaginationButton 
          onClick={() => goToPage(totalPages)} 
          disabled={!hasNext}
          title="Dernière page"
        >
          <ChevronsRight />
        </PaginationButton>
      </PaginationControlsStyled>
    </PaginationContainer>
  );
};

export default Pagination;