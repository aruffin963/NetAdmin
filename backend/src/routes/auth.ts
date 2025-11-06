import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import passport from '../config/passport';
import { SessionService } from '../config/session';
import { logger } from '../utils/logger';
import { ActivityLogService, LogActions, ResourceTypes } from '../services/activityLogService';

const router = Router();
const sessionService = SessionService.getInstance();

// Login with LDAP
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], (req: Request, res: Response, next: NextFunction): void => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  console.log('Login attempt for username:', req.body.username);
  console.log('LDAP Config:', {
    url: process.env.LDAP_URL,
    bindDN: process.env.LDAP_BIND_DN,
    searchBase: process.env.LDAP_SEARCH_BASE,
    searchFilter: process.env.LDAP_SEARCH_FILTER
  });

  passport.authenticate('ldapauth', { session: false }, (err: any, user: any, info: any): void => {
    console.log('Passport callback - err:', err);
    console.log('Passport callback - user:', user);
    console.log('Passport callback - info:', info);

    if (res.headersSent) {
      return;
    }

    if (err) {
      logger.error('LDAP authentication error:', err);
      res.status(500).json({
        success: false,
        message: 'Authentication server error',
        details: err.message,
      });
      return;
    }

    if (!user) {
      logger.warn('LDAP authentication failed:', info);
      
      // Log l'échec de connexion
      ActivityLogService.log({
        username: req.body.username || 'unknown',
        action: LogActions.LOGIN_FAILED,
        resourceType: ResourceTypes.SESSION,
        details: {
          reason: info?.message || 'Invalid credentials',
          method: 'LDAP'
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'error',
        errorMessage: info?.message || 'Invalid credentials'
      });
      
      res.status(401).json({
        success: false,
        message: info?.message || 'Invalid credentials',
      });
      return;
    }

    // Create session manually
    req.login(user, { session: true }, (loginErr): void => {
      if (loginErr) {
        logger.error('Session creation error:', loginErr);
        res.status(500).json({
          success: false,
          message: 'Failed to create session',
        });
        return;
      }

      logger.info(`User logged in via LDAP: ${user.username}`);

      // Log l'action de connexion
      ActivityLogService.log({
        username: user.username,
        action: LogActions.LOGIN,
        resourceType: ResourceTypes.SESSION,
        details: {
          method: 'LDAP',
          fullName: user.full_name
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'success'
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            lastLogin: user.last_login_at,
          },
          session: {
            expiresIn: 900, // 15 minutes in seconds
          }
        },
      });
    });
  })(req, res, next);
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response): void => {
  const sessionId = req.sessionID;
  const user = (req as any).user;
  const username = user?.username || 'unknown';
  
  req.logout((err): void => {
    if (err) {
      logger.error('Logout error:', err);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
      return;
    }

    req.session.destroy(async (destroyErr): Promise<void> => {
      if (destroyErr) {
        logger.error('Session destruction error:', destroyErr);
      }

      // Log l'action de déconnexion
      await ActivityLogService.log({
        username,
        action: LogActions.LOGOUT,
        resourceType: ResourceTypes.SESSION,
        details: {
          sessionId
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'success'
      });

      // Also clean up from database
      if (sessionId) {
        await sessionService.destroySession(sessionId);
      }

      res.clearCookie('netadmin.sid');
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
    });
  });
});

// Get current user
router.get('/me', (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const user = req.user as any;

  return res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        lastLogin: user.last_login_at,
      },
      session: {
        expiresIn: 900, // 15 minutes
      }
    },
  });
});

// Refresh session (extend expiration)
router.post('/refresh', async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const user = req.user as any;
  const sessionId = req.sessionID;

  // Update session activity
  await sessionService.updateActivity(sessionId, user.id);

  // Touch session to extend expiration
  req.session.touch();

  return res.json({
    success: true,
    message: 'Session refreshed',
    data: {
      expiresIn: 900, // 15 minutes
    },
  });
});

export default router;