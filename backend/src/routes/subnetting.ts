import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { subnetService } from '../services/subnet-service';
import { logger } from '../utils/logger';
import {
  SegmentationRequirement,
  NetworkPlan,
  CalculationRequest,
  ApiResponse
} from '@shared/types/subnetting';

const router = Router();

/**
 * GET /api/subnetting/calculate
 * Calcule les informations d'un sous-réseau à partir d'une IP et CIDR
 */
router.get('/calculate',
  [
    query('ip').isIP(4).withMessage('Adresse IP invalide'),
    query('cidr').isInt({ min: 0, max: 32 }).withMessage('CIDR invalide (0-32)')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Paramètres invalides',
          details: errors.array(),
          timestamp: new Date()
        });
      }

      const { ip, cidr } = req.query;
      const result = subnetService.calculateSubnet(ip as string, parseInt(cidr as string, 10));
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur calcul sous-réseau:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * POST /api/subnetting/calculate
 * Calcule les informations d'un sous-réseau à partir d'une IP et CIDR (version POST)
 */
router.post('/calculate',
  [
    body('ip').isIP(4).withMessage('Adresse IP invalide'),
    body('cidr').isInt({ min: 0, max: 32 }).withMessage('CIDR invalide (0-32)')
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

      const { ip, cidr } = req.body;
      const result = subnetService.calculateSubnet(ip, cidr);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur calcul sous-réseau:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * POST /api/subnetting/vlsm
 * Calcul VLSM avec des besoins spécifiques
 */
router.post('/vlsm',
  [
    body('baseNetwork').matches(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/).withMessage('Format baseNetwork invalide (ex: 192.168.1.0/24)'),
    body('requirements').isArray().withMessage('Liste des besoins requise'),
    body('requirements.*.id').notEmpty().withMessage('ID du segment requis'),
    body('requirements.*.name').notEmpty().withMessage('Nom du segment requis'),
    body('requirements.*.requiredHosts').isInt({ min: 1 }).withMessage('Nombre d\'hôtes requis invalide'),
    body('requirements.*.type').optional().isString().withMessage('Type de segment invalide'),
    body('requirements.*.securityLevel').optional().isString().withMessage('Niveau de sécurité invalide')
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

      const { baseNetwork, requirements } = req.body;
      
      // Parse baseNetwork
      const [networkIp, cidrStr] = baseNetwork.split('/');
      const cidr = parseInt(cidrStr, 10);
      
      const result = subnetService.calculateVLSM(networkIp, cidr, requirements);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur calcul VLSM:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul VLSM',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * POST /api/subnetting/auto-segment
 * Segmentation automatique basée sur des nombres d'hôtes
 */
router.post('/auto-segment',
  [
    body('networkIp').isIP(4).withMessage('Adresse IP réseau invalide'),
    body('cidr').isInt({ min: 0, max: 32 }).withMessage('CIDR invalide'),
    body('hostCounts').isArray().withMessage('Liste des nombres d\'hôtes requise'),
    body('hostCounts.*').isInt({ min: 1 }).withMessage('Nombre d\'hôtes invalide')
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

      const { networkIp, cidr, hostCounts } = req.body;
      const result = subnetService.autoCalculateSegmentation(networkIp, cidr, hostCounts);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur segmentation automatique:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la segmentation automatique',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * POST /api/subnetting/validate
 * Valide une configuration réseau
 */
router.post('/validate',
  [
    body('networkPlan.name').optional().isString().withMessage('Nom du plan invalide'),
    body('networkPlan.description').optional().isString().withMessage('Description invalide')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Configuration invalide',
          details: errors.array(),
          timestamp: new Date()
        });
      }

      const { networkPlan } = req.body;
      
      // Validation basique si le plan existe
      if (!networkPlan) {
        return res.status(400).json({
          success: false,
          error: 'Plan réseau requis',
          timestamp: new Date()
        });
      }

      // Simulation d'une validation réussie
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        summary: {
          planName: networkPlan.name || 'Plan sans nom',
          totalSubnets: 0,
          totalHosts: 0,
          efficiency: 100
        }
      };
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur validation réseau:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la validation',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * GET /api/subnetting/analyze-ip
 * Analyse détaillée d'une adresse IP
 */
router.get('/analyze-ip',
  [
    query('ip').isIP(4).withMessage('Adresse IP invalide')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Adresse IP invalide',
          details: errors.array(),
          timestamp: new Date()
        });
      }

      const { ip } = req.query;
      const result = subnetService.analyzeIP(ip as string);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur analyse IP:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'analyse',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * POST /api/subnetting/analyze-ip
 * Analyse détaillée d'une adresse IP (version POST)
 */
router.post('/analyze-ip',
  [
    body('ip').isIP(4).withMessage('Adresse IP invalide')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Adresse IP invalide',
          details: errors.array(),
          timestamp: new Date()
        });
      }

      const { ip } = req.body;
      const result = subnetService.analyzeIP(ip);
      
      const response: ApiResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur analyse IP:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'analyse',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * POST /api/subnetting/next-available-ip
 * Trouve la prochaine adresse IP disponible dans un sous-réseau
 */
router.post('/next-available-ip',
  [
    body('subnet.network').isIP(4).withMessage('Adresse réseau invalide'),
    body('subnet.cidr').isInt({ min: 0, max: 32 }).withMessage('CIDR invalide'),
    body('allocatedIps').isArray().withMessage('Liste des IPs allouées requise'),
    body('allocatedIps.*').isIP(4).withMessage('Adresse IP allouée invalide')
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

      const { subnet, allocatedIps } = req.body;
      
      // Calculer les informations du sous-réseau
      const subnetInfo = subnetService.calculateSubnet(subnet.network, subnet.cidr);
      const fullSubnet = {
        ...subnet,
        firstHost: subnetInfo.firstUsableIp,
        lastHost: subnetInfo.lastUsableIp,
        usableHosts: subnetInfo.usableHosts
      };
      
      const nextIp = subnetService.getNextAvailableIp(fullSubnet as any, allocatedIps);
      
      const response: ApiResponse<any> = {
        success: true,
        data: { nextAvailableIp: nextIp },
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur recherche IP disponible:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * POST /api/subnetting/utilization
 * Calcule les statistiques d'utilisation d'un sous-réseau
 */
router.post('/utilization',
  [
    body('subnet.network').isIP(4).withMessage('Adresse réseau invalide'),
    body('subnet.cidr').isInt({ min: 0, max: 32 }).withMessage('CIDR invalide'),
    body('allocatedIps').isArray().withMessage('Liste des IPs allouées requise'),
    body('allocatedIps.*').isIP(4).withMessage('Adresse IP allouée invalide')
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

      const { subnet, allocatedIps } = req.body;
      
      // Calculer les informations du sous-réseau
      const subnetInfo = subnetService.calculateSubnet(subnet.network, subnet.cidr);
      const fullSubnet = {
        ...subnet,
        firstHost: subnetInfo.firstUsableIp,
        lastHost: subnetInfo.lastUsableIp,
        usableHosts: subnetInfo.usableHosts
      };
      
      const utilization = subnetService.getSubnetUtilization(fullSubnet as any, allocatedIps);
      
      const response: ApiResponse<any> = {
        success: true,
        data: utilization,
        timestamp: new Date()
      };

      return res.json(response);
    } catch (error) {
      logger.error('Erreur calcul utilisation:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul d\'utilisation',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date()
      });
    }
  }
);

/**
 * GET /api/subnetting/presets
 * Retourne des présets de segmentation prédéfinis
 */
router.get('/presets', async (req: Request, res: Response) => {
  try {
    const presets = [
      {
        id: 'enterprise-standard',
        name: 'Enterprise Standard',
        description: 'Configuration standard pour environnement d\'entreprise',
        category: 'enterprise',
        baseNetwork: '10.0.0.0',
        baseCidr: 16,
        requirements: [
          {
            id: 'management',
            name: 'Management',
            type: 'management',
            requiredHosts: 50,
            securityLevel: 'critical',
            priority: 10,
            vlanId: 100
          },
          {
            id: 'servers',
            name: 'Servers',
            type: 'servers',
            requiredHosts: 200,
            securityLevel: 'high',
            priority: 9,
            vlanId: 200
          },
          {
            id: 'lan',
            name: 'LAN Users',
            type: 'lan',
            requiredHosts: 1000,
            securityLevel: 'medium',
            priority: 8,
            vlanId: 300
          },
          {
            id: 'dmz',
            name: 'DMZ',
            type: 'dmz',
            requiredHosts: 100,
            securityLevel: 'high',
            priority: 7,
            vlanId: 400
          },
          {
            id: 'guests',
            name: 'Guests',
            type: 'guests',
            requiredHosts: 500,
            securityLevel: 'low',
            priority: 5,
            vlanId: 500
          }
        ],
        tags: ['enterprise', 'standard', 'vlans']
      },
      {
        id: 'soho',
        name: 'Small Office/Home Office',
        description: 'Configuration pour petit bureau ou domicile',
        category: 'soho',
        baseNetwork: '192.168.1.0',
        baseCidr: 24,
        requirements: [
          {
            id: 'main',
            name: 'Main Network',
            type: 'lan',
            requiredHosts: 100,
            securityLevel: 'medium',
            priority: 8
          },
          {
            id: 'iot',
            name: 'IoT Devices',
            type: 'custom',
            requiredHosts: 50,
            securityLevel: 'low',
            priority: 5
          },
          {
            id: 'guests',
            name: 'Guest Network',
            type: 'guests',
            requiredHosts: 20,
            securityLevel: 'low',
            priority: 3
          }
        ],
        tags: ['soho', 'simple', 'home']
      },
      {
        id: 'datacenter',
        name: 'Data Center',
        description: 'Segmentation pour centre de données',
        category: 'datacenter',
        baseNetwork: '10.0.0.0',
        baseCidr: 12,
        requirements: [
          {
            id: 'web-tier',
            name: 'Web Tier',
            type: 'servers',
            requiredHosts: 500,
            securityLevel: 'medium',
            priority: 9,
            vlanId: 100
          },
          {
            id: 'app-tier',
            name: 'Application Tier',
            type: 'servers',
            requiredHosts: 1000,
            securityLevel: 'high',
            priority: 10,
            vlanId: 200
          },
          {
            id: 'db-tier',
            name: 'Database Tier',
            type: 'servers',
            requiredHosts: 200,
            securityLevel: 'critical',
            priority: 10,
            vlanId: 300
          },
          {
            id: 'storage',
            name: 'Storage Network',
            type: 'storage',
            requiredHosts: 100,
            securityLevel: 'high',
            priority: 8,
            vlanId: 400
          },
          {
            id: 'backup',
            name: 'Backup Network',
            type: 'backup',
            requiredHosts: 50,
            securityLevel: 'high',
            priority: 7,
            vlanId: 500
          },
          {
            id: 'management',
            name: 'Management',
            type: 'management',
            requiredHosts: 100,
            securityLevel: 'critical',
            priority: 9,
            vlanId: 600
          }
        ],
        tags: ['datacenter', 'tier', 'production']
      }
    ];

    const response: ApiResponse<any> = {
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

export { router as subnetRoutes };