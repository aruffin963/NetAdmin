import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PasswordGeneratorService } from '../services/passwordGeneratorService';
import { logger } from '../utils/logger';
import { ActivityLogService, LogActions, ResourceTypes } from '../services/activityLogService';

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

/**
 * POST /api/passwords/generate
 * Générer un nouveau mot de passe
 */
router.post('/generate',
  [
    body('application').notEmpty().withMessage('Le nom de l\'application est requis').isLength({ max: 255 }),
    body('username').notEmpty().withMessage('Le nom d\'utilisateur est requis').isLength({ max: 255 }),
    body('length').isInt({ min: 8, max: 128 }).withMessage('La longueur doit être entre 8 et 128'),
    body('secret_key').optional().isString().isLength({ max: 255 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { application, username, length, secret_key, notes } = req.body;
      const created_by = (req as any).user?.username || 'system'; // TODO: Utiliser l'utilisateur authentifié

      const result = await PasswordGeneratorService.generateAndSave({
        application,
        username,
        length,
        secret_key,
        notes,
        created_by
      });

      // Log l'action
      await ActivityLogService.log({
        username: created_by,
        action: LogActions.GENERATE,
        resourceType: ResourceTypes.PASSWORD,
        resourceId: result.password.id.toString(),
        resourceName: application,
        details: {
          username: username,
          length: length
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'success'
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.password.id,
          application: result.password.application,
          username: result.password.username,
          length: result.password.length,
          created_at: result.password.created_at,
          plainPassword: result.plainPassword // Le mot de passe en clair (ne sera montré qu'une fois)
        },
        message: 'Mot de passe généré avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de la génération du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du mot de passe',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/passwords
 * Récupérer tous les mots de passe
 */
router.get('/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const created_by = (req as any).user?.username; // TODO: Filtrer par utilisateur authentifié
      const passwords = await PasswordGeneratorService.getAll(created_by);

      // Ne pas renvoyer les hash des mots de passe
      const sanitizedPasswords = passwords.map(p => ({
        id: p.id,
        application: p.application,
        username: p.username,
        length: p.length,
        secret_key: p.secret_key,
        created_by: p.created_by,
        created_at: p.created_at,
        updated_at: p.updated_at,
        last_accessed_at: p.last_accessed_at,
        notes: p.notes
      }));

      res.json({
        success: true,
        data: sanitizedPasswords,
        total: sanitizedPasswords.length
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des mots de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des mots de passe',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * GET /api/passwords/:id
 * Récupérer un mot de passe par ID
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const password = await PasswordGeneratorService.getById(parseInt(req.params.id));

      if (!password) {
        res.status(404).json({
          success: false,
          message: 'Mot de passe non trouvé'
        });
        return;
      }

      // Ne pas renvoyer le hash
      res.json({
        success: true,
        data: {
          id: password.id,
          application: password.application,
          username: password.username,
          length: password.length,
          secret_key: password.secret_key,
          created_by: password.created_by,
          created_at: password.created_at,
          updated_at: password.updated_at,
          last_accessed_at: password.last_accessed_at,
          notes: password.notes
        }
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du mot de passe',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * POST /api/passwords/:id/regenerate
 * Régénérer un mot de passe existant
 */
router.post('/:id/regenerate',
  [
    param('id').isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await PasswordGeneratorService.regenerate(parseInt(req.params.id));

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Mot de passe non trouvé'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: result.password.id,
          application: result.password.application,
          username: result.password.username,
          length: result.password.length,
          updated_at: result.password.updated_at,
          plainPassword: result.plainPassword // Le nouveau mot de passe en clair
        },
        message: 'Mot de passe régénéré avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de la régénération du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la régénération du mot de passe',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * DELETE /api/passwords/:id
 * Supprimer un mot de passe
 */
router.delete('/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const passwordId = parseInt(req.params.id);
      const password = await PasswordGeneratorService.getById(passwordId);
      const success = await PasswordGeneratorService.delete(passwordId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Mot de passe non trouvé'
        });
        return;
      }

      // Log l'action
      const created_by = (req as any).user?.username || 'system';
      await ActivityLogService.log({
        username: created_by,
        action: LogActions.DELETE,
        resourceType: ResourceTypes.PASSWORD,
        resourceId: passwordId.toString(),
        resourceName: password?.application,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'success'
      });

      res.json({
        success: true,
        message: 'Mot de passe supprimé avec succès'
      });
    } catch (error) {
      logger.error('Erreur lors de la suppression du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression du mot de passe',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

export default router;
