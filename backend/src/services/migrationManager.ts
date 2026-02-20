import { DatabaseService, pool } from '../config/database';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

/**
 * Classe pour gérer les migrations de base de données
 * Supporte le versionning, le tracking et l'auto-exécution
 */
export class MigrationManager {
  private static readonly MIGRATIONS_TABLE = 'schema_migrations';
  private static readonly MIGRATIONS_DIR = join(__dirname, '../../migrations');

  /**
   * Initialise la table de tracking des migrations
   */
  static async initializeMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_ms INTEGER,
        status VARCHAR(50) DEFAULT 'success'
      );
    `;

    try {
      await DatabaseService.query(query);
      logger.info(`✅ Migrations tracking table initialized`);
    } catch (error) {
      logger.error('❌ Error initializing migrations table:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les migrations qui ont été exécutées
   */
  static async getExecutedMigrations(): Promise<any[]> {
    const query = `SELECT version, name, executed_at, status FROM ${this.MIGRATIONS_TABLE} ORDER BY executed_at ASC;`;
    
    try {
      const result = await DatabaseService.query(query);
      return result.rows;
    } catch (error) {
      logger.warn('⚠️  Could not fetch executed migrations:', error);
      return [];
    }
  }

  /**
   * Récupère les fichiers de migration disponibles
   */
  static getMigrationFiles(): { version: string; name: string; path: string }[] {
    try {
      const files = readdirSync(this.MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();

      return files.map(file => {
        const match = file.match(/^(\d+)_(.+)\.sql$/);
        if (!match) return null;
        
        return {
          version: match[1],
          name: match[2],
          path: join(this.MIGRATIONS_DIR, file),
        };
      }).filter(m => m !== null) as any[];
    } catch (error) {
      logger.warn('⚠️  Could not read migration files:', error);
      return [];
    }
  }

  /**
   * Exécute une migration spécifique
   */
  static async executeMigration(version: string, name: string, filePath: string): Promise<{ success: boolean; duration: number }> {
    const startTime = Date.now();

    try {
      // Vérifie si la migration a déjà été exécutée
      const checkQuery = `SELECT id FROM ${this.MIGRATIONS_TABLE} WHERE version = $1;`;
      const checkResult = await DatabaseService.query(checkQuery, [version]);

      if (checkResult.rows.length > 0) {
        logger.info(`⏭️  Migration ${version} already executed, skipping...`);
        return { success: false, duration: 0 };
      }

      // Lit et exécute le fichier de migration
      const migrationSQL = readFileSync(filePath, 'utf8');
      await DatabaseService.query(migrationSQL);

      // Enregistre la migration dans la table de tracking
      const duration = Date.now() - startTime;
      const insertQuery = `
        INSERT INTO ${this.MIGRATIONS_TABLE} (version, name, duration_ms, status)
        VALUES ($1, $2, $3, 'success')
        ON CONFLICT (version) DO NOTHING;
      `;

      await DatabaseService.query(insertQuery, [version, name, duration]);

      logger.info(`✅ Migration ${version} (${name}) executed successfully in ${duration}ms`);
      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Enregistre l'échec
      const insertQuery = `
        INSERT INTO ${this.MIGRATIONS_TABLE} (version, name, duration_ms, status)
        VALUES ($1, $2, $3, 'failed')
        ON CONFLICT (version) DO NOTHING;
      `;

      try {
        await DatabaseService.query(insertQuery, [version, name, duration]);
      } catch (e) {
        logger.error('Could not record migration failure:', e);
      }

      logger.error(`❌ Migration ${version} (${name}) failed:`, error);
      throw error;
    }
  }

  /**
   * Exécute toutes les migrations en attente
   */
  static async runPendingMigrations(): Promise<{ total: number; executed: number; failed: number }> {
    logger.info('🔄 Starting database migrations...');

    try {
      // Initialise la table de tracking
      await this.initializeMigrationsTable();

      // Récupère les migrations exécutées et disponibles
      const executed = await this.getExecutedMigrations();
      const executedVersions = new Set(executed.map(m => m.version));
      const availableMigrations = this.getMigrationFiles();

      logger.info(`📊 Found ${availableMigrations.length} total migrations, ${executed.length} already executed`);

      let executedCount = 0;
      let failedCount = 0;

      // Exécute les migrations en attente
      for (const migration of availableMigrations) {
        if (!executedVersions.has(migration.version)) {
          try {
            const result = await this.executeMigration(migration.version, migration.name, migration.path);
            if (result.success) {
              executedCount++;
            }
          } catch (error) {
            failedCount++;
            logger.error(`❌ Failed to execute migration ${migration.version}`);
            // Continue avec les autres migrations
          }
        }
      }

      logger.info(`\n✨ Migrations completed: ${executedCount} executed, ${failedCount} failed`);
      return { total: availableMigrations.length, executed: executedCount, failed: failedCount };
    } catch (error) {
      logger.error('❌ Fatal error during migrations:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des migrations
   */
  static async getMigrationHistory(): Promise<any[]> {
    const query = `
      SELECT 
        version, 
        name, 
        executed_at, 
        duration_ms, 
        status
      FROM ${this.MIGRATIONS_TABLE}
      ORDER BY executed_at DESC;
    `;

    try {
      const result = await DatabaseService.query(query);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching migration history:', error);
      return [];
    }
  }

  /**
   * Annule la dernière migration (rollback)
   */
  static async rollbackLastMigration(): Promise<{ version: string; name: string } | null> {
    const query = `
      SELECT version, name FROM ${this.MIGRATIONS_TABLE}
      WHERE status = 'success'
      ORDER BY executed_at DESC
      LIMIT 1;
    `;

    try {
      const result = await DatabaseService.query(query);
      
      if (result.rows.length === 0) {
        logger.warn('⚠️  No migrations to rollback');
        return null;
      }

      const { version, name } = result.rows[0];
      const rollbackFile = join(this.MIGRATIONS_DIR, `${version}_${name}.rollback.sql`);

      try {
        const rollbackSQL = readFileSync(rollbackFile, 'utf8');
        await DatabaseService.query(rollbackSQL);

        // Supprime le record de migration
        const deleteQuery = `DELETE FROM ${this.MIGRATIONS_TABLE} WHERE version = $1;`;
        await DatabaseService.query(deleteQuery, [version]);

        logger.info(`✅ Rolled back migration ${version} (${name})`);
        return { version, name };
      } catch (error) {
        logger.error(`❌ Rollback file not found or error: ${rollbackFile}`, error);
        throw new Error(`No rollback file found for migration ${version}`);
      }
    } catch (error) {
      logger.error('❌ Error during rollback:', error);
      throw error;
    }
  }
}

export default MigrationManager;
