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
   * Récupérer les logs avec pagination et filtres avancés
   */
  static async getLogs(options: {
    limit?: number;
    offset?: number;
    search?: string;
    username?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ logs: any[]; total: number }> {
    try {
      const {
        limit = 50,
        offset = 0,
        search,
        username,
        action,
        resourceType,
        startDate,
        endDate,
        status,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramCount = 1;

      // Full-text search
      if (search) {
        whereConditions.push(
          `(action ILIKE $${paramCount} OR resource_name ILIKE $${paramCount} OR details::text ILIKE $${paramCount})`
        );
        params.push(`%${search}%`);
        paramCount++;
      }

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

      // Déterminer la colonne de tri
      const sortColumn = ['timestamp', 'level', 'category', 'status'].includes(sortBy) 
        ? sortBy === 'timestamp' ? 'created_at' : sortBy
        : 'created_at';

      // Récupérer les logs
      const logsQuery = `
        SELECT * FROM activity_logs
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
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
  static async getStats(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    try {
      const { startDate, endDate } = options;

      let whereClause = '';
      let params: any[] = [];

      if (startDate || endDate) {
        whereClause = ' WHERE ';
        if (startDate) {
          whereClause += `created_at >= $${params.length + 1}`;
          params.push(startDate);
        }
        if (endDate) {
          if (startDate) whereClause += ' AND ';
          whereClause += `created_at <= $${params.length + 1}`;
          params.push(endDate);
        }
      }

      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as error,
          COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning,
          COUNT(CASE WHEN status = 'info' THEN 1 END) as info,
          COUNT(CASE WHEN status = 'debug' THEN 1 END) as debug,
          json_object_agg(resource_type, count) as by_category
        FROM (
          SELECT status, resource_type, COUNT(*) as count
          FROM activity_logs
          ${whereClause}
          GROUP BY status, resource_type
        ) stats
      `;

      const result = await pool.query(query, params);
      const row = result.rows[0];

      return {
        total: parseInt(row.total) || 0,
        byLevel: {
          success: parseInt(row.success) || 0,
          error: parseInt(row.error) || 0,
          warning: parseInt(row.warning) || 0,
          info: parseInt(row.info) || 0,
          debug: parseInt(row.debug) || 0
        },
        byCategory: row.by_category || {}
      };
    } catch (error) {
      logger.error('Failed to get log stats:', error);
      throw error;
    }
  }

  /**
   * Récupérer les catégories disponibles
   */
  static async getCategories(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT resource_type 
        FROM activity_logs 
        WHERE resource_type IS NOT NULL
        ORDER BY resource_type
      `;
      
      const result = await pool.query(query);
      return result.rows.map(row => row.resource_type);
    } catch (error) {
      logger.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Récupérer les sources disponibles
   */
  static async getSources(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT action 
        FROM activity_logs 
        WHERE action IS NOT NULL
        ORDER BY action
        LIMIT 20
      `;
      
      const result = await pool.query(query);
      return result.rows.map(row => row.action);
    } catch (error) {
      logger.error('Failed to get sources:', error);
      return [];
    }
  }

  /**
   * Archiver les logs anciens
   */
  static async archiveLogs(days: number): Promise<number> {
    try {
      // Copier vers une table d'archive si elle existe
      const archiveQuery = `
        INSERT INTO activity_logs_archive 
        SELECT * FROM activity_logs 
        WHERE created_at < NOW() - INTERVAL '${days} days'
        ON CONFLICT DO NOTHING
      `;
      
      try {
        await pool.query(archiveQuery);
      } catch (error) {
        // Table d'archive n'existe pas, ignorer
        logger.debug('Archive table does not exist, skipping archive');
      }

      // Supprimer les logs archivés
      const deleteQuery = `
        DELETE FROM activity_logs 
        WHERE created_at < NOW() - INTERVAL '${days} days'
      `;
      
      const result = await pool.query(deleteQuery);
      const deletedCount = result.rowCount || 0;
      
      logger.info(`Archived ${deletedCount} activity logs older than ${days} days`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to archive logs:', error);
      throw error;
    }
  }

  /**
   * Supprimer les logs selon les filters
   */
  static async deleteLogs(options: {
    status?: string;
    days?: number;
  }): Promise<number> {
    try {
      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramCount = 1;

      if (options.status) {
        whereConditions.push(`status = $${paramCount}`);
        params.push(options.status);
        paramCount++;
      }

      if (options.days) {
        whereConditions.push(`created_at < NOW() - INTERVAL '${options.days} days'`);
      }

      if (whereConditions.length === 0) {
        throw new Error('No delete criteria specified');
      }

      const whereClause = whereConditions.join(' AND ');
      const deleteQuery = `DELETE FROM activity_logs WHERE ${whereClause}`;
      
      const result = await pool.query(deleteQuery, params);
      const deletedCount = result.rowCount || 0;
      
      logger.info(`Deleted ${deletedCount} activity logs`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to delete logs:', error);
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
  REVEAL: 'REVEAL',
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
