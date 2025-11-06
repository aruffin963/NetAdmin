import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { NetworkScanService } from '../services/networkScanService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/network/scan
 * Scanner un sous-réseau complet
 */
router.post('/scan',
  [
    body('network').notEmpty().withMessage('Network CIDR is required')
      .matches(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/)
      .withMessage('Invalid CIDR notation (e.g., 192.168.1.0/24)')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
      return;
    }

    try {
      const { network } = req.body;
      logger.info(`Network scan requested for: ${network}`);

      const results = await NetworkScanService.scanSubnet(network);
      
      const onlineCount = results.filter(r => r.status === 'online').length;
      
      res.json({
        success: true,
        data: {
          network,
          total: results.length,
          online: onlineCount,
          offline: results.length - onlineCount,
          hosts: results
        },
        message: `Scan completed: ${onlineCount}/${results.length} hosts online`
      });
    } catch (error) {
      logger.error('Network scan error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Network scan failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/network/ping
 * Ping une adresse IP unique
 */
router.post('/ping',
  [
    body('ip').notEmpty().withMessage('IP address is required')
      .matches(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
      .withMessage('Invalid IP address format')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
      return;
    }

    try {
      const { ip } = req.body;
      logger.info(`Ping requested for: ${ip}`);

      const result = await NetworkScanService.pingHost(ip);
      
      res.json({
        success: true,
        data: result,
        message: result.status === 'online' 
          ? `Host ${ip} is online (${result.responseTime}ms)` 
          : `Host ${ip} is offline`
      });
    } catch (error) {
      logger.error('Ping error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Ping failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/network/scan-list
 * Scanner une liste spécifique d'adresses IP
 */
router.post('/scan-list',
  [
    body('ips').isArray({ min: 1 }).withMessage('IPs array is required'),
    body('ips.*').matches(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
      .withMessage('Invalid IP address format in list')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
      return;
    }

    try {
      const { ips } = req.body;
      logger.info(`Scanning ${ips.length} specific IPs`);

      const results = await NetworkScanService.scanIPList(ips);
      
      const onlineCount = results.filter(r => r.status === 'online').length;
      
      res.json({
        success: true,
        data: {
          total: results.length,
          online: onlineCount,
          offline: results.length - onlineCount,
          hosts: results
        },
        message: `Scan completed: ${onlineCount}/${results.length} hosts online`
      });
    } catch (error) {
      logger.error('IP list scan error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Scan failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

export default router;
