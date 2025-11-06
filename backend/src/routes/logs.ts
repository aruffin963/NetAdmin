import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { ActivityLogService } from '../services/activityLogService';
import { logger } from '../utils/logger';

const router = Router();

// Middleware de validation des erreurs
const handleValidationErrors = (req: Request, res: Response, next: any): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array()
    });
    return;
  }
  next();
};

// GET /api/logs - Liste des activity logs
router.get('/', [
  query('username').optional().isLength({ max: 255 }),
  query('action').optional().isLength({ max: 100 }),
  query('resource_type').optional().isLength({ max: 100 }),
  query('status').optional().isIn(['success', 'error', 'warning']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { 
      username,
      action,
      resource_type,
      status,
      limit = 50, 
      offset = 0,
      start_date,
      end_date 
    } = req.query;

    const result = await ActivityLogService.getLogs({
      username: username as string,
      action: action as string,
      resourceType: resource_type as string,
      status: status as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      startDate: start_date ? new Date(start_date as string) : undefined,
      endDate: end_date ? new Date(end_date as string) : undefined
    });

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs',
      error: error.message
    });
  }
});

// GET /api/logs/recent - Logs récents
router.get('/recent', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const logs = await ActivityLogService.getRecentLogs(limit);

    res.json({
      success: true,
      data: logs
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des logs récents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs récents',
      error: error.message
    });
  }
});

// GET /api/logs/stats - Statistiques des logs
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await ActivityLogService.getStats(days);

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

export default router;