import { Router, Request, Response } from 'express';
import ZabbixService from '../services/zabbixService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Routes pour l'intégration Zabbix
 */

/**
 * GET /api/zabbix/status
 * Obtenir l'état de la connexion Zabbix
 */
router.get('/status', (req: Request, res: Response) => {
  const status = ZabbixService.getStatus();
  res.json({
    success: true,
    data: status,
  });
});

/**
 * POST /api/zabbix/connect
 * Initier la connexion à Zabbix
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    logger.info('Attempting Zabbix connection...');
    const isConnected = await ZabbixService.authenticate();
    
    if (isConnected) {
      res.json({
        success: true,
        message: '✅ Zabbix connection successful',
        data: ZabbixService.getStatus(),
      });
    } else {
      res.status(401).json({
        success: false,
        message: '❌ Zabbix authentication failed',
        data: ZabbixService.getStatus(),
      });
    }
  } catch (error) {
    logger.error('Zabbix connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Connection error',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/zabbix/disconnect
 * Déconnecter Zabbix
 */
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const isLoggedOut = await ZabbixService.logout();
    res.json({
      success: isLoggedOut,
      message: isLoggedOut ? '✅ Zabbix disconnected' : '❌ Disconnect failed',
      data: ZabbixService.getStatus(),
    });
  } catch (error) {
    logger.error('Zabbix disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Disconnect error',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/zabbix/hosts
 * Récupérer tous les hôtes Zabbix
 */
router.get('/hosts', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ZabbixService.isConnected()) {
      res.status(401).json({
        success: false,
        message: 'Zabbix not connected',
      });
    }

    const hosts = await ZabbixService.getHosts();
    res.json({
      success: true,
      data: hosts,
      count: hosts.length,
    });
  } catch (error) {
    logger.error('Error fetching Zabbix hosts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hosts',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/zabbix/metrics
 * Récupérer les métriques de tous les hôtes
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    if (!ZabbixService.isConnected()) {
      res.status(401).json({
        success: false,
        message: 'Zabbix not connected',
      });
    }

    const metrics = await ZabbixService.getAllMetrics();
    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    logger.error('Error fetching Zabbix metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/zabbix/host/:hostid/metrics
 * Récupérer les métriques d'un hôte spécifique
 */
router.get('/host/:hostid/metrics', async (req: Request, res: Response) => {
  try {
    if (!ZabbixService.isConnected()) {
      res.status(401).json({
        success: false,
        message: 'Zabbix not connected',
      });
    }

    const { hostid } = req.params;
    const metrics = await ZabbixService.parseHostMetrics(hostid, `Host ${hostid}`);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error(`Error fetching metrics for host ${req.params.hostid}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching host metrics',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/zabbix/host/:hostid/items
 * Récupérer les items (métriques) d'un hôte
 */
router.get('/host/:hostid/items', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ZabbixService.isConnected()) {
      res.status(401).json({
        success: false,
        message: 'Zabbix not connected',
      });
    }

    const { hostid } = req.params;
    const items = await ZabbixService.getHostItems(hostid);
    
    res.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    logger.error(`Error fetching items for host ${req.params.hostid}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching host items',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/zabbix/item/:itemid/history
 * Récupérer l'historique d'une métrique
 */
router.get('/item/:itemid/history', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ZabbixService.isConnected()) {
      res.status(401).json({
        success: false,
        message: 'Zabbix not connected',
      });
    }

    const { itemid } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const history = await ZabbixService.getItemHistory(itemid, limit);
    
    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    logger.error(`Error fetching history for item ${req.params.itemid}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item history',
      error: (error as Error).message,
    });
  }
});

export default router;
