import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface ActivityLogEntry {
  username: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'error' | 'warning';
  errorMessage?: string;
}

export class ActivityLogService {
  /**
   * Enregistrer une action dans les logs
   */
  static async log(entry: ActivityLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO activity_logs (
          username, action, resource_type, resource_id, resource_name,
          details, ip_address, user_agent, status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const values = [
        entry.username,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.resourceName || null,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.status || 'success',
        entry.errorMessage || null
      ];

      await pool.query(query, values);
      
      logger.info('Activity logged', {
        username: entry.username,
        action: entry.action,
        resourceType: entry.resourceType
      });
    } catch (error) {
      logger.error('Failed to log activity:', error);
      // Ne pas propager l'erreur pour éviter de casser l'application
    }
  }

  /**
   * Récupérer les logs avec pagination et filtres
   */
  static async getLogs(options: {
    limit?: number;
    offset?: number;
    username?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  } = {}): Promise<{ logs: any[]; total: number }> {
    try {
      const {
        limit = 50,
        offset = 0,
        username,
        action,
        resourceType,
        startDate,
        endDate,
        status
      } = options;

      const whereConditions: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (username) {
        whereConditions.push(`username ILIKE $${paramCount}`);
        params.push(`%${username}%`);
        paramCount++;
      }

      if (action) {
        whereConditions.push(`action = $${paramCount}`);
        params.push(action);
        paramCount++;
      }

      if (resourceType) {
        whereConditions.push(`resource_type = $${paramCount}`);
        params.push(resourceType);
        paramCount++;
      }

      if (status) {
        whereConditions.push(`status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }

      if (startDate) {
        whereConditions.push(`created_at >= $${paramCount}`);
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        whereConditions.push(`created_at <= $${paramCount}`);
        params.push(endDate);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Compter le total
      const countQuery = `SELECT COUNT(*) FROM activity_logs ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Récupérer les logs
      const logsQuery = `
        SELECT * FROM activity_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      
      const logsResult = await pool.query(logsQuery, [...params, limit, offset]);

      return {
        logs: logsResult.rows,
        total
      };
    } catch (error) {
      logger.error('Failed to get activity logs:', error);
      throw error;
    }
  }

  /**
   * Récupérer les logs récents
   */
  static async getRecentLogs(limit: number = 20): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM activity_logs
        ORDER BY created_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get recent logs:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des logs
   */
  static async getStats(days: number = 7): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_actions,
          COUNT(DISTINCT username) as unique_users,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_actions,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_actions,
          action,
          resource_type,
          COUNT(*) as count
        FROM activity_logs
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY action, resource_type
        ORDER BY count DESC
      `;
      
      const result = await pool.query(query);
      
      const totalQuery = `
        SELECT 
          COUNT(*) as total_actions,
          COUNT(DISTINCT username) as unique_users,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_actions,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_actions
        FROM activity_logs
        WHERE created_at >= NOW() - INTERVAL '${days} days'
      `;
      
      const totalResult = await pool.query(totalQuery);

      return {
        summary: totalResult.rows[0],
        byActionAndResource: result.rows
      };
    } catch (error) {
      logger.error('Failed to get log stats:', error);
      throw error;
    }
  }

  /**
   * Supprimer les anciens logs
   */
  static async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const query = `
        DELETE FROM activity_logs
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      `;
      
      const result = await pool.query(query);
      const deletedCount = result.rowCount || 0;
      
      logger.info(`Cleaned up ${deletedCount} old activity logs (older than ${daysToKeep} days)`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup activity logs:', error);
      throw error;
    }
  }
}

/**
 * Actions communes pour le logging
 */
export const LogActions = {
  // Authentification
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // CRUD opérations
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  
  // Opérations spécifiques
  SCAN: 'SCAN',
  GENERATE: 'GENERATE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  ASSIGN: 'ASSIGN',
  RELEASE: 'RELEASE',
  RESERVE: 'RESERVE'
} as const;

/**
 * Types de ressources
 */
export const ResourceTypes = {
  USER: 'USER',
  ORGANIZATION: 'ORGANIZATION',
  SUBNET: 'SUBNET',
  VLAN: 'VLAN',
  IP_ADDRESS: 'IP_ADDRESS',
  PASSWORD: 'PASSWORD',
  MONITORING: 'MONITORING',
  ALERT: 'ALERT',
  SCAN: 'SCAN',
  SESSION: 'SESSION',
  TOPOLOGY: 'TOPOLOGY',
  CONFIGURATION: 'CONFIGURATION'
} as const;
