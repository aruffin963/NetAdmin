import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { LogActions, ResourceTypes, LogStatus } from '../config/logConfig';
import { isAuthenticated, isAuthenticatedHybrid, requireRoleHybrid } from '../middleware/auth';
import { parsePaginationParams, buildPaginatedResponse } from '../utils/pagination';

const router = Router();

/**
 * GET /api/users - Lister tous les utilisateurs
 */
router.get('/', isAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const paginationParams = parsePaginationParams(req);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM users'
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated users
    const result = await pool.query(
      `SELECT id, email, name, role, is_active, created_at, last_login FROM users 
       ORDER BY ${paginationParams.sortBy === 'name' ? 'name' : 'created_at'} ${paginationParams.sortOrder.toUpperCase()}
       LIMIT ${paginationParams.limit} OFFSET ${paginationParams.offset}`
    );

    const users = result.rows;

    // Log the list action
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          LogActions.LIST,
          ResourceTypes.USER,
          { count: users.length },
          LogStatus.SUCCESS
        );
      } catch (logErr) {
        logger.error('Failed to log user list:', logErr);
      }
    }

    const response = buildPaginatedResponse(
      users,
      paginationParams.page,
      paginationParams.pageSize,
      total,
      'Utilisateurs récupérés avec succès'
    );

    res.json(response);
  } catch (error) {
    logger.error('Error fetching users:', error);

    // Log the error
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          LogActions.LIST,
          ResourceTypes.USER,
          { error: (error as Error).message },
          LogStatus.ERROR
        );
      } catch (logErr) {
        logger.error('Failed to log user list error:', logErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

/**
 * GET /api/users/:id - Obtenir un utilisateur spécifique
 */
router.get('/:id', isAuthenticatedHybrid, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, email, name, role, is_active, created_at, last_login FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const user = result.rows[0];

    // Log the read action
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          LogActions.READ,
          ResourceTypes.USER,
          { userId: id },
          LogStatus.SUCCESS
        );
      } catch (logErr) {
        logger.error('Failed to log user read:', logErr);
      }
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
});

/**
 * POST /api/users - Créer un nouvel utilisateur
 */
router.post('/', isAuthenticatedHybrid, requireRoleHybrid(['admin']), [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
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

  try {
    const { email, name, password, role = 'user' } = req.body;

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, name, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, is_active, created_at',
      [email, hashedPassword, name, role, true]
    );

    const newUser = result.rows[0];

    // Log user creation
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          LogActions.CREATE,
          ResourceTypes.USER,
          {
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
          },
          LogStatus.SUCCESS
        );
      } catch (logErr) {
        logger.error('Failed to log user creation:', logErr);
      }
    }

    logger.info(`User created: ${name} (${email})`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error: any) {
    logger.error('Error creating user:', error);

    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    } else {
      // Log the error
      if ((req as any).logActivity) {
        try {
          await (req as any).logActivity(
            LogActions.CREATE,
            ResourceTypes.USER,
            {
              email: req.body.email,
              error: error.message,
            },
            LogStatus.ERROR
          );
        } catch (logErr) {
          logger.error('Failed to log user creation error:', logErr);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create user',
      });
    }
  }
});

/**
 * PUT /api/users/:id - Modifier un utilisateur
 */
router.put('/:id', isAuthenticatedHybrid, requireRoleHybrid(['admin']), [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('name').optional().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
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

  try {
    const { id } = req.params;
    const { email, name, role, is_active } = req.body;

    // Get old user data for comparison
    const oldUserResult = await pool.query(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [id]
    );

    if (oldUserResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const oldUser = oldUserResult.rows[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
      return;
    }

    values.push(id);

    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, name, role, is_active, updated_at`;

    const result = await pool.query(updateQuery, values);
    const updatedUser = result.rows[0];

    // Track changes
    const changes: any = {};
    if (email !== undefined && oldUser.email !== email) {
      changes.email = { old: oldUser.email, new: email };
    }
    if (name !== undefined && oldUser.name !== name) {
      changes.name = { old: oldUser.name, new: name };
    }
    if (role !== undefined && oldUser.role !== role) {
      changes.role = { old: oldUser.role, new: role };
    }
    if (is_active !== undefined && oldUser.is_active !== is_active) {
      changes.is_active = { old: oldUser.is_active, new: is_active };
    }

    // Log user update
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          LogActions.UPDATE,
          ResourceTypes.USER,
          {
            userId: id,
            changes,
          },
          LogStatus.SUCCESS
        );
      } catch (logErr) {
        logger.error('Failed to log user update:', logErr);
      }
    }

    logger.info(`User updated: ${id}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error: any) {
    logger.error('Error updating user:', error);

    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    } else {
      // Log the error
      if ((req as any).logActivity) {
        try {
          await (req as any).logActivity(
            LogActions.UPDATE,
            ResourceTypes.USER,
            {
              userId: req.params.id,
              error: error.message,
            },
            LogStatus.ERROR
          );
        } catch (logErr) {
          logger.error('Failed to log user update error:', logErr);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update user',
      });
    }
  }
});

/**
 * DELETE /api/users/:id - Supprimer un utilisateur
 */
router.delete('/:id', isAuthenticatedHybrid, requireRoleHybrid(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user before deletion
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const user = userResult.rows[0];

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    // Log user deletion
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          LogActions.DELETE,
          ResourceTypes.USER,
          {
            userId: id,
            userEmail: user.email,
            userName: user.name,
          },
          LogStatus.SUCCESS
        );
      } catch (logErr) {
        logger.error('Failed to log user deletion:', logErr);
      }
    }

    logger.info(`User deleted: ${user.name} (${user.email})`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user:', error);

    // Log the error
    if ((req as any).logActivity) {
      try {
        await (req as any).logActivity(
          LogActions.DELETE,
          ResourceTypes.USER,
          {
            userId: req.params.id,
            error: (error as Error).message,
          },
          LogStatus.ERROR
        );
      } catch (logErr) {
        logger.error('Failed to log user deletion error:', logErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

export default router;
