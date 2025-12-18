import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { DatabaseService } from '../config/database';
import { logger } from '../utils/logger';
import { ActivityLogService, LogActions, ResourceTypes } from '../services/activityLogService';

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

// Créer la table alerts si elle n'existe pas
const ensureAlertsTable = async () => {
  try {
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'critical', 'emergency')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        source VARCHAR(100),
        device_id VARCHAR(100),
        device_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
        acknowledged_at TIMESTAMP,
        acknowledged_by VARCHAR(255),
        resolved_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    logger.error('Erreur lors de la création de la table alerts:', error);
  }
};

// Initialiser la table
ensureAlertsTable();

// GET /api/alerts - Liste des alertes
router.get('/', [
  query('level').optional().isIn(['info', 'warning', 'critical', 'emergency']),
  query('status').optional().isIn(['active', 'acknowledged', 'resolved']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { level, status = 'active', limit = 50, offset = 0 } = req.query;

    let whereClause = `WHERE status = $1`;
    const params: any[] = [status];
    let paramIndex = 2;

    if (level) {
      whereClause += ` AND level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }

    const alerts = await DatabaseService.query(`
      SELECT 
        id, level, title, message, source, device_id, device_name,
        status, acknowledged_at, acknowledged_by, resolved_at,
        metadata, created_at, updated_at
      FROM alerts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    const totalCount = await DatabaseService.query(`
      SELECT COUNT(*) as total FROM alerts ${whereClause}
    `, params);

    res.json({
      success: true,
      data: alerts.rows,
      total: parseInt(totalCount.rows[0].total),
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes',
      error: error.message
    });
  }
});

// POST /api/alerts - Créer une alerte
router.post('/', [
  body('level').isIn(['info', 'warning', 'critical', 'emergency']).withMessage('Niveau d\'alerte invalide'),
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Titre requis (max 255 caractères)'),
  body('message').trim().isLength({ min: 1 }).withMessage('Message requis'),
  body('source').optional().isLength({ max: 100 }),
  body('device_id').optional().isLength({ max: 100 }),
  body('device_name').optional().isLength({ max: 255 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { level, title, message, source, device_id, device_name, metadata } = req.body;

    // S'assurer que metadata est correctement sérialisé
    const metadataJson = metadata 
      ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata))
      : '{}';

    const result = await DatabaseService.query(`
      INSERT INTO alerts (level, title, message, source, device_id, device_name, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [level, title, message, source || null, device_id || null, device_name || null, metadataJson]);

    logger.info(`Alerte créée: ${title} (niveau: ${level})`);

    // Log l'action
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.CREATE,
      resourceType: 'ALERT',
      resourceId: String(result.rows[0].id),
      resourceName: title,
      details: {
        level,
        message,
        source,
        device_id,
        device_name
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Alerte créée avec succès',
      data: {
        ...result.rows[0],
        metadata: typeof result.rows[0].metadata === 'string' 
          ? JSON.parse(result.rows[0].metadata) 
          : result.rows[0].metadata || {}
      }
    });

  } catch (error: any) {
    logger.error('Erreur lors de la création de l\'alerte:', error);

    // Log l'erreur
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.CREATE,
      resourceType: 'ALERT',
      resourceName: req.body.title || 'Unknown',
      details: { level: req.body.level, message: req.body.message, source: req.body.source, device_id: req.body.device_id, device_name: req.body.device_name },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'error',
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'alerte',
      error: error.message
    });
  }
});

// POST /api/alerts/:id/acknowledge - Acquitter une alerte
router.post('/:id/acknowledge', [
  param('id').isInt().withMessage('ID d\'alerte invalide'),
  body('acknowledged_by').optional().isLength({ max: 255 })
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { acknowledged_by = 'System' } = req.body;

    const result = await DatabaseService.query(`
      UPDATE alerts 
      SET 
        status = 'acknowledged',
        acknowledged_at = CURRENT_TIMESTAMP,
        acknowledged_by = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'active'
      RETURNING *
    `, [acknowledged_by, id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Alerte non trouvée ou déjà acquittée'
      });
      return;
    }

    logger.info(`Alerte acquittée: ID ${id} par ${acknowledged_by}`);

    // Log l'action
    await ActivityLogService.log({
      username: acknowledged_by,
      action: 'ACKNOWLEDGE',
      resourceType: 'ALERT',
      resourceId: id,
      resourceName: `Alert #${id}`,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Alerte acquittée avec succès',
      data: {
        ...result.rows[0],
        metadata: JSON.parse(result.rows[0].metadata || '{}')
      }
    });

  } catch (error: any) {
    logger.error('Erreur lors de l\'acquittement de l\'alerte:', error);

    // Log l'erreur
    await ActivityLogService.log({
      username: 'anonymous',
      action: 'ACKNOWLEDGE',
      resourceType: 'ALERT',
      resourceId: req.params.id,
      resourceName: `Alert #${req.params.id}`,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'error',
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acquittement de l\'alerte',
      error: error.message
    });
  }
});

// DELETE /api/alerts/:id - Supprimer une alerte
router.delete('/:id', [
  param('id').isInt().withMessage('ID d\'alerte invalide')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(`
      DELETE FROM alerts WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      });
      return;
    }

    logger.info(`Alerte supprimée: ID ${id}`);

    // Log l'action
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.DELETE,
      resourceType: 'ALERT',
      resourceId: String(id),
      resourceName: `Alert #${id}`,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Alerte supprimée avec succès'
    });

  } catch (error: any) {
    logger.error('Erreur lors de la suppression de l\'alerte:', error);

    // Log l'erreur
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.DELETE,
      resourceType: 'ALERT',
      resourceId: String(req.params.id),
      resourceName: `Alert #${req.params.id}`,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'error',
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'alerte',
      error: error.message
    });
  }
});

export default router;