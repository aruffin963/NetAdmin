import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { DatabaseService } from '../config/database';
import { logger } from '../utils/logger';
import { SystemMonitoringService } from '../services/systemMonitoringService';

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

// Créer les tables de monitoring si elles n'existent pas
const ensureMonitoringTables = async () => {
  try {
    // Table des métriques système
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id SERIAL PRIMARY KEY,
        metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('cpu', 'memory', 'disk', 'network', 'bandwidth')),
        value FLOAT NOT NULL,
        unit VARCHAR(20) NOT NULL,
        host VARCHAR(255) DEFAULT 'localhost',
        interface_name VARCHAR(50),
        additional_data JSONB DEFAULT '{}',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des dispositifs surveillés
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS monitored_devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        ip_address INET NOT NULL UNIQUE,
        device_type VARCHAR(50) DEFAULT 'server' CHECK (device_type IN ('server', 'router', 'switch', 'firewall', 'other')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'warning', 'critical')),
        last_ping TIMESTAMP,
        response_time FLOAT,
        uptime_percentage FLOAT DEFAULT 100.0,
        monitoring_enabled BOOLEAN DEFAULT true,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des alertes de monitoring
    await DatabaseService.query(`
      CREATE TABLE IF NOT EXISTS monitoring_alerts (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES monitored_devices(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
        message TEXT NOT NULL,
        threshold_value FLOAT,
        current_value FLOAT,
        acknowledged BOOLEAN DEFAULT false,
        acknowledged_by VARCHAR(255),
        acknowledged_at TIMESTAMP,
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Tables de monitoring créées ou vérifiées');
  } catch (error) {
    logger.error('Erreur lors de la création des tables de monitoring:', error);
  }
};

// Initialiser les tables
ensureMonitoringTables();

// Fonction de génération de métriques simulées
const generateMetrics = (): any[] => {
  const now = new Date();
  const metrics = [];
  
  // CPU
  metrics.push({
    metric_type: 'cpu',
    value: Math.random() * 100,
    unit: 'percent',
    host: 'localhost',
    interface_name: null,
    additional_data: {}
  });
  
  // Mémoire
  metrics.push({
    metric_type: 'memory',
    value: Math.random() * 100,
    unit: 'percent',
    host: 'localhost',
    interface_name: null,
    additional_data: {}
  });
  
  // Disque
  metrics.push({
    metric_type: 'disk',
    value: Math.random() * 100,
    unit: 'percent',
    host: 'localhost',
    interface_name: null,
    additional_data: { partition: '/dev/sda1' }
  });
  
  // Réseau - Download
  metrics.push({
    metric_type: 'network',
    value: Math.random() * 1000,
    unit: 'mbps',
    host: 'localhost',
    interface_name: 'eth0',
    additional_data: { direction: 'download' }
  });
  
  // Réseau - Upload
  metrics.push({
    metric_type: 'network',
    value: Math.random() * 500,
    unit: 'mbps',
    host: 'localhost',
    interface_name: 'eth0',
    additional_data: { direction: 'upload' }
  });
  
  return metrics;
};

// GET /api/monitoring/metrics/current - Métriques système actuelles
router.get('/metrics/current', async (req: Request, res: Response): Promise<void> => {
  try {
    // Générer et insérer de nouvelles métriques
    const metrics = generateMetrics();
    
    for (const metric of metrics) {
      await DatabaseService.query(`
        INSERT INTO system_metrics (metric_type, value, unit, host, interface_name, additional_data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        metric.metric_type,
        metric.value,
        metric.unit,
        metric.host,
        metric.interface_name,
        JSON.stringify(metric.additional_data)
      ]);
    }

    // Récupérer les métriques les plus récentes de chaque type
    const currentMetrics = await DatabaseService.query(`
      SELECT DISTINCT ON (metric_type, interface_name) 
        metric_type, value, unit, host, interface_name, additional_data, recorded_at
      FROM system_metrics
      WHERE recorded_at >= NOW() - INTERVAL '5 minutes'
      ORDER BY metric_type, interface_name, recorded_at DESC
    `);

    res.json({
      success: true,
      data: currentMetrics.rows.map(metric => ({
        ...metric,
        additional_data: typeof metric.additional_data === 'string' 
          ? JSON.parse(metric.additional_data) 
          : metric.additional_data || {}
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des métriques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques',
      error: error.message
    });
  }
});

