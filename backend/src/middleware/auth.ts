import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../config/session';

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
