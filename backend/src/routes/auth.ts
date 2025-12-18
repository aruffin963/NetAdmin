import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { SessionService } from '../config/session';
import { logger } from '../utils/logger';
import { ActivityLogService, LogActions, ResourceTypes } from '../services/activityLogService';
import { pool } from '../config/database';

const router = Router();
const sessionService = SessionService.getInstance();

// Login with local database
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
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

    // Find user by email or name (treating as username)
    const userResult = await pool.query(
      'SELECT id, email, password, name, role, is_active FROM users WHERE email = $1 OR name = $1 LIMIT 1',
      [username]
    );

    if (userResult.rows.length === 0) {
      logger.warn(`Login failed - user not found: ${username}`);
      
      ActivityLogService.log({
        username,
        action: LogActions.LOGIN_FAILED,
        resourceType: ResourceTypes.SESSION,
        details: {
          reason: 'User not found',
          method: 'Local'
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'error',
        errorMessage: 'Invalid credentials'
      }).catch((err) => logger.error('Failed to log login attempt:', err));

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
      
      ActivityLogService.log({
        username,
        action: LogActions.LOGIN_FAILED,
        resourceType: ResourceTypes.SESSION,
        details: {
          reason: 'Invalid password',
          method: 'Local'
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'error',
        errorMessage: 'Invalid credentials'
      }).catch((err) => logger.error('Failed to log login attempt:', err));

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
    req.login(sessionUser, { session: true }, (loginErr): void => {
      if (loginErr) {
        logger.error('Session creation error:', loginErr);
        res.status(500).json({
          success: false,
          message: 'Session creation failed',
        });
        return;
      }

      // Update last login
      pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])
        .catch((err) => logger.error('Failed to update last_login:', err));

      // Log successful login
      ActivityLogService.log({
        username: user.name,
        action: LogActions.LOGIN,
        resourceType: ResourceTypes.SESSION,
        details: {
          method: 'Local',
          userId: user.id
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'success'
      }).catch((err) => logger.error('Failed to log login:', err));

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

    ActivityLogService.log({
      username: name,
      action: LogActions.CREATE,
      resourceType: ResourceTypes.USER,
      details: {
        email,
        method: 'Registration'
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      status: 'success'
    }).catch((err) => logger.error('Failed to log registration:', err));

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

    req.session.destroy((destroyErr): void => {
      if (destroyErr) {
        logger.error('Session destruction error:', destroyErr);
      }

      // Log l'action de déconnexion (fire and forget)
      ActivityLogService.log({
        username,
        action: LogActions.LOGOUT,
        resourceType: ResourceTypes.SESSION,
        details: {
          sessionId
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('User-Agent'),
        status: 'success'
      }).catch((logErr) => logger.error('Failed to log logout:', logErr));

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

export default router;