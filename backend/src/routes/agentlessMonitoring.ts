import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../config/database';
import { logger } from '../utils/logger';
import MonitoringService, { DeviceConfig, DeviceMetrics } from '../services/monitoringService';
import { ActivityLogService, LogActions, ResourceTypes } from '../services/activityLogService';

const router = Router();

// Middleware de validation
const handleValidationErrors = (req: Request, res: Response, next: any): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Erreurs de validation:', errors.array());
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map((e: any) => ({ 
        field: e.param || e.path, 
        message: e.msg 
      }))
    });
    return;
  }
  next();
};

// Créer les tables si elles n'existent pas
const ensureMonitoringTables = async () => {
  try {
    // Table des configurations d'équipements monitorer (agentless)
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS agentless_monitored_devices (
        id SERIAL PRIMARY KEY,
        device_id UUID UNIQUE,
        ip_address VARCHAR(255) NOT NULL UNIQUE,
        hostname VARCHAR(255),
        device_type VARCHAR(50) DEFAULT 'unknown' CHECK (device_type IN ('linux', 'windows', 'network', 'unknown')),
        snmp_enabled BOOLEAN DEFAULT false,
        snmp_version VARCHAR(3) DEFAULT '2c',
        snmp_community VARCHAR(255) DEFAULT 'public',
        ssh_enabled BOOLEAN DEFAULT false,
        ssh_user VARCHAR(255),
        ssh_password VARCHAR(255),
        ssh_key TEXT,
        ssh_port INTEGER DEFAULT 22,
        wmi_enabled BOOLEAN DEFAULT false,
        monitoring_enabled BOOLEAN DEFAULT true,
        last_check TIMESTAMP,
        status VARCHAR(20) DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'unknown')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des métriques collectées (agentless)
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS agentless_device_metrics (
        id SERIAL PRIMARY KEY,
        monitored_device_id INTEGER REFERENCES agentless_monitored_devices(id) ON DELETE CASCADE,
        hostname VARCHAR(255),
        dns_name VARCHAR(255),
        cpu_usage FLOAT,
        memory_usage BIGINT,
        memory_total BIGINT,
        disk_usage BIGINT,
        disk_total BIGINT,
        uptime BIGINT,
        status VARCHAR(20),
        response_time INTEGER,
        source VARCHAR(50),
        collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ajouter les colonnes manquantes si elles n'existent pas
    try {
      await DatabaseService.query(`
        ALTER TABLE agentless_device_metrics 
        ADD COLUMN IF NOT EXISTS dns_name VARCHAR(255);
      `);
      logger.info('Colonne dns_name vérifiée');
    } catch (e) {
      logger.warn('dns_name déjà existe ou erreur:', (e as Error).message);
    }

    try {
      await DatabaseService.query(`
        ALTER TABLE agentless_device_metrics 
        ADD COLUMN IF NOT EXISTS disk_usage BIGINT;
      `);
      logger.info('Colonne disk_usage vérifiée');
    } catch (e) {
      logger.warn('disk_usage déjà existe ou erreur:', (e as Error).message);
    }

    try {
      await DatabaseService.query(`
        ALTER TABLE agentless_device_metrics 
        ADD COLUMN IF NOT EXISTS disk_total BIGINT;
      `);
      logger.info('Colonne disk_total vérifiée');
    } catch (e) {
      logger.warn('disk_total déjà existe ou erreur:', (e as Error).message);
    }

    // Index pour les requêtes fréquentes
    await DatabaseService.query(`
      CREATE INDEX IF NOT EXISTS idx_agentless_devices_ip ON agentless_monitored_devices(ip_address);
      CREATE INDEX IF NOT EXISTS idx_agentless_metrics_device ON agentless_device_metrics(monitored_device_id);
      CREATE INDEX IF NOT EXISTS idx_agentless_metrics_timestamp ON agentless_device_metrics(collected_at);
    `);

  } catch (error) {
    logger.error('Erreur création tables monitoring:', error);
  }
};

// Initialiser les tables
ensureMonitoringTables();

// GET /agentless/devices - Lister les équipements monitorer
router.get('/devices', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await DatabaseService.query(`
      SELECT 
        id,
        device_id,
        ip_address,
        hostname,
        device_type,
        snmp_enabled,
        ssh_enabled,
        wmi_enabled,
        monitoring_enabled,
        status,
        last_check
      FROM agentless_monitored_devices
      ORDER BY ip_address
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des équipements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// POST /agentless/devices - Ajouter un équipement à monitorer
router.post('/devices', [
  body('ip_address')
    .trim()
    .notEmpty().withMessage('Adresse IP requise'),
  body('hostname').trim().optional({ checkFalsy: true }).isLength({ max: 255 }).withMessage('Hostname invalide'),
  body('device_type').optional().isIn(['linux', 'windows', 'network', 'unknown']).withMessage('Type d\'équipement invalide'),
  body('snmp_community').if(() => false).trim().isLength({ min: 1, max: 255 }).withMessage('SNMP community invalide'),
  body('ssh_user').if(() => false).trim().isLength({ min: 1, max: 255 }).withMessage('SSH user invalide'),
  body('ssh_password').if(() => false).isLength({ min: 0, max: 255 }).withMessage('SSH password invalide'),
  body('ssh_port').if(() => false).isInt({ min: 1, max: 65535 }).withMessage('SSH port invalide')

], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      ip_address, 
      hostname = '',
      device_type = 'unknown',
      snmp_community = 'public',
      ssh_user = '',
      ssh_password = '',
      ssh_port = 22
    } = req.body;

    // Vérifier si l'IP existe déjà
    const existingDevice = await DatabaseService.query(`
      SELECT id FROM agentless_monitored_devices WHERE ip_address = $1
    `, [ip_address]);

    if (existingDevice.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: `L'adresse IP ${ip_address} est déjà monitored`
      });
      return;
    }

    // Détecter le type d'équipement si 'unknown'
    let detected_type = device_type;
    if (device_type === 'unknown') {
      detected_type = await MonitoringService.detectDeviceType(ip_address);
    }

    // Déterminer les paramètres selon le type d'équipement
    let snmp_enabled = false;
    let ssh_enabled = false;
    let snmp_community_val = 'public';
    let ssh_user_val = '';
    let ssh_password_val = '';
    let ssh_port_val = 22;

    if (detected_type === 'network') {
      snmp_enabled = true;
      snmp_community_val = snmp_community || 'public';
    }

    if (detected_type === 'linux') {
      ssh_enabled = true;
      ssh_user_val = ssh_user || 'root';
      ssh_password_val = ssh_password || '';
      ssh_port_val = ssh_port || 22;
    }

    const final_hostname = hostname || ip_address;

    const result = await DatabaseService.query(`
      INSERT INTO agentless_monitored_devices (
        device_id,
        ip_address,
        hostname,
        device_type,
        snmp_enabled,
        snmp_community,
        ssh_enabled,
        ssh_user,
        ssh_password,
        ssh_port,
        wmi_enabled,
        monitoring_enabled
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, false, true
      )
      RETURNING *
    `, [
      ip_address,
      final_hostname,
      detected_type,
      snmp_enabled,
      snmp_community_val,
      ssh_enabled,
      ssh_user_val,
      ssh_password_val,
      ssh_port_val
    ]);

    logger.info(`Équipement ajouté: ${ip_address} (type: ${detected_type})`);

    // Log l'action
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.CREATE,
      resourceType: 'AGENTLESS_DEVICE',
      resourceId: result.rows[0].device_id,
      resourceName: ip_address,
      details: {
        ip_address,
        hostname: final_hostname,
        device_type: detected_type,
        snmp_enabled,
        ssh_enabled
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: `Équipement ${ip_address} ajouté avec succès`,
      data: result.rows[0]
    });
  } catch (error: any) {
    logger.error('Erreur ajout équipement:', error);
    
    // Log l'erreur
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.CREATE,
      resourceType: 'AGENTLESS_DEVICE',
      resourceName: String(req.body.ip_address),
      details: {
        ip_address: String(req.body.ip_address),
        hostname: String(req.body.hostname),
        device_type: String(req.body.device_type)
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'error',
      errorMessage: error.message
    });
    
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        message: 'Cet équipement est déjà monitorer'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// POST /agentless/monitor/:id - Lancer un monitoring immédiat
router.post('/monitor/:id', async (req: Request, res: Response): Promise<void> => {
  let deviceResult: any;
  try {
    const { id } = req.params;

    // Récupérer la configuration de l'équipement
    deviceResult = await DatabaseService.query(`
      SELECT * FROM agentless_monitored_devices WHERE id = $1
    `, [id]);

    if (deviceResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Équipement non trouvé'
      });
      return;
    }

    const device = deviceResult.rows[0];

    // Construire la config
    const config: DeviceConfig = {
      id: device.device_id,
      ip: device.ip_address,
      hostname: device.hostname,
      type: device.device_type,
      snmpEnabled: device.snmp_enabled,
      snmpCommunity: device.snmp_community,
      sshEnabled: device.ssh_enabled,
      sshUser: device.ssh_user,
      sshPassword: device.ssh_password,
      sshPort: device.ssh_port || 22,
      wmiEnabled: device.wmi_enabled
    };

    // Monitorer l'équipement
    const metrics = await MonitoringService.monitorDevice(config);
    logger.info('Métriques collectées:', metrics);

    // Sauvegarder les métriques en base
    await DatabaseService.query(`
      INSERT INTO agentless_device_metrics (
        monitored_device_id,
        hostname,
        dns_name,
        cpu_usage,
        memory_usage,
        memory_total,
        disk_usage,
        disk_total,
        uptime,
        status,
        response_time,
        source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      device.id,
      metrics.hostname,
      metrics.dnsName || null,
      metrics.cpuUsage || null,
      metrics.memoryUsage || null,
      metrics.memoryTotal || null,
      metrics.diskUsage || null,
      metrics.diskTotal || null,
      metrics.uptime || null,
      metrics.status,
      metrics.responseTime,
      metrics.source
    ]);

    // Mettre à jour le status de l'équipement
    await DatabaseService.query(`
      UPDATE agentless_monitored_devices 
      SET status = $1, last_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [metrics.status, id]);

    // Log l'action
    await ActivityLogService.log({
      username: 'anonymous',
      action: 'MONITOR',
      resourceType: 'AGENTLESS_DEVICE',
      resourceId: device.device_id,
      resourceName: device.ip_address,
      details: {
        device_type: device.device_type,
        cpu: metrics.cpuUsage,
        memory: metrics.memoryUsage,
        disk: metrics.diskUsage,
        status: metrics.status,
        source: metrics.source,
        response_time: metrics.responseTime
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Monitoring effectué',
      data: metrics
    });
  } catch (error: any) {
    logger.error('Erreur monitoring:', error);

    // Log l'erreur
    if (deviceResult?.rows?.[0]) {
      const device = deviceResult.rows[0];
      await ActivityLogService.log({
        username: 'anonymous',
        action: 'MONITOR',
        resourceType: 'AGENTLESS_DEVICE',
        resourceId: device.device_id,
        resourceName: device.ip_address,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'error',
        errorMessage: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors du monitoring',
      error: error.message
    });
  }
});

