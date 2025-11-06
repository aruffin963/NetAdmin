import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
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

// GET /api/organizations - Lister les organisations avec statistiques
router.get('/', async (req: Request, res: Response) => {
  try {
    // Récupérer les organisations avec statistiques (sans vlans qui n'existe pas)
    const organizations = await DatabaseService.query(`
      SELECT 
        o.id, 
        o.name, 
        o.domain, 
        o.is_active, 
        o.created_at,
        COUNT(DISTINCT s.id) as subnet_count,
        0 as vlan_count,
        COUNT(DISTINCT ip.id) as total_ips,
        COUNT(DISTINCT CASE WHEN ip.status = 'allocated' THEN ip.id END) as allocated_ips,
        COUNT(DISTINCT CASE WHEN ip.status = 'available' THEN ip.id END) as available_ips
      FROM organizations o
      LEFT JOIN subnets s ON s.organization_id = o.id
      LEFT JOIN ip_pools p ON p.organization_id = o.id
      LEFT JOIN ip_addresses ip ON ip.pool_id = p.id
      GROUP BY o.id, o.name, o.domain, o.is_active, o.created_at
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      data: organizations.rows,
      total: organizations.rows.length
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des organisations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des organisations',
      error: error.message
    });
  }
});

// POST /api/organizations - Créer une organisation
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('domain').optional().isLength({ max: 100 }).withMessage('Le domaine ne peut pas dépasser 100 caractères')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { name, domain } = req.body;

    const result = await DatabaseService.query(`
      INSERT INTO organizations (name, domain, is_active)
      VALUES ($1, $2, true)
      RETURNING *
    `, [
      name,
      domain || `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.netadmin.local`
    ]);

    const organization = result.rows[0];

    logger.info(`Organisation créée: ${organization.name} (ID: ${organization.id})`);

    // Log l'action
    const username = (req as any).user?.username || 'system';
    await ActivityLogService.log({
      username,
      action: LogActions.CREATE,
      resourceType: ResourceTypes.ORGANIZATION,
      resourceId: organization.id.toString(),
      resourceName: organization.name,
      details: { domain: organization.domain },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Organisation créée avec succès',
      data: organization
    });
  } catch (error: any) {
    logger.error('Erreur lors de la création de l\'organisation:', error);
    
    let errorMessage = 'Erreur lors de la création de l\'organisation';
    
    // Gestion des erreurs spécifiques PostgreSQL
    if (error.code === '23505') { // Contrainte unique violée
      if (error.constraint === 'organizations_domain_key') {
        errorMessage = 'Ce domaine est déjà utilisé par une autre organisation';
      } else {
        errorMessage = 'Cette organisation existe déjà';
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/organizations/:id - Obtenir une organisation spécifique
router.get('/:id', [
  param('id').isInt().withMessage('ID invalide')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(`
      SELECT 
        o.id, 
        o.name, 
        o.domain, 
        o.is_active, 
        o.created_at,
        COUNT(DISTINCT s.id) as subnet_count,
        0 as vlan_count,
        COUNT(DISTINCT ip.id) as total_ips,
        COUNT(DISTINCT CASE WHEN ip.status = 'allocated' THEN ip.id END) as allocated_ips,
        COUNT(DISTINCT CASE WHEN ip.status = 'available' THEN ip.id END) as available_ips
      FROM organizations o
      LEFT JOIN subnets s ON s.organization_id = o.id
      LEFT JOIN ip_pools p ON p.organization_id = o.id
      LEFT JOIN ip_addresses ip ON ip.pool_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, o.name, o.domain, o.is_active, o.created_at
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Organisation non trouvée'
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    logger.error('Erreur lors de la récupération de l\'organisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'organisation',
      error: error.message
    });
  }
});

// PUT /api/organizations/:id - Modifier une organisation
router.put('/:id', [
  param('id').isInt().withMessage('ID invalide'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('domain').optional().isLength({ max: 100 }).withMessage('Le domaine ne peut pas dépasser 100 caractères'),
  body('is_active').optional().isBoolean().withMessage('is_active doit être un booléen')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, domain, is_active } = req.body;

    // Vérifier si l'organisation existe
    const existing = await DatabaseService.query(`
      SELECT id, name FROM organizations WHERE id = $1
    `, [id]);

    if (existing.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Organisation non trouvée'
      });
      return;
    }

    // Construire la requête de mise à jour
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (domain !== undefined) {
      updates.push(`domain = $${paramIndex}`);
      values.push(domain);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Aucune modification fournie'
      });
      return;
    }

    values.push(id);

    const result = await DatabaseService.query(`
      UPDATE organizations 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    const updatedOrg = result.rows[0];

    logger.info(`Organisation modifiée: ${updatedOrg.name} (ID: ${id})`);

    // Log l'action
    const username = (req as any).user?.username || 'system';
    await ActivityLogService.log({
      username,
      action: LogActions.UPDATE,
      resourceType: ResourceTypes.ORGANIZATION,
      resourceId: id,
      resourceName: updatedOrg.name,
      details: { changes: req.body },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Organisation modifiée avec succès',
      data: updatedOrg
    });
  } catch (error: any) {
    logger.error('Erreur lors de la modification de l\'organisation:', error);
    
    let errorMessage = 'Erreur lors de la modification de l\'organisation';
    
    if (error.code === '23505') {
      if (error.constraint === 'organizations_domain_key') {
        errorMessage = 'Ce domaine est déjà utilisé par une autre organisation';
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/organizations/:id - Supprimer une organisation
router.delete('/:id', [
  param('id').isInt().withMessage('ID invalide')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier si l'organisation existe
    const existing = await DatabaseService.query(`
      SELECT id, name FROM organizations WHERE id = $1
    `, [id]);

    if (existing.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Organisation non trouvée'
      });
      return;
    }

    const orgName = existing.rows[0].name;

    // Vérifier s'il y a des dépendances
    const dependencies = await DatabaseService.query(`
      SELECT 
        COUNT(DISTINCT s.id) as subnet_count,
        COUNT(DISTINCT ip.id) as ip_count,
        COUNT(DISTINCT p.id) as pool_count
      FROM organizations o
      LEFT JOIN subnets s ON s.organization_id = o.id
      LEFT JOIN ip_pools p ON p.organization_id = o.id
      LEFT JOIN ip_addresses ip ON ip.pool_id = p.id
      WHERE o.id = $1
    `, [id]);

    const deps = dependencies.rows[0];
    if (parseInt(deps.subnet_count) > 0 || parseInt(deps.pool_count) > 0 || parseInt(deps.ip_count) > 0) {
      res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette organisation car elle contient des ressources',
        details: {
          subnets: parseInt(deps.subnet_count),
          pools: parseInt(deps.pool_count),
          ips: parseInt(deps.ip_count)
        }
      });
      return;
    }

    // Supprimer l'organisation
    await DatabaseService.query(`
      DELETE FROM organizations WHERE id = $1
    `, [id]);

    logger.info(`Organisation supprimée: ${orgName} (ID: ${id})`);

    // Log l'action
    const username = (req as any).user?.username || 'system';
    await ActivityLogService.log({
      username,
      action: LogActions.DELETE,
      resourceType: ResourceTypes.ORGANIZATION,
      resourceId: id,
      resourceName: orgName,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Organisation supprimée avec succès'
    });
  } catch (error: any) {
    logger.error('Erreur lors de la suppression de l\'organisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'organisation',
      error: error.message
    });
  }
});

export default router;