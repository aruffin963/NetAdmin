import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { ActivityLogService } from '../services/activityLogService';
import { logger } from '../utils/logger';
import { 
  parsePaginationParams, 
  buildPaginatedResponse,
  buildOrderClause,
  buildLimitOffsetClause 
} from '../utils/pagination';

const router = Router();

// Middleware de validation des erreurs
const handleValidationErrors = (req: Request, res: Response, next: any): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
    return;
  }
  next();
};

/**
 * GET /api/logs
 * Lista de activity logs con filtros avanzados y pagination standardisée
 * Query params:
 *   - page: number (1-based)
 *   - pageSize: number (1-100, default 25)
 *   - sortBy: timestamp|action|resource_type (default: timestamp)
 *   - sortOrder: asc|desc (default: desc)
 *   - search: string
 *   - username: string
 *   - action: string
 *   - resource_type: string
 *   - status: success|error|warning|info|debug
 *   - start_date: ISO8601
 *   - end_date: ISO8601
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ max: 255 }),
  query('username').optional().isLength({ max: 255 }),
  query('action').optional().isLength({ max: 100 }),
  query('resource_type').optional().isLength({ max: 100 }),
  query('status').optional().isIn(['success', 'error', 'warning', 'info', 'debug']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('sortBy').optional().isIn(['timestamp', 'action', 'resource_type']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    // Parse standardized pagination params
    const paginationParams = parsePaginationParams(req);

    const { 
      search,
      username,
      action,
      resource_type,
      status,
      start_date,
      end_date,
    } = req.query;

    const result = await ActivityLogService.getLogs({
      search: search as string,
      username: username as string,
      action: action as string,
      resourceType: resource_type as string,
      status: status as string,
      limit: paginationParams.limit,
      offset: paginationParams.offset,
      startDate: start_date ? new Date(start_date as string) : undefined,
      endDate: end_date ? new Date(end_date as string) : undefined,
      sortBy: paginationParams.sortBy,
      sortOrder: paginationParams.sortOrder
    });

    // Build standardized paginated response
    const response = buildPaginatedResponse(
      result.logs,
      paginationParams.page,
      paginationParams.pageSize,
      result.total,
      'Logs retrieved successfully'
    );

    res.json(response);
  } catch (error: any) {
    logger.error('Error retrieving logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving logs',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/recent
 * Ultimos logs registrados
 */
router.get('/recent', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const logs = await ActivityLogService.getRecentLogs(limit);

    res.json({
      success: true,
      data: logs
    });

  } catch (error: any) {
    logger.error('Error retrieving recent logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recent logs',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/stats
 * Estadísticas de los logs
 */
router.get('/stats', [
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    const stats = await ActivityLogService.getStats({
      startDate: start_date ? new Date(start_date as string) : undefined,
      endDate: end_date ? new Date(end_date as string) : undefined
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('Error retrieving statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/categories
 * Lista de categorías disponibles
 */
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await ActivityLogService.getCategories();

    res.json({
      success: true,
      data: categories
    });

  } catch (error: any) {
    logger.error('Error retrieving categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/sources
 * Lista de fuentes disponibles
 */
router.get('/sources', async (req: Request, res: Response): Promise<void> => {
  try {
    const sources = await ActivityLogService.getSources();

    res.json({
      success: true,
      data: sources
    });

  } catch (error: any) {
    logger.error('Error retrieving sources:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sources',
      error: error.message
    });
  }
});

/**
 * GET /api/logs/export
 * Exportar logs en CSV
 */
router.get('/export', [
  query('search').optional().isLength({ max: 255 }),
  query('status').optional().isIn(['success', 'error', 'warning', 'info', 'debug']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      status,
      start_date,
      end_date,
      sort_by = 'timestamp',
      sort_order = 'desc'
    } = req.query;

    const result = await ActivityLogService.getLogs({
      search: search as string,
      status: status as string,
      startDate: start_date ? new Date(start_date as string) : undefined,
      endDate: end_date ? new Date(end_date as string) : undefined,
      limit: 10000,
      offset: 0,
      sortBy: sort_by as string,
      sortOrder: sort_order as string
    });

    // Generar CSV
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Source', 'Username', 'Device', 'Details'];
    const csvContent = [
      headers.join(','),
      ...result.logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.level || '',
        log.category || '',
        `"${(log.message || '').replace(/"/g, '""')}"`,
        log.source || '',
        log.username || '',
        log.deviceName || '',
        `"${(log.details || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment;filename=logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (error: any) {
    logger.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting logs',
      error: error.message
    });
  }
});

/**
 * POST /api/logs/archive
 * Archivar logs antiguos
 */
router.post('/archive', [
  body('days').isInt({ min: 1, max: 365 })
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { days } = req.body;
    
    const result = await ActivityLogService.archiveLogs(days);

    res.json({
      success: true,
      message: 'Logs archived successfully',
      archived: result
    });

  } catch (error: any) {
    logger.error('Error archiving logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving logs',
      error: error.message
    });
  }
});

/**
 * POST /api/logs/delete
 * Eliminar logs según filtros
 */
router.post('/delete', [
  body('status').optional().isIn(['success', 'error', 'warning']),
  body('days').optional().isInt({ min: 1, max: 365 })
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, days } = req.body;
    
    const result = await ActivityLogService.deleteLogs({
      status,
      days
    });

    res.json({
      success: true,
      message: 'Logs deleted successfully',
      deleted: result
    });

  } catch (error: any) {
    logger.error('Error deleting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting logs',
      error: error.message
    });
  }
});

export default router;