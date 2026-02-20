import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

export interface LoginRecord {
  id: number;
  user_id: number;
  ip_address: string;
  user_agent: string;
  method: 'session' | 'jwt';
  success: boolean;
  failure_reason?: string;
  login_at: Date;
  logout_at?: Date;
  country?: string;
  city?: string;
  device_name?: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message: string;
}

export class UserSecurityService {
  /**
   * Record a login attempt
   */
  static async recordLoginAttempt(
    userId: number,
    method: 'session' | 'jwt',
    ipAddress: string,
    userAgent: string,
    success: boolean = true,
    failureReason?: string
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO login_history 
        (user_id, ip_address, user_agent, method, success, failure_reason, login_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      
      await pool.query(query, [
        userId,
        ipAddress,
        userAgent,
        method,
        success,
        failureReason || null
      ]);

      logger.info(`Login recorded: user=${userId}, method=${method}, success=${success}`);
    } catch (error) {
      logger.error(`Failed to record login attempt: ${error}`);
    }
  }

  /**
   * Get login history for a user (last 10 logins)
   */
  static async getLoginHistory(userId: number, limit: number = 10): Promise<LoginRecord[]> {
    try {
      const query = `
        SELECT 
          id,
          user_id,
          ip_address,
          user_agent,
          method,
          success,
          failure_reason,
          login_at,
          logout_at,
          country,
          city,
          device_name
        FROM login_history
        WHERE user_id = $1
        ORDER BY login_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error(`Failed to get login history: ${error}`);
      return [];
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResult> {
    try {
      // Get current password hash
      const userResult = await pool.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      const passwordHash = userResult.rows[0].password;

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Mot de passe actuel incorrect'
        };
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const updateResult = await pool.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
        [newPasswordHash, userId]
      );

      if (updateResult.rows.length === 0) {
        return {
          success: false,
          message: 'Erreur lors de la mise à jour du mot de passe'
        };
      }

      // Log the password change
      await pool.query(
        `INSERT INTO password_change_history (user_id, changed_at)
         VALUES ($1, NOW())`,
        [userId]
      ).catch(() => {
        // Table might not exist, ignore silently
      });

      logger.info(`Password changed for user ${userId}`);

      return {
        success: true,
        message: 'Mot de passe changé avec succès'
      };
    } catch (error) {
      logger.error(`Failed to change password: ${error}`);
      return {
        success: false,
        message: 'Erreur serveur lors du changement de mot de passe'
      };
    }
  }

  /**
   * Validate password requirements
   */
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une lettre majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une lettre minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Au moins un chiffre');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Au moins un caractère spécial (!@#$%^&*)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
