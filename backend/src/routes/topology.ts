import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { topologyService } from '../services/topology-service';
import { logger } from '../utils/logger';
import { 
  TopologyApiResponse, 
  DiscoveryRequest,
  DeviceStatus 
} from '@shared/types/topology';

const router = Router();

/**
 * GET /api/topology/topologies
 * Récupère toutes les topologies
 */
router.get('/topologies', async (req: Request, res: Response) => {
  try {
    const topologies = topologyService.getAllTopologies();
    
    const response: TopologyApiResponse = {
      success: true,
      data: topologies,
      timestamp: new Date()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Erreur récupération topologies:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des topologies',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/topology/topologies/:id
 * Récupère une topologie par ID
 */
router.get('/topologies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topology = topologyService.getTopologyById(id);
    
    if (!topology) {
      return res.status(404).json({
        success: false,
        error: 'Topologie non trouvée',
        timestamp: new Date()
      });
    }

    const response: TopologyApiResponse = {
      success: true,
      data: topology,
      timestamp: new Date()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Erreur récupération topologie:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la topologie',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/topology/graph/:topologyId
 * Génère les données de graphe pour visualisation
 */
router.get('/graph/:topologyId', async (req: Request, res: Response) => {
  try {
    const { topologyId } = req.params;
    const graphData = topologyService.generateGraphData(topologyId);
    
    if (!graphData) {
      return res.status(404).json({
        success: false,
        error: 'Topologie non trouvée',
        timestamp: new Date()
      });
    }

    const response: TopologyApiResponse = {
      success: true,
      data: graphData,
      timestamp: new Date()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Erreur génération graphe:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du graphe',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date()
    });
  }
});

/**
 * POST /api/topology/discovery/start
 * Lance une découverte réseau
 */
router.post('/discovery/start',
  [
    body('name').optional().isString().withMessage('Nom invalide'),
    body('ipRanges').isArray().withMessage('Plages IP requises'),
    body('ipRanges.*').matches(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/).withMessage('Format IP/CIDR invalide'),
    body('methods').isArray().withMessage('Méthodes de découverte requises'),
    body('methods.*').isIn(['ping', 'arp', 'snmp', 'nmap', 'cdp', 'lldp', 'ssh', 'wmi']).withMessage('Méthode invalide'),
    body('timeout').optional().isInt({ min: 1000, max: 60000 }).withMessage('Timeout invalide (1000-60000ms)')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array(),
          timestamp: new Date()
        });
      }

      const discoveryRequest: DiscoveryRequest = req.body;
      const result = await topologyService.startDiscovery(discoveryRequest);
      
      const response: TopologyApiResponse = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur lancement découverte:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du lancement de la découverte',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * GET /api/topology/discovery/presets
 * Retourne des presets de découverte prédéfinis
 */
router.get('/discovery/presets', async (req: Request, res: Response) => {
  try {
    const presets = [
      {
        id: 'basic-lan',
        name: 'Découverte LAN Basique',
        description: 'Découverte rapide des appareils sur le réseau local',
        category: 'basic',
        config: {
          methods: ['ping', 'arp'],
          ipRanges: ['192.168.1.0/24'],
          ports: [22, 23, 80, 443],
          timeout: 5000,
          maxThreads: 10,
          snmpCommunities: ['public']
        },
        tags: ['basic', 'lan', 'quick']
      },
      {
        id: 'advanced-snmp',
        name: 'Découverte SNMP Avancée',
        description: 'Découverte complète avec interrogation SNMP des équipements',
        category: 'advanced',
        config: {
          methods: ['ping', 'arp', 'snmp', 'cdp', 'lldp'],
          ipRanges: ['192.168.0.0/16', '10.0.0.0/8'],
          ports: [22, 23, 80, 443, 161, 162],
          timeout: 10000,
          maxThreads: 20,
          snmpCommunities: ['public', 'private', 'read-only']
        },
        tags: ['advanced', 'snmp', 'complete']
      },
      {
        id: 'enterprise-full',
        name: 'Découverte Entreprise Complète',
        description: 'Découverte exhaustive pour environnement d\'entreprise',
        category: 'enterprise',
        config: {
          methods: ['ping', 'arp', 'snmp', 'nmap', 'cdp', 'lldp', 'ssh'],
          ipRanges: ['0.0.0.0/0'], // Attention: scan complet
          ports: [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 161, 162, 389, 636, 3389],
          timeout: 15000,
          maxThreads: 50,
          snmpCommunities: ['public', 'private', 'read-only', 'monitoring']
        },
        tags: ['enterprise', 'complete', 'exhaustive']
      }
    ];

    const response: TopologyApiResponse = {
      success: true,
      data: presets,
      timestamp: new Date()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Erreur récupération presets:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des presets',
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/topology/discovery/:id
 * Récupère le résultat d'une découverte
 */
router.get('/discovery/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = topologyService.getDiscoveryResult(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Résultat de découverte non trouvé',
        timestamp: new Date()
      });
    }

    const response: TopologyApiResponse = {
      success: true,
      data: result,
      timestamp: new Date()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Erreur récupération découverte:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du résultat',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date()
    });
  }
});

/**
 * PUT /api/topology/devices/:topologyId/:deviceId/status
 * Met à jour le statut d'un appareil
 */
router.put('/devices/:topologyId/:deviceId/status',
  [
    body('status').isIn(['online', 'offline', 'warning', 'critical', 'maintenance', 'unknown']).withMessage('Statut invalide')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array(),
          timestamp: new Date()
        });
      }

      const { topologyId, deviceId } = req.params;
      const { status } = req.body;
      
      const success = topologyService.updateDeviceStatus(topologyId, deviceId, status as DeviceStatus);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Topologie ou appareil non trouvé',
          timestamp: new Date()
        });
      }

      const response: TopologyApiResponse = {
        success: true,
        data: { message: 'Statut mis à jour avec succès' },
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur mise à jour statut:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du statut',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * DELETE /api/topology/devices/:topologyId/:deviceId
 * Supprime un appareil de la topologie
 */
router.delete('/devices/:topologyId/:deviceId', async (req: Request, res: Response) => {
  try {
    const { topologyId, deviceId } = req.params;
    
    const success = topologyService.removeDevice(topologyId, deviceId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Topologie ou appareil non trouvé',
        timestamp: new Date()
      });
    }

    const response: TopologyApiResponse = {
      success: true,
      data: { message: 'Appareil supprimé avec succès' },
      timestamp: new Date()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Erreur suppression appareil:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'appareil',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/topology/statistics/:topologyId
 * Récupère les statistiques d'une topologie
 */
router.get('/statistics/:topologyId', async (req: Request, res: Response) => {
  try {
    const { topologyId } = req.params;
    const topology = topologyService.getTopologyById(topologyId);
    
    if (!topology) {
      return res.status(404).json({
        success: false,
        error: 'Topologie non trouvée',
        timestamp: new Date()
      });
    }

    const response: TopologyApiResponse = {
      success: true,
      data: topology.statistics,
      timestamp: new Date()
    };

    return res.json(response);
  } catch (error) {
    logger.error('Erreur récupération statistiques:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date()
    });
  }
});

export { router as topologyRoutes };