// GET /api/monitoring/metrics/history - Historique des métriques
router.get('/metrics/history', [
  query('metric_type').optional().isIn(['cpu', 'memory', 'disk', 'network', 'bandwidth']),
  query('hours').optional().isInt({ min: 1, max: 168 }),
  query('host').optional().isLength({ min: 1, max: 255 })
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { metric_type, hours = 24, host = 'localhost' } = req.query;

    let query = `
      SELECT metric_type, value, unit, host, interface_name, additional_data, recorded_at
      FROM system_metrics
      WHERE host = $1 AND recorded_at >= NOW() - INTERVAL '${hours} hours'
    `;
    const params = [host];

    if (metric_type) {
      query += ` AND metric_type = $2`;
      params.push(metric_type as string);
    }

    query += ` ORDER BY recorded_at DESC LIMIT 1000`;

    const result = await DatabaseService.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(metric => ({
        ...metric,
        additional_data: typeof metric.additional_data === 'string' 
          ? JSON.parse(metric.additional_data) 
          : metric.additional_data || {}
      })),
      timeRange: `${hours} heures`
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
});

// GET /api/monitoring/devices - Liste des dispositifs surveillés
router.get('/devices', async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await DatabaseService.query(`
      SELECT * FROM monitored_devices ORDER BY name
    `);

    res.json({
      success: true,
      data: devices.rows.map(device => ({
        ...device,
        settings: typeof device.settings === 'string' 
          ? JSON.parse(device.settings) 
          : device.settings || {}
      }))
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des dispositifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dispositifs',
      error: error.message
    });
  }
});

// POST /api/monitoring/devices - Ajouter un dispositif à surveiller
router.post('/devices', [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Nom requis'),
  body('ip_address').isIP().withMessage('Adresse IP valide requise'),
  body('device_type').optional().isIn(['server', 'router', 'switch', 'firewall', 'other'])
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, ip_address, device_type = 'server', settings = {} } = req.body;

    // S'assurer que settings est correctement sérialisé
    const settingsJson = typeof settings === 'string' ? settings : JSON.stringify(settings);

    const result = await DatabaseService.query(`
      INSERT INTO monitored_devices (name, ip_address, device_type, settings)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, ip_address, device_type, settingsJson]);

    res.status(201).json({
      success: true,
      message: 'Dispositif ajouté avec succès',
      data: {
        ...result.rows[0],
        settings: typeof result.rows[0].settings === 'string' 
          ? JSON.parse(result.rows[0].settings) 
          : result.rows[0].settings || {}
      }
    });

  } catch (error: any) {
    logger.error('Erreur lors de l\'ajout du dispositif:', error);
    if (error.code === '23505') { // Contrainte d'unicité
      res.status(400).json({
        success: false,
        message: 'Un dispositif avec cette adresse IP existe déjà'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du dispositif',
        error: error.message
      });
    }
  }
});

// PUT /api/monitoring/devices/:id - Mettre à jour un dispositif
router.put('/devices/:id', [
  param('id').isInt().withMessage('ID invalide'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('device_type').optional().isIn(['server', 'router', 'switch', 'firewall', 'other']),
  body('monitoring_enabled').optional().isBoolean()
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    const allowedFields = ['name', 'device_type', 'monitoring_enabled', 'settings'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        if (field === 'settings') {
          updateValues.push(JSON.stringify(req.body[field]));
        } else {
          updateValues.push(req.body[field]);
        }
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
      return;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const result = await DatabaseService.query(`
      UPDATE monitored_devices 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Dispositif non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Dispositif mis à jour avec succès',
      data: {
        ...result.rows[0],
        settings: typeof result.rows[0].settings === 'string' 
          ? JSON.parse(result.rows[0].settings) 
          : result.rows[0].settings || {}
      }
    });

  } catch (error: any) {
    logger.error('Erreur lors de la mise à jour du dispositif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du dispositif',
      error: error.message
    });
  }
});

