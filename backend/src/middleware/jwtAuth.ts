import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwtService';
import { logger } from '../utils/logger';

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
}

export type JWTRequest = Request & {
  jwtPayload?: JWTPayload;
};

/**
 * Middleware pour vérifier les JWT tokens
 * Le token doit être envoyé dans le header Authorization: Bearer <token>
 */
export const jwtAuth = (req: JWTRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = JWTService.verifyAccessToken(token);

      // Attach user info to request
      req.jwtPayload = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    logger.error('JWT authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Middleware optionnel - ne rejette pas si pas de token, ajoute les infos si valide
 */
export const optionalJWTAuth = (req: JWTRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = JWTService.verifyAccessToken(token);
        req.jwtPayload = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (error) {
        // Token invalide, on continue quand même (optionnel)
        logger.debug('Optional JWT auth: invalid token');
      }
    }

    next();
  } catch (error) {
    logger.error('Optional JWT authentication error:', error);
    next(); // Continue even on error for optional auth
  }
};

/**
 * Middleware pour vérifier le rôle
 */
export const requireRole = (...roles: string[]) => {
  return (req: JWTRequest, res: Response, next: NextFunction): void => {
    if (!req.jwtPayload) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!roles.includes(req.jwtPayload.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};
