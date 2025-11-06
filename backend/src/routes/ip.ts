import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { IpManagementService } from '../services/ipManagementService';
import { logger } from '../utils/logger';

// Types pour la validation
enum IpStatus {
  AVAILABLE = 'available',
  ALLOCATED = 'allocated',
  RESERVED = 'reserved',
  BLOCKED = 'blocked'
}

const router = Router();

// Middleware de validation des erreurs
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
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

// Validation middleware
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

// === ROUTES POOLS IP ===

/**
 * GET /api/ip/pools
 * Récupérer tous les pools IP avec statistiques
 */
router.get('/pools',
  [
    ...validatePagination,
    query('organizationId').optional().isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.query.organizationId ? 
        parseInt(req.query.organizationId as string) : undefined;
      const pools = await IpManagementService.getAllPools(organizationId);

      res.json({
        success: true,
        data: pools,
        total: pools.length,
        message: `${pools.length} pools récupérés`
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des pools:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des pools',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/ip/pools/:id
 * Récupérer un pool spécifique
 */
router.get('/pools/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const pool = await IpManagementService.getPoolById(parseInt(req.params.id));
      
      if (!pool) {
        res.status(404).json({
          success: false,
          message: 'Pool non trouvé'
        });
        return;
      }

      res.json({
        success: true,
        data: pool
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération du pool:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération du pool',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/ip/pools
 * Créer un nouveau pool IP
 */
router.post('/pools',
  [
    body('name').notEmpty().withMessage('Le nom est requis').isLength({ max: 255 }),
    body('network').notEmpty().withMessage('Le réseau est requis')
      .matches(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/).withMessage('Format CIDR invalide (ex: 192.168.1.0/24)'),
    body('organization_id').isInt({ min: 1 }).withMessage('ID organisation requis'),
    body('gateway').optional().isIP().withMessage('Adresse gateway invalide'),
    body('dns_servers').optional().isArray().withMessage('DNS doit être un tableau'),
    body('dns_servers.*').optional().isIP().withMessage('Adresse DNS invalide'),
    body('description').optional().isString().isLength({ max: 500 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const pool = await IpManagementService.createPool(req.body);
      
      res.status(201).json({
        success: true,
        data: pool,
        message: `Pool "${pool.name}" créé avec succès`
      });
    } catch (error) {
      logger.error('Erreur lors de la création du pool:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Erreur lors de la création du pool',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/ip/pools/:id
 * Mettre à jour un pool IP
 */
router.put('/pools/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('name').optional().isLength({ max: 255 }),
    body('gateway').optional().isIP(),
    body('dns_servers').optional().isArray(),
    body('dns_servers.*').optional().isIP(),
    body('description').optional().isString().isLength({ max: 500 }),
    body('is_active').optional().isBoolean(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const pool = await IpManagementService.updatePool(parseInt(req.params.id), req.body);
      
      if (!pool) {
        res.status(404).json({
          success: false,
          message: 'Pool non trouvé'
        });
        return;
      }

      res.json({
        success: true,
        data: pool,
        message: `Pool "${pool.name}" mis à jour avec succès`
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du pool:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Erreur lors de la mise à jour du pool',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * DELETE /api/ip/pools/:id
 * Supprimer un pool IP
 */
router.delete('/pools/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const success = await IpManagementService.deletePool(parseInt(req.params.id));
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Pool non trouvé'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Pool supprimé avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur lors de la suppression du pool:', error);
      res.status(400).json({ 
        success: false, 
        message: error?.message || 'Erreur lors de la suppression du pool',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// === ROUTES ADRESSES IP ===

/**
 * GET /api/ip/pools/:poolId/addresses
 * Récupérer les adresses IP d'un pool
 */
router.get('/pools/:poolId/addresses',
  [
    param('poolId').isInt({ min: 1 }).toInt(),
    query('status').optional().isIn(Object.values(IpStatus)),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const poolId = parseInt(req.params.poolId);
      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const result = await IpManagementService.getAddressesByPool(poolId, status, limit, offset);

      res.json({
        success: true,
        data: result.addresses,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des adresses:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des adresses',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/ip/addresses
 * Créer une nouvelle adresse IP
 */
router.post('/addresses',
  [
    body('pool_id').isInt({ min: 1 }).withMessage('ID du pool requis'),
    body('ip_address').optional().isIP().withMessage('Adresse IP invalide'),
    body('hostname').optional().isLength({ max: 255 }),
    body('mac_address').optional().matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
      .withMessage('Adresse MAC invalide'),
    body('description').optional().isString().isLength({ max: 500 }),
    body('allocated_to').optional().isString().isLength({ max: 255 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const address = await IpManagementService.createAddress(req.body);
      
      res.status(201).json({
        success: true,
        data: address,
        message: `Adresse IP ${address.ip_address} créée avec succès`
      });
    } catch (error: any) {
      logger.error('Erreur lors de la création de l\'adresse:', error);
      res.status(400).json({ 
        success: false, 
        message: error?.message || 'Erreur lors de la création de l\'adresse',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/ip/addresses/:id/allocate
 * Allouer une adresse IP
 */
router.put('/addresses/:id/allocate',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('allocated_to').notEmpty().withMessage('Destinataire requis').isLength({ max: 255 }),
    body('hostname').optional().isLength({ max: 255 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { allocated_to, hostname } = req.body;
      const address = await IpManagementService.allocateAddress(
        parseInt(req.params.id), 
        allocated_to, 
        hostname
      );
      
      if (!address) {
        res.status(404).json({
          success: false,
          message: 'Adresse non trouvée ou déjà allouée'
        });
        return;
      }

      res.json({
        success: true,
        data: address,
        message: `Adresse ${address.ip_address} allouée à ${allocated_to}`
      });
    } catch (error) {
      logger.error('Erreur lors de l\'allocation de l\'adresse:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Erreur lors de l\'allocation de l\'adresse',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/ip/addresses/:id/release
 * Libérer une adresse IP
 */
router.put('/addresses/:id/release',
  [
    param('id').isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const address = await IpManagementService.releaseAddress(parseInt(req.params.id));
      
      if (!address) {
        res.status(404).json({
          success: false,
          message: 'Adresse non trouvée'
        });
        return;
      }

      res.json({
        success: true,
        data: address,
        message: `Adresse ${address.ip_address} libérée avec succès`
      });
    } catch (error) {
      logger.error('Erreur lors de la libération de l\'adresse:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la libération de l\'adresse',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// === ROUTES SOUS-RÉSEAUX ===

/**
 * GET /api/ip/subnets
 * Récupérer tous les sous-réseaux
 */
router.get('/subnets',
  [
    query('organizationId').optional().isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.query.organizationId ? 
        parseInt(req.query.organizationId as string) : undefined;
      const subnets = await IpManagementService.getAllSubnets(organizationId);

      res.json({
        success: true,
        data: subnets,
        total: subnets.length
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des sous-réseaux:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des sous-réseaux',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/ip/subnets
 * Créer un nouveau sous-réseau
 */
router.post('/subnets',
  [
    body('name').notEmpty().withMessage('Le nom est requis').isLength({ max: 255 }),
    body('network').notEmpty().withMessage('Le réseau est requis').isIP(),
    body('cidr').isInt({ min: 8, max: 30 }).withMessage('CIDR invalide (8-30)'),
    body('organization_id').isInt({ min: 1 }).withMessage('ID organisation requis'),
    body('gateway').optional().isIP(),
    body('vlan_id').optional().isInt({ min: 1, max: 4094 }),
    body('description').optional().isString().isLength({ max: 500 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const subnet = await IpManagementService.createSubnet(req.body);
      
      res.status(201).json({
        success: true,
        data: subnet,
        message: `Sous-réseau "${subnet.name}" créé avec succès`
      });
    } catch (error) {
      logger.error('Erreur lors de la création du sous-réseau:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Erreur lors de la création du sous-réseau',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * PUT /api/ip/subnets/:id
 * Mettre à jour un sous-réseau
 */
router.put('/subnets/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('name').optional().isLength({ max: 255 }),
    body('network').optional().isIP(),
    body('cidr').optional().isInt({ min: 8, max: 30 }),
    body('gateway').optional().isIP(),
    body('vlan_id').optional().isInt({ min: 1, max: 4094 }),
    body('description').optional().isString().isLength({ max: 500 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const subnet = await IpManagementService.updateSubnet(parseInt(req.params.id), req.body);
      
      if (!subnet) {
        res.status(404).json({
          success: false,
          message: 'Sous-réseau non trouvé'
        });
        return;
      }

      res.json({
        success: true,
        data: subnet,
        message: `Sous-réseau "${subnet.name}" mis à jour avec succès`
      });
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du sous-réseau:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Erreur lors de la mise à jour du sous-réseau',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * DELETE /api/ip/subnets/:id
 * Supprimer un sous-réseau
 */
router.delete('/subnets/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const success = await IpManagementService.deleteSubnet(parseInt(req.params.id));
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Sous-réseau non trouvé'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Sous-réseau supprimé avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur lors de la suppression du sous-réseau:', error);
      res.status(400).json({ 
        success: false, 
        message: error?.message || 'Erreur lors de la suppression du sous-réseau',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/ip/statistics
 * Récupérer les statistiques globales IP
 */
router.get('/statistics',
  [
    query('organizationId').optional().isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.query.organizationId ? 
        parseInt(req.query.organizationId as string) : undefined;
      const stats = await IpManagementService.getIpStatistics(organizationId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur lors du calcul des statistiques:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors du calcul des statistiques',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/ip/addresses/pool/:poolId
 * Récupérer les adresses IP d'un pool spécifique
 */
router.get('/addresses/pool/:poolId',
  [
    param('poolId').isInt({ min: 1 }).toInt(),
    ...validatePagination,
    query('status').optional().isIn(Object.values(IpStatus)),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const poolId = parseInt(req.params.poolId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status as string;

      const result = await IpManagementService.getAddressesByPool(poolId, status, limit, offset);

      res.json({
        success: true,
        message: `${result.total} adresses trouvées pour le pool ${poolId}`,
        data: result.addresses,
        total: result.total,
        page,
        limit
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des adresses du pool:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des adresses',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

export default router;