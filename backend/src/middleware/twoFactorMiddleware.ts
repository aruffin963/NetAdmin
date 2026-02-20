import { Request, Response, NextFunction } from 'express';
import TwoFactorAuthService from '../services/twoFactorAuthService';
import { logger } from '../utils/logger';

/**
 * Middleware pour vérifier le 2FA
 * S'assure que l'utilisateur a complété la vérification 2FA s'il est activé
 */
export const twoFactorMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Vérifier si le 2FA est activé pour cet utilisateur
    const is2FAEnabled = await TwoFactorAuthService.isTwoFactorEnabled(user.id);

    // Ajouter l'info au request pour les routes qui en ont besoin
    (req as any).user.requires2FA = is2FAEnabled;

    next();
  } catch (error) {
    logger.error('Error in 2FA middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware pour enforcer le 2FA
 * Rejette les requêtes si le 2FA est requis mais pas complété
 */
export const enforce2FAMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    // Vérifier si le 2FA est activé
    const is2FAEnabled = await TwoFactorAuthService.isTwoFactorEnabled(user.id);

    if (!is2FAEnabled) {
      // 2FA pas activé, continuer
      return next();
    }

    // 2FA activé, vérifier le statut de vérification dans la session
    const session = (req as any).session;

    if (!session.verified2FA) {
      res.status(403).json({
        error: '2FA verification required',
        requires2FA: true,
      });
    }

    // Vérifier que la vérification n'a pas expiré (30 minutes)
    const verified2FATime = session.verified2FATime || 0;
    const now = Date.now();
    const expiryTime = 30 * 60 * 1000; // 30 minutes

    if (now - verified2FATime > expiryTime) {
      session.verified2FA = false;
      res.status(403).json({
        error: '2FA verification expired',
        requires2FA: true,
      });
    }

    next();
  } catch (error) {
    logger.error('Error in enforce 2FA middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware pour obtenir le statut 2FA dans les logs de requête
 */
export const log2FAStatusMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (user && user.id) {
      const is2FAEnabled = await TwoFactorAuthService.isTwoFactorEnabled(user.id);
      if (is2FAEnabled) {
        logger.debug(`User ${user.id} has 2FA enabled`, {
          userId: user.id,
          path: req.path,
        });
      }
    }

    next();
  } catch (error) {
    // Continue even if middleware fails
    next();
  }
};

export default twoFactorMiddleware;
