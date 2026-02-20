import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { SessionService } from '../config/session';
import { JWTService } from '../services/jwtService';
import TwoFactorAuthService from '../services/twoFactorAuthService';
import { UserSecurityService } from '../services/userSecurityService';
import { logger } from '../utils/logger';
import { ActivityLogService, LogActions, ResourceTypes } from '../services/activityLogService';
import { LogActions as ConfigLogActions, ResourceTypes as ConfigResourceTypes, LogStatus } from '../config/logConfig';
import { pool } from '../config/database';
import { isAuthenticatedHybrid } from '../middleware/auth';

const router = Router();
const sessionService = SessionService.getInstance();

// Login with local database
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response): Promise<void> => {
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

  const { username, password } = req.body;

  try {
    console.log('Login attempt for username:', username);

    // Find user by email or username
    const userResult = await pool.query(
      'SELECT id, email, username, password, name, role, is_active, two_fa_enabled FROM users WHERE email = $1 OR username = $1 LIMIT 1',
      [username]
    );

    if (userResult.rows.length === 0) {
      logger.warn(`Login failed - user not found: ${username}`);
      
      // Log failed login attempt
      if ((req as any).logActivity) {
        try {
          await (req as any).logActivity(
            ConfigLogActions.LOGIN,
            ConfigResourceTypes.ACCOUNT,
            {
              reason: 'User not found',
              method: 'Local'
            },
            LogStatus.WARNING
          );
        } catch (logErr) {
          logger.error('Failed to log login attempt:', logErr);
        }
      }

      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      logger.warn(`Login failed - user inactive: ${username}`);
      res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
      return;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn(`Login failed - invalid password: ${username}`);
      
      // Log failed login attempt
      if ((req as any).logActivity) {
        try {
          await (req as any).logActivity(
            ConfigLogActions.LOGIN,
            ConfigResourceTypes.ACCOUNT,
            {
              reason: 'Invalid password',
              method: 'Local'
            },
            LogStatus.WARNING
          );
        } catch (logErr) {
          logger.error('Failed to log login attempt:', logErr);
        }
      }

      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Create user object for session
    const sessionUser: Express.User = {
      id: user.id,
      username: user.name,
      email: user.email,
      full_name: user.name,
      is_active: user.is_active,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Create session
    req.login(sessionUser, { session: true }, async (loginErr): Promise<void> => {
      if (loginErr) {
        logger.error('Session creation error:', loginErr);
        res.status(500).json({
          success: false,
          message: 'Session creation failed',
        });
        return;
      }

      // Check if 2FA is enabled
      try {
        const is2FAEnabled = await TwoFactorAuthService.isTwoFactorEnabled(user.id);
        
        if (is2FAEnabled) {
          // 2FA is enabled - don't complete login yet, return 403 with requires2FA flag
          logger.info(`2FA required for user: ${user.name}`);
          
          res.status(403).json({
            success: false,
            message: 'Two-factor authentication required',
            requires2FA: true,
            data: {
              userId: user.id,
              username: user.name,
              email: user.email,
            }
          });
          return;
        }
      } catch (error) {
        logger.error('Error checking 2FA status:', error);
        // Continue without 2FA check if there's an error
      }

      // Update last login
      pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])
        .catch((err) => logger.error('Failed to update last_login:', err));

      // Log successful login using middleware
      if ((req as any).logActivity) {
        try {
          await (req as any).logActivity(
            ConfigLogActions.LOGIN,
            ConfigResourceTypes.ACCOUNT,
            {
              method: 'Local',
              userId: user.id
            },
            LogStatus.SUCCESS
          );
        } catch (logErr) {
          logger.error('Failed to log login:', logErr);
        }
      }

      logger.info(`User logged in: ${user.name}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.name,
            email: user.email,
            fullName: user.name,
            role: user.role,
          }
        }
      });
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
});

// Create a new user (development only)
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  const { email, name, password } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [email, hashedPassword, name, 'user', true]
    );

    const newUser = result.rows[0];

    logger.info(`New user created: ${name} (${email})`);

    // Log user creation using middleware
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          ConfigLogActions.CREATE,
          ConfigResourceTypes.USER,
          {
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name
          },
          LogStatus.SUCCESS
        );
      } catch (logErr) {
        logger.error('Failed to log user creation:', logErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    } else {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response): void => {
  const sessionId = req.sessionID;
  const user = (req as any).user;
  const username = user?.username || 'unknown';
  
  req.logout((err: Error | null): void => {
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

      // Log logout using middleware
      if ((req as any).logActivity) {
        try {
          await (req as any).logActivity(
            ConfigLogActions.LOGOUT,
            ConfigResourceTypes.ACCOUNT,
            { sessionId },
            LogStatus.SUCCESS
          );
        } catch (logErr) {
          logger.error('Failed to log logout:', logErr);
        }
      }

      // Also clean up from database
      if (sessionId) {
        sessionService.destroySession(sessionId).catch((dbErr) => logger.error('Failed to destroy session:', dbErr));
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
        username: user.name,
        email: user.email,
        fullName: user.name,
        lastLogin: user.last_login,
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

// ============= JWT ENDPOINTS =============

/**
 * POST /api/auth/jwt/login
 * Login with JWT tokens (stateless authentication)
 */
router.post('/jwt/login', [
  body('username').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  const { username, password } = req.body;

  try {
    logger.info(`JWT login attempt for username: ${username}`);

    // Find user by email or username
    const userResult = await pool.query(
      'SELECT id, email, username, password, name, role, is_active, two_fa_enabled FROM users WHERE email = $1 OR username = $1 LIMIT 1',
      [username]
    );

    if (userResult.rows.length === 0) {
      logger.warn(`JWT login failed - user not found: ${username}`);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      logger.warn(`JWT login failed - user inactive: ${username}`);
      res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
      return;
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logger.warn(`JWT login failed - invalid password: ${username}`);
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if 2FA is enabled
    try {
      const is2FAEnabled = await TwoFactorAuthService.isTwoFactorEnabled(user.id);
      
      if (is2FAEnabled) {
        // 2FA is enabled - don't issue JWT tokens yet, return 403 with requires2FA flag
        logger.info(`2FA required for JWT login: ${user.username || user.name}`);
        
        res.status(403).json({
          success: false,
          message: 'Two-factor authentication required',
          requires2FA: true,
          data: {
            userId: user.id,
            username: user.username || user.name,
            email: user.email,
          }
        });
        return;
      }
    } catch (error) {
      logger.error('Error checking 2FA status:', error);
      // Continue without 2FA check if there's an error
    }

    // Generate JWT tokens
    const tokenPair = JWTService.generateTokenPair({
      id: user.id,
      username: user.username || user.name,
      email: user.email,
      role: user.role,
    });

    // Update last login
    pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])
      .catch((err) => logger.error('Failed to update last_login:', err));

    logger.info(`User logged in via JWT: ${user.username || user.name}`);

    // Log successful JWT login
    try {
      await ActivityLogService.log({
        username: user.username || user.name,
        action: ConfigLogActions.LOGIN,
        resourceType: ConfigResourceTypes.ACCOUNT,
        details: {
          method: 'JWT',
          userId: user.id,
          email: user.email
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: LogStatus.SUCCESS
      });
    } catch (logErr) {
      logger.error('Failed to log JWT login:', logErr);
    }

    res.status(200).json({
      success: true,
      message: 'JWT login successful',
      data: {
        user: {
          id: user.id,
          username: user.username || user.name,
          email: user.email,
          role: user.role,
        },
        tokens: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: tokenPair.expiresIn,
        },
      },
    });
  } catch (error) {
    logger.error('JWT login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
});

/**
 * POST /api/auth/jwt/refresh
 * Refresh access token using refresh token
 */
router.post('/jwt/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  const { refreshToken } = req.body;

  try {
    const newAccessToken = JWTService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      data: {
        accessToken: newAccessToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      },
    });
  } catch (error) {
    logger.error('JWT refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
});

/**
 * POST /api/auth/jwt/verify
 * Verify if a JWT token is valid
 */
router.post('/jwt/verify', [
  body('token').notEmpty().withMessage('Token is required'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }

  const { token } = req.body;

  try {
    const decoded = JWTService.verifyAccessToken(token);

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (error) {
    logger.warn('JWT verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 */
router.post('/change-password', [
  isAuthenticatedHybrid,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain digit')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain special character (!@#$%^&*)'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg),
    });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  // Get userId from either JWT or session auth
  const userId = (req as any).jwtPayload?.userId || (req.user as any).id;

  try {
    const result = await UserSecurityService.changePassword(userId, currentPassword, newPassword);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
      logger.info(`Password changed for user ${userId}`);
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error(`Failed to change password: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/auth/login-history
 * Get login history for authenticated user
 */
router.get('/login-history', isAuthenticatedHybrid, async (req: Request, res: Response): Promise<void> => {
  // Get userId from either JWT or session auth
  const userId = (req as any).jwtPayload?.userId || (req.user as any).id;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  try {
    const loginHistory = await UserSecurityService.getLoginHistory(userId, limit);
    
    res.status(200).json({
      success: true,
      data: loginHistory,
      count: loginHistory.length
    });
  } catch (error) {
    logger.error(`Failed to get login history: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;