// DELETE /api/monitoring/devices/:id - Supprimer un dispositif
router.delete('/devices/:id', [
  param('id').isInt().withMessage('ID invalide')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(`
      DELETE FROM monitored_devices WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Dispositif non trouvé'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Dispositif supprimé avec succès'
    });

  } catch (error: any) {
    logger.error('Erreur lors de la suppression du dispositif:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du dispositif',
      error: error.message
    });
  }
});

// GET /api/monitoring/topology - Récupérer la topologie complète du réseau
router.get('/topology', async (req: Request, res: Response): Promise<void> => {
  try {
    // Récupérer tous les devices des scans récents
    const devicesResult = await DatabaseService.query(`
      SELECT DISTINCT ON (ip_address) 
        ip_address::text as id,
        hostname as name,
        hostname,
        ip_address::text as ip,
        mac_address as mac,
        CASE 
          WHEN vendor LIKE '%Router%' OR vendor LIKE '%Cisco%' THEN 'router'
          WHEN vendor LIKE '%Switch%' THEN 'switch'
          WHEN vendor LIKE '%Firewall%' THEN 'firewall'
          WHEN vendor LIKE '%Server%' OR hostname LIKE '%srv%' THEN 'server'
          WHEN vendor LIKE '%Workstation%' OR hostname LIKE '%ws%' THEN 'workstation'
          WHEN vendor LIKE '%Access Point%' OR vendor LIKE '%AP%' THEN 'access_point'
          WHEN vendor LIKE '%Printer%' THEN 'printer'
          ELSE 'unknown'
        END as type,
        CASE 
          WHEN status = 'online' THEN 'online'
          WHEN status = 'offline' THEN 'offline'
          WHEN response_time > 100 THEN 'warning'
          ELSE 'online'
        END as status,
        vendor,
        created_at as discovered_at,
        created_at as last_seen,
        '[]'::jsonb as ports,
        scan_id as location
      FROM scan_results 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY ip_address, created_at DESC
    `);

    // Pour les connexions, on peut simuler ou utiliser les données de scan
    // Pour l'instant, créons des connexions basiques basées sur les sous-réseaux
    const devices = devicesResult.rows;
    const connections: any[] = [];

    // Créer des connexions entre devices du même sous-réseau
    for (let i = 0; i < devices.length - 1; i++) {
      const device1 = devices[i];
      const device2 = devices[i + 1];
      
      // Vérifier s'ils sont dans le même sous-réseau (même 3 premiers octets)
      const subnet1 = device1.ip.split('.').slice(0, 3).join('.');
      const subnet2 = device2.ip.split('.').slice(0, 3).join('.');
      
      if (subnet1 === subnet2) {
        connections.push({
          id: `${device1.id}-${device2.id}`,
          sourceDeviceId: device1.id,
          targetDeviceId: device2.id,
          type: 'ethernet',
          bandwidth: 1000,
          status: 'active',
          latency: Math.floor(Math.random() * 10) + 1
        });
      }
    }

    // Récupérer les subnets
    const subnetsResult = await DatabaseService.query(`
      SELECT 
        network || '/' || cidr as id,
        network,
        name,
        COUNT(DISTINCT sr.ip_address) as device_count
      FROM subnets s
      LEFT JOIN scan_results sr ON sr.ip_address::text LIKE s.network || '%'
      WHERE sr.created_at > NOW() - INTERVAL '24 hours' OR sr.created_at IS NULL
      GROUP BY s.id, s.network, s.name, s.cidr
    `);

    // Calculer les statistiques
    const statistics = {
      totalDevices: devices.length,
      activeConnections: connections.filter(c => c.status === 'active').length,
      networkSegments: subnetsResult.rows.length,
      deviceTypes: new Set(devices.map(d => d.type)).size,
      lastDiscovery: devices.length > 0 ? devices[0].discovered_at : null
    };

    res.json({
      devices: devices.map(device => ({
        ...device,
        ports: [],
        discoveredAt: new Date(device.discovered_at),
        lastSeen: new Date(device.last_seen)
      })),
      connections,
      subnets: subnetsResult.rows,
      statistics
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération de la topologie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la topologie',
      error: error.message
    });
  }
});

// GET /api/monitoring/devices/:id - Récupérer les détails d'un device spécifique
router.get('/devices/:id', [
  param('id').notEmpty().withMessage('ID du device requis')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(`
      SELECT 
        ip_address::text as id,
        hostname as name,
        hostname,
        ip_address::text as ip,
        mac_address as mac,
        'unknown' as type,
        status,
        vendor,
        response_time,
        created_at as discovered_at,
        created_at as last_seen,
        '[]'::jsonb as ports,
        scan_id as location
      FROM scan_results 
      WHERE ip_address::text = $1
      ORDER BY created_at DESC 
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Device non trouvé'
      });
      return;
    }

    const device = result.rows[0];
    res.json({
      ...device,
      discoveredAt: new Date(device.discovered_at),
      lastSeen: new Date(device.last_seen)
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération du device:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du device',
      error: error.message
    });
  }
});

