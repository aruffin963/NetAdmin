import { Request } from 'express';

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

/**
 * Parse et valide les paramètres de pagination depuis la requête
 */
export function parsePaginationParams(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 25));
  const sortBy = (req.query.sortBy as string) || 'timestamp';
  const sortOrder = ((req.query.sortOrder as string) || 'desc').toLowerCase() as 'asc' | 'desc';

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return {
    page,
    pageSize,
    offset,
    limit,
    sortBy,
    sortOrder,
  };
}

/**
 * Construit la métadonnée de pagination pour la réponse
 */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;
  const hasPrevious = page > 1;

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore,
    hasPrevious,
  };
}

/**
 * Construit une réponse paginée standard
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  message?: string
): PaginatedResponse<T> {
  const pagination = buildPaginationMeta(page, pageSize, total);

  return {
    success: true,
    data,
    pagination,
    ...(message && { message }),
  };
}

/**
 * Construit une clause SQL ORDER BY avec validation
 */
export function buildOrderClause(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  allowedColumns: string[]
): string {
  // Valider que la colonne est dans la liste autorisée
  const column = allowedColumns.includes(sortBy) ? sortBy : allowedColumns[0];
  const order = sortOrder.toUpperCase();

  return `ORDER BY ${column} ${order}`;
}

/**
 * Construit une clause SQL LIMIT OFFSET
 */
export function buildLimitOffsetClause(limit: number, offset: number): string {
  return `LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Calcule l'offset depuis une page et pageSize
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Calcule le nombre total de pages
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
