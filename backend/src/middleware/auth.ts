import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../config/session';
import { JWTService } from '../services/jwtService';
import { logger } from '../utils/logger';

const sessionService = SessionService.getInstance();

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    next();
    return;
  }
  
  res.status(401).json({
    success: false,
    message: 'Authentication required',
    code: 'UNAUTHORIZED'
  });
};

/**
 * Middleware to check session validity (15 minutes inactivity)
 */
export const checkSessionValidity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
    return;
  }

  const user = req.user as any;
  const sessionId = req.sessionID;

  // Check if session is still valid
  const isValid = await sessionService.isSessionValid(sessionId, user.id);

  if (!isValid) {
    // Session expired, destroy it
    req.logout((err) => {
      if (err) console.error('Error logging out:', err);
    });
    
    res.status(401).json({
      success: false,
      message: 'Session expired. Please log in again.',
      code: 'SESSION_EXPIRED'
    });
    return;
  }

  // Update last activity timestamp
  await sessionService.updateActivity(sessionId, user.id);

  next();
};

/**
 * Optional: Middleware for role-based access control
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const user = req.user as any;
    if (!user.role || !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
};

/**
 * Hybrid authentication - accepts either session OR JWT token
 * Tries JWT first, falls back to session
 */
export const isAuthenticatedHybrid = (req: Request, res: Response, next: NextFunction): void => {
  // Try JWT authentication first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = JWTService.verifyAccessToken(token);
      // Attach JWT payload to request as user-like object
      (req as any).jwtPayload = decoded;
      (req as any).authMethod = 'jwt';
      next();
      return;
    } catch (error) {
      logger.debug('JWT validation failed, trying session:', error);
    }
  }

  // Fall back to session authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    (req as any).authMethod = 'session';
    next();
    return;
  }

  res.status(401).json({
    success: false,
    message: 'Authentication required. Use session or Bearer token.',
    code: 'UNAUTHORIZED'
  });
};

/**
 * Hybrid role-based access control - works with both session and JWT
 */
export const requireRoleHybrid = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated (either session or JWT)
    const isSessionAuth = req.isAuthenticated && req.isAuthenticated();
    const isJWTAuth = (req as any).jwtPayload;

    if (!isSessionAuth && !isJWTAuth) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    // Get user role from either source
    const userRole = isJWTAuth ? (req as any).jwtPayload.role : (req.user as any)?.role;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
};