// GET /agentless/metrics/:id - Récupérer les métriques récentes
router.get('/metrics/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { limit = 50, hours = 24 } = req.query;

    const result = await DatabaseService.query(`
      SELECT 
        dm.*,
        md.ip_address,
        md.hostname as device_hostname,
        md.device_type
      FROM agentless_device_metrics dm
      JOIN agentless_monitored_devices md ON dm.monitored_device_id = md.id
      WHERE md.id = $1
        AND dm.collected_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY dm.collected_at DESC
      LIMIT $2
    `, [id, limit]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    logger.error('Erreur récupération métriques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// GET /agentless/metrics/by-ip/:ip - Récupérer les métriques par adresse IP
router.get('/metrics/by-ip/:ip', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip } = req.params;
    const { limit = 50, hours = 24 } = req.query;

    // Chercher l'équipement par IP
    const deviceResult = await DatabaseService.query(`
      SELECT id FROM agentless_monitored_devices WHERE ip_address = $1
    `, [ip]);

    if (deviceResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: `Aucun équipement trouvé avec l'IP: ${ip}`
      });
      return;
    }

    const deviceId = deviceResult.rows[0].id;

    // Récupérer les métriques
    const result = await DatabaseService.query(`
      SELECT 
        dm.*,
        md.ip_address,
        md.hostname as device_hostname,
        md.device_type
      FROM agentless_device_metrics dm
      JOIN agentless_monitored_devices md ON dm.monitored_device_id = md.id
      WHERE md.id = $1
        AND dm.collected_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY dm.collected_at DESC
      LIMIT $2
    `, [deviceId, limit]);

    res.json({
      success: true,
      data: result.rows,
      device: {
        id: deviceId,
        ip_address: ip
      }
    });
  } catch (error: any) {
    logger.error('Erreur récupération métriques par IP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// DELETE /agentless/devices/:id - Arrêter le monitoring
router.delete('/devices/:id', async (req: Request, res: Response): Promise<void> => {
  let checkResult: any;
  try {
    const { id } = req.params;

    checkResult = await DatabaseService.query(`
      SELECT ip_address FROM agentless_monitored_devices WHERE id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Équipement non trouvé'
      });
      return;
    }

    const ip = checkResult.rows[0].ip_address;

    await DatabaseService.query(`
      DELETE FROM agentless_monitored_devices WHERE id = $1
    `, [id]);

    logger.info(`Monitoring arrêté pour ${ip}`);

    // Log l'action
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.DELETE,
      resourceType: 'AGENTLESS_DEVICE',
      resourceId: String(id),
      resourceName: ip,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: `Monitoring arrêté pour ${ip}`
    });
  } catch (error: any) {
    logger.error('Erreur suppression équipement:', error);

    // Log l'erreur
    const ip = checkResult?.rows?.[0]?.ip_address || 'unknown';
    await ActivityLogService.log({
      username: 'anonymous',
      action: LogActions.DELETE,
      resourceType: 'AGENTLESS_DEVICE',
      resourceId: String(req.params.id),
      resourceName: ip,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'error',
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

export default router;
