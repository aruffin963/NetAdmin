import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { SystemLogService } from '../services/systemLogService';
import { logger } from '../utils/logger';
import { isAuthenticatedHybrid } from '../middleware/auth';
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
 * POST /api/system-logs
 * Créer une entrée de log système
 */
router.post(
  '/',
  [
    body('logLevel')
      .isIn(['debug', 'info', 'warn', 'error', 'fatal'])
      .withMessage('Invalid log level'),
    body('logType')
      .isIn(['console', 'application', 'security', 'performance', 'integration'])
      .withMessage('Invalid log type'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('category').optional().trim(),
    body('source').optional().trim(),
    body('stackTrace').optional().trim(),
    body('metadata').optional().isJSON()
  ],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { logLevel, logType, category, message, source, stackTrace, metadata } = req.body;

      // Get user info from session/JWT if available
      const userId = (req as any).user?.id;
      const username = (req as any).user?.username || (req as any).session?.username;
      const ipAddress = req.ip;
      const sessionId = (req as any).session?.id;

      const logId = await SystemLogService.log({
        logLevel,
        logType,
        category,
        message,
        source,
        stackTrace,
        metadata: metadata ? JSON.parse(metadata) : undefined,
        userId,
        username,
        ipAddress,
        sessionId,
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION
      });

      res.status(201).json({
        success: true,
        message: 'Log entry created',
        data: { id: logId }
      });
    } catch (error: any) {
      logger.error('Error creating system log:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating log entry',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/system-logs
 * Récupérer les logs système avec pagination et filtres
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 500 }).toInt(),
    query('logLevel').optional().isIn(['debug', 'info', 'warn', 'error', 'fatal']),
    query('logType').optional().isIn(['console', 'application', 'security', 'performance', 'integration']),
    query('category').optional().trim(),
    query('username').optional().trim(),
    query('search').optional().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sortBy').optional().isIn(['created_at', 'log_level', 'log_type']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const paginationParams = parsePaginationParams(req.query);

      const logsData = await SystemLogService.getLogs({
        limit: paginationParams.pageSize,
        offset: (paginationParams.page - 1) * paginationParams.pageSize,
        logLevel: req.query.logLevel as string,
        logType: req.query.logType as string,
        category: req.query.category as string,
        username: req.query.username as string,
        search: req.query.search as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        sortBy: (req.query.sortBy as string) || 'created_at',
        sortOrder: (req.query.sortOrder as string) || 'desc'
      });

      const response = buildPaginatedResponse(
        logsData.logs,
        paginationParams.page,
        paginationParams.pageSize,
        logsData.total,
        'System logs retrieved successfully'
      );

      res.json(response);
    } catch (error: any) {
      logger.error('Error retrieving system logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving system logs',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/system-logs/recent
 * Récupérer les logs système récents
 */
router.get('/recent/:limit?', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.params.limit || '100'), 500);
    const logs = await SystemLogService.getRecentLogs(limit);

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error: any) {
    logger.error('Error retrieving recent system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recent logs',
      error: error.message
    });
  }
});

/**
 * GET /api/system-logs/stats
 * Récupérer les statistiques des logs système
 */
router.get(
  '/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await SystemLogService.getStats({
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error retrieving system logs stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving stats',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/system-logs/categories
 * Récupérer les catégories disponibles
 */
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await SystemLogService.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    logger.error('Error retrieving system log categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
      error: error.message
    });
  }
});

/**
 * GET /api/system-logs/sources
 * Récupérer les sources disponibles
 */
router.get('/sources', async (req: Request, res: Response): Promise<void> => {
  try {
    const sources = await SystemLogService.getSources();

    res.json({
      success: true,
      data: sources
    });
  } catch (error: any) {
    logger.error('Error retrieving system log sources:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sources',
      error: error.message
    });
  }
});

/**
 * POST /api/system-logs/archive
 * Archiver les vieux logs
 */
router.post(
  '/archive',
  isAuthenticatedHybrid,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const archivedCount = await SystemLogService.archiveOldLogs();

      res.json({
        success: true,
        message: `${archivedCount} logs archived successfully`,
        data: { archived: archivedCount }
      });
    } catch (error: any) {
      logger.error('Error archiving system logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error archiving logs',
        error: error.message
      });
    }
  }
);

/**
 * DELETE /api/system-logs
 * Supprimer les logs selon les critères
 */
router.delete(
  '/',
  isAuthenticatedHybrid,
  [
    query('logLevel').optional().isIn(['debug', 'info', 'warn', 'error', 'fatal']),
    query('logType').optional().isIn(['console', 'application', 'security', 'performance', 'integration']),
    query('daysToKeep').optional().isInt({ min: 1 }).toInt()
  ],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedCount = await SystemLogService.deleteLogs({
        logLevel: req.query.logLevel as string,
        logType: req.query.logType as string,
        daysToKeep: req.query.daysToKeep ? parseInt(req.query.daysToKeep as string) : undefined
      });

      res.json({
        success: true,
        message: `${deletedCount} logs deleted successfully`,
        data: { deleted: deletedCount }
      });
    } catch (error: any) {
      logger.error('Error deleting system logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting logs',
        error: error.message
      });
    }
  }
);

export default router;