// POST /api/monitoring/discover - Déclencher une découverte de réseau
router.post('/discover', [
  body('networks').isArray().withMessage('La liste des réseaux est requise')
], handleValidationErrors, async (req: Request, res: Response): Promise<void> => {
  try {
    const { networks } = req.body;

    // Pour l'instant, on simule le déclenchement d'une découverte
    // Dans une vraie implémentation, cela déclencherait un scan réseau
    logger.info('Découverte réseau déclenchée pour:', networks);

    res.json({
      success: true,
      message: 'Découverte réseau déclenchée',
      networks,
      scheduledAt: new Date()
    });

  } catch (error: any) {
    logger.error('Erreur lors du déclenchement de la découverte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du déclenchement de la découverte',
      error: error.message
    });
  }
});

// GET /api/monitoring/statistics - Récupérer les statistiques de réseau
router.get('/statistics', async (req: Request, res: Response): Promise<void> => {
  try {
    // Récupérer les statistiques depuis les tables
    const devicesCount = await DatabaseService.query(`
      SELECT COUNT(DISTINCT ip_address) as total 
      FROM scan_results 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    const activeDevices = await DatabaseService.query(`
      SELECT COUNT(DISTINCT ip_address) as active 
      FROM scan_results 
      WHERE status = 'online' AND created_at > NOW() - INTERVAL '24 hours'
    `);

    const subnetsCount = await DatabaseService.query(`
      SELECT COUNT(*) as total FROM subnets
    `);

    const deviceTypes = await DatabaseService.query(`
      SELECT COUNT(DISTINCT vendor) as types 
      FROM scan_results 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    const lastDiscovery = await DatabaseService.query(`
      SELECT MAX(created_at) as last_discovery 
      FROM scan_results
    `);

    res.json({
      totalDevices: parseInt(devicesCount.rows[0].total) || 0,
      activeConnections: parseInt(activeDevices.rows[0].active) || 0,
      networkSegments: parseInt(subnetsCount.rows[0].total) || 0,
      deviceTypes: parseInt(deviceTypes.rows[0].types) || 0,
      lastDiscovery: lastDiscovery.rows[0].last_discovery
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

// GET /api/monitoring/system - Métriques système réelles
router.get('/system', async (req: Request, res: Response) => {
  try {
    const metrics = await SystemMonitoringService.getAllMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des métriques système:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques système',
      error: error.message
    });
  }
});

// GET /api/monitoring/system/cpu - Métriques CPU
router.get('/system/cpu', async (req: Request, res: Response) => {
  try {
    const cpuMetrics = await SystemMonitoringService.getCpuMetrics();
    
    res.json({
      success: true,
      data: cpuMetrics
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des métriques CPU:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques CPU',
      error: error.message
    });
  }
});

// GET /api/monitoring/system/memory - Métriques mémoire
router.get('/system/memory', async (req: Request, res: Response) => {
  try {
    const memMetrics = await SystemMonitoringService.getMemoryMetrics();
    
    res.json({
      success: true,
      data: memMetrics
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des métriques mémoire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques mémoire',
      error: error.message
    });
  }
});

// GET /api/monitoring/system/network - Métriques réseau
router.get('/system/network', async (req: Request, res: Response) => {
  try {
    const netMetrics = await SystemMonitoringService.getNetworkMetrics();
    
    res.json({
      success: true,
      data: netMetrics
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des métriques réseau:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques réseau',
      error: error.message
    });
  }
});

// POST /api/monitoring/host - Monitorer un hôte spécifique
router.post('/host', [
  body('host').notEmpty().withMessage('Host is required'),
  body('count').optional().isInt({ min: 1, max: 10 })
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array()
    });
    return;
  }

  try {
    const { host, count = 4 } = req.body;
    const hostMetrics = await SystemMonitoringService.monitorHost(host, count);
    
    res.json({
      success: true,
      data: hostMetrics
    });
  } catch (error: any) {
    logger.error('Erreur lors du monitoring de l\'hôte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du monitoring de l\'hôte',
      error: error.message
    });
  }
});

// GET /api/monitoring/uptime - Uptime du système
router.get('/uptime', async (req: Request, res: Response) => {
  try {
    const uptime = await SystemMonitoringService.getSystemUptime();
    
    res.json({
      success: true,
      data: uptime
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération de l\'uptime:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'uptime',
      error: error.message
    });
  }
});

// GET /api/monitoring/processes - Top processus
router.get('/processes', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const processes = await SystemMonitoringService.getTopProcesses(limit);
    
    res.json({
      success: true,
      data: processes
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des processus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des processus',
      error: error.message
    });
  }
});

export default router;