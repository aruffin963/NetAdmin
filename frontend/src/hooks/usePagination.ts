import { useState, useMemo } from 'react';

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

export interface PaginationControls {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  limit: number;
  total: number;
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>(
  data: T[],
  initialLimit: number = 25
): [T[], PaginationControls] {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  }, [data, page, limit]);

  const totalPages = Math.ceil(data.length / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, data.length);

  const controls: PaginationControls = {
    currentPage: page,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
    goToPage: (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    nextPage: () => {
      if (page < totalPages) {
        setPage(page + 1);
      }
    },
    previousPage: () => {
      if (page > 1) {
        setPage(page - 1);
      }
    },
    setLimit: (newLimit: number) => {
      setLimit(newLimit);
      setPage(1); // Reset to first page when changing limit
    },
    limit,
    total: data.length,
    startIndex,
    endIndex
  };

  return [paginatedData, controls];
}