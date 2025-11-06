import { Pool, PoolConfig } from 'pg';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Configuration PostgreSQL avec plus d'options
const dbConfig: PoolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'netadmin',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// PostgreSQL connection pool
export const pool = new Pool(dbConfig);

// Gestionnaire d'événements pour le pool
pool.on('connect', (client) => {
  logger.info('🔗 New database connection established');
});

pool.on('error', (err, client) => {
  logger.error('❌ Database connection error:', err);
});

// Redis connection
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

/**
 * Classe utilitaire pour les requêtes de base de données
 */
export class DatabaseService {
  /**
   * Exécute une requête SQL avec paramètres et logging
   */
  static async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('SQL Query executed:', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error('SQL Query failed:', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Exécute une transaction
   */
  static async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      logger.debug('Transaction committed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Récupère un enregistrement par ID
   */
  static async findById(table: string, id: string | number, idColumn: string = 'id') {
    const result = await this.query(
      `SELECT * FROM ${table} WHERE ${idColumn} = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Récupère tous les enregistrements d'une table avec pagination
   */
  static async findAll(table: string, options: {
    orderBy?: string;
    limit?: number;
    offset?: number;
    where?: string;
    params?: any[];
  } = {}) {
    const {
      orderBy = 'id',
      limit,
      offset,
      where,
      params = []
    } = options;

    let query = `SELECT * FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    
    const result = await this.query(query, params);
    return result.rows;
  }

  /**
   * Compte les enregistrements d'une table
   */
  static async count(table: string, where?: string, params?: any[]): Promise<number> {
    let query = `SELECT COUNT(*) FROM ${table}`;
    
    if (where) {
      query += ` WHERE ${where}`;
    }
    
    const result = await this.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Insertion d'un nouvel enregistrement
   */
  static async insert(table: string, data: Record<string, any>) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Mise à jour d'un enregistrement
   */
  static async update(table: string, id: string | number, data: Record<string, any>, idColumn: string = 'id') {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE ${idColumn} = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  }

  /**
   * Suppression d'un enregistrement
   */
  static async delete(table: string, id: string | number, idColumn: string = 'id') {
    const result = await this.query(
      `DELETE FROM ${table} WHERE ${idColumn} = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
}

export const connectDatabase = async (): Promise<void> => {
  try {
    // Test de connexion PostgreSQL
    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), version()');
    logger.info('✅ Connected to PostgreSQL database', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    });
    client.release();

    // Test de connexion Redis (optionnel en développement)
    try {
      await redisClient.connect();
      logger.info('✅ Connected to Redis cache');
    } catch (redisError) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️ Redis not available in development mode - continuing without cache');
      } else {
        throw redisError;
      }
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('🚧 Database not available in development mode');
      logger.warn('💡 Run "npm run db:init" to setup the database');
      return;
    } else {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }
};

/**
 * Test de connexion à la base de données
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp, COUNT(*) as pool_count FROM pg_stat_activity WHERE datname = current_database()');
    client.release();
    
    logger.info('✅ Database connection test successful', {
      timestamp: result.rows[0].timestamp,
      active_connections: result.rows[0].pool_count
    });
    return true;
  } catch (error) {
    logger.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Graceful shutdown for database connections
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('🔒 PostgreSQL pool closed');
    
    try {
      await redisClient.quit();
      logger.info('� Redis connection closed');
    } catch (redisError) {
      logger.warn('Redis was not connected, skipping close');
    }
    
    logger.info('�🔌 All database connections closed gracefully');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Export du pool pour utilisation directe
export default pool;