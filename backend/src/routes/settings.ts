import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { isAuthenticatedHybrid } from '../middleware/auth';
import UserSettingsService from '../services/userSettingsService';
import { logger } from '../utils/logger';

const router = Router();

// Initialize table
UserSettingsService.initializeTable().catch(err => logger.error('Failed to initialize user_settings:', err));

/**
 * GET /api/settings
 * Get current user's settings
 */
router.get('/', isAuthenticatedHybrid, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).jwtPayload?.userId || (req.user as any).id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const settings = await UserSettingsService.getOrCreateSettings(userId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/settings
 * Create or update user settings
 */
router.post('/', [
  isAuthenticatedHybrid,
  body('language').optional().isString(),
  body('dateFormat').optional().isString(),
  body('timeFormat').optional().isString(),
  body('timezone').optional().isString(),
  body('logRetention').optional().isInt({ min: 1, max: 365 }),
  body('scanInterval').optional().isInt({ min: 5, max: 1440 }),
  body('exportFormat').optional().isString(),
  body('autoBackup').optional().isBoolean(),
  body('zabbixUrl').optional().isString(),
  body('zabbixKey').optional().isString(),
  body('webhookUrl').optional().isString(),
  body('sessionTimeout').optional().isInt({ min: 5, max: 1440 }),
  body('trustDevices').optional().isBoolean(),
  body('enableCache').optional().isBoolean(),
  body('cacheTTL').optional().isInt({ min: 60, max: 86400 }),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
    return;
  }

  try {
    const userId = (req as any).jwtPayload?.userId || (req.user as any).id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const updated = await UserSettingsService.updateSettings(userId, req.body);

    res.json({
      success: true,
      message: 'Paramètres sauvegardés',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/settings/test-zabbix
 * Test Zabbix connection
 */
router.post('/test-zabbix', [
  isAuthenticatedHybrid,
  body('zabbixUrl').notEmpty().isString(),
  body('zabbixKey').notEmpty().isString(),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
    return;
  }

  try {
    const { zabbixUrl, zabbixKey } = req.body;
    const result = await UserSettingsService.testZabbixConnection(zabbixUrl, zabbixKey);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    logger.error('Error testing Zabbix:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/settings/test-webhook
 * Test webhook
 */
router.post('/test-webhook', [
  isAuthenticatedHybrid,
  body('webhookUrl').notEmpty().isString(),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
    return;
  }

  try {
    const { webhookUrl } = req.body;
    const result = await UserSettingsService.testWebhook(webhookUrl);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    logger.error('Error testing webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/settings/clear-cache
 * Clear cache
 */
router.post('/clear-cache', isAuthenticatedHybrid, async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implement cache clearing logic
    logger.info('Cache cleared by user');

    res.json({
      success: true,
      message: 'Cache vidé avec succès'
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
