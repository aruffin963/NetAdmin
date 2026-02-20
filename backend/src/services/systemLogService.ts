import { pool } from '../config/database';
import { logger } from '../utils/logger';

export interface SystemLogEntry {
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  logType: 'console' | 'application' | 'security' | 'performance' | 'integration';
  category?: string;
  message: string;
  source?: string;
  stackTrace?: string;
  metadata?: any;
  userId?: number;
  username?: string;
  ipAddress?: string;
  sessionId?: string;
  environment?: string;
  version?: string;
}

export class SystemLogService {
  /**
   * Log une entrée système
   */
  static async log(entry: SystemLogEntry): Promise<number | null> {
    try {
      const query = `
        INSERT INTO system_logs (
          log_level, log_type, category, message, source, stack_trace,
          metadata, user_id, username, ip_address, session_id, environment, version,
          expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                  CURRENT_TIMESTAMP + INTERVAL '180 days')
        RETURNING id
      `;

      const values = [
        entry.logLevel,
        entry.logType,
        entry.category || null,
        entry.message,
        entry.source || null,
        entry.stackTrace || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.userId || null,
        entry.username || null,
        entry.ipAddress || null,
        entry.sessionId || null,
        entry.environment || (process.env.NODE_ENV || 'development'),
        entry.version || process.env.APP_VERSION || '1.0.0'
      ];

      const result = await pool.query(query, values);
      return result.rows[0]?.id || null;
    } catch (error) {
      logger.error('Failed to log system entry:', error);
      return null;
    }
  }

  /**
   * Récupérer les logs système avec pagination et filtres
   */
  static async getLogs(options: {
    limit?: number;
    offset?: number;
    logLevel?: string;
    logType?: string;
    category?: string;
    username?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ logs: any[]; total: number }> {
    try {
      const limit = Math.min(options.limit || 50, 500);
      const offset = options.offset || 0;
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = (options.sortOrder || 'desc').toUpperCase();

      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramCount = 1;

      if (options.logLevel) {
        whereConditions.push(`log_level = $${paramCount}`);
        params.push(options.logLevel);
        paramCount++;
      }

      if (options.logType) {
        whereConditions.push(`log_type = $${paramCount}`);
        params.push(options.logType);
        paramCount++;
      }

      if (options.category) {
        whereConditions.push(`category = $${paramCount}`);
        params.push(options.category);
        paramCount++;
      }

      if (options.username) {
        whereConditions.push(`username ILIKE $${paramCount}`);
        params.push(`%${options.username}%`);
        paramCount++;
      }

      if (options.startDate) {
        whereConditions.push(`created_at >= $${paramCount}`);
        params.push(options.startDate);
        paramCount++;
      }

      if (options.endDate) {
        whereConditions.push(`created_at <= $${paramCount}`);
        params.push(options.endDate);
        paramCount++;
      }

      if (options.search) {
        whereConditions.push(`message ILIKE $${paramCount}`);
        params.push(`%${options.search}%`);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Total count
      const countQuery = `SELECT COUNT(*) as total FROM system_logs ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total, 10);

      // Query logs
      const logsQuery = `
        SELECT 
          id, log_level, log_type, category, message, source, stack_trace,
          metadata, user_id, username, ip_address, session_id, 
          environment, version, created_at
        FROM system_logs
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      const logsParams = [...params, limit, offset];
      const logsResult = await pool.query(logsQuery, logsParams);

      return {
        logs: logsResult.rows,
        total
      };
    } catch (error) {
      logger.error('Failed to retrieve system logs:', error);
      throw error;
    }
  }

  /**
   * Récupérer les logs récents
   */
  static async getRecentLogs(limit: number = 100): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, log_level, log_type, category, message, source, stack_trace,
          metadata, user_id, username, ip_address, environment, version, created_at
        FROM system_logs
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [Math.min(limit, 1000)]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to retrieve recent logs:', error);
      return [];
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
      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramCount = 1;

      if (options.startDate) {
        whereConditions.push(`created_at >= $${paramCount}`);
        params.push(options.startDate);
        paramCount++;
      }

      if (options.endDate) {
        whereConditions.push(`created_at <= $${paramCount}`);
        params.push(options.endDate);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          log_level,
          log_type,
          COUNT(*) as count
        FROM system_logs
        ${whereClause}
        GROUP BY log_level, log_type
        ORDER BY log_level, log_type
      `;

      const result = await pool.query(query, params);

      const stats = {
        total: 0,
        byLevel: {
          debug: 0,
          info: 0,
          warn: 0,
          error: 0,
          fatal: 0
        },
        byType: {} as Record<string, number>
      };

      result.rows.forEach((row: any) => {
        stats.total += parseInt(row.count, 10);
        const logLevel = row.log_level as keyof typeof stats.byLevel;
        if (logLevel in stats.byLevel) {
          stats.byLevel[logLevel] += parseInt(row.count, 10);
        }
        const logType = row.log_type as string;
        if (!stats.byType[logType]) {
          stats.byType[logType] = 0;
        }
        stats.byType[logType] += parseInt(row.count, 10);
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get system logs stats:', error);
      return {
        total: 0,
        byLevel: { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
        byType: {}
      };
    }
  }

  /**
   * Archiver les vieux logs
   */
  static async archiveOldLogs(): Promise<number> {
    try {
      const query = `SELECT archived_count FROM archive_old_logs()`;
      const result = await pool.query(query);
      const archivedCount = result.rows[0]?.archived_count || 0;

      logger.info(`Archived ${archivedCount} old system logs`);
      return archivedCount;
    } catch (error) {
      logger.error('Failed to archive old logs:', error);
      return 0;
    }
  }

  /**
   * Supprimer les logs selon les critères
   */
  static async deleteLogs(options: {
    logLevel?: string;
    logType?: string;
    daysToKeep?: number;
  }): Promise<number> {
    try {
      let whereConditions: string[] = [];
      let params: any[] = [];
      let paramCount = 1;

      if (options.logLevel) {
        whereConditions.push(`log_level = $${paramCount}`);
        params.push(options.logLevel);
        paramCount++;
      }

      if (options.logType) {
        whereConditions.push(`log_type = $${paramCount}`);
        params.push(options.logType);
        paramCount++;
      }

      if (options.daysToKeep) {
        whereConditions.push(`created_at < NOW() - INTERVAL '${options.daysToKeep} days'`);
      }

      if (whereConditions.length === 0) {
        throw new Error('No delete criteria specified');
      }

      const whereClause = whereConditions.join(' AND ');
      const query = `DELETE FROM system_logs WHERE ${whereClause}`;

      const result = await pool.query(query, params);
      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to delete logs:', error);
      throw error;
    }
  }

  /**
   * Obtenir les catégories disponibles
   */
  static async getCategories(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT category 
        FROM system_logs 
        WHERE category IS NOT NULL
        ORDER BY category
      `;

      const result = await pool.query(query);
      return result.rows.map(row => row.category);
    } catch (error) {
      logger.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Obtenir les sources disponibles
   */
  static async getSources(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT source 
        FROM system_logs 
        WHERE source IS NOT NULL
        ORDER BY source
        LIMIT 50
      `;

      const result = await pool.query(query);
      return result.rows.map(row => row.source);
    } catch (error) {
      logger.error('Failed to get sources:', error);
      return [];
    }
  }
}
