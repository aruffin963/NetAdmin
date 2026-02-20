import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';
import { DatabaseService } from '../config/database';
import MigrationManager from '../services/migrationManager';

const execAsync = promisify(exec);
const router = Router();

const BACKUP_DIR = join(process.cwd(), 'backups');

// Créer le répertoire de backups s'il n'existe pas
if (!existsSync(BACKUP_DIR)) {
  execAsync(`mkdir -p "${BACKUP_DIR}"`).catch(e => logger.warn('Could not create backups directory:', e));
}

/**
 * GET /api/database/migrations
 * Récupère l'historique des migrations
 */
router.get('/migrations', async (req: Request, res: Response) => {
  try {
    const history = await MigrationManager.getMigrationHistory();
    const pending = MigrationManager.getMigrationFiles().filter(
      m => !history.some(h => h.version === m.version)
    );

    res.json({
      success: true,
      data: {
        executed: history,
        pending: pending,
        total: history.length + pending.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching migrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching migrations',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/database/migrations/run
 * Exécute les migrations en attente
 */
router.post('/migrations/run', async (req: Request, res: Response) => {
  try {
    const result = await MigrationManager.runPendingMigrations();
    
    res.json({
      success: result.failed === 0,
      message: `Migrations completed: ${result.executed} executed, ${result.failed} failed`,
      data: result,
    });
  } catch (error) {
    logger.error('Error running migrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error running migrations',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/database/migrations/rollback
 * Annule la dernière migration
 */
router.post('/migrations/rollback', async (req: Request, res: Response) => {
  try {
    const rolled = await MigrationManager.rollbackLastMigration();
    
    if (!rolled) {
      return res.json({
        success: false,
        message: 'No migrations to rollback',
      });
    }

    res.json({
      success: true,
      message: `Migration ${rolled.version} rolled back`,
      data: rolled,
    });
  } catch (error) {
    logger.error('Error rolling back migration:', error);
    res.status(500).json({
      success: false,
      message: 'Error rolling back migration',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/database/backup
 * Crée une sauvegarde de la base de données
 */
router.post('/backup', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.sql`;
    const backupPath = join(BACKUP_DIR, backupName);

    const dbUser = process.env.DB_USER || 'postgres';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'netadmin';
    const dbPort = process.env.DB_PORT || '5432';
    const dbPassword = process.env.DB_PASSWORD || 'admin';

    logger.info(`🔄 Creating database backup: ${backupName}`);

    // Utilise pg_dump pour créer une sauvegarde
    // Utilise le bon shell selon le système d'exploitation
    const isWindows = process.platform === 'win32';
    let command: string;
    let shellOptions: any;

    if (isWindows) {
      // Sur Windows, utilise cmd.exe et configure les variables d'environnement différemment
      command = `set PGPASSWORD=${dbPassword}&& pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName}`;
      shellOptions = {
        shell: 'cmd.exe',
        env: { ...process.env, PGPASSWORD: dbPassword },
      };
    } else {
      // Sur Unix/Linux, utilise sh
      command = `PGPASSWORD="${dbPassword}" pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName}`;
      shellOptions = {
        shell: '/bin/sh',
        env: { ...process.env, PGPASSWORD: dbPassword },
      };
    }

    // Exécute la commande et redirige la sortie vers un fichier
    const fs = require('fs');
    const { exec } = require('child_process');
    
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const proc = exec(command, shellOptions, (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(error);
        }
        if (stderr && !stderr.includes('warning')) {
          logger.warn('pg_dump warnings:', stderr);
        }
        resolve({ stdout, stderr });
      });
      
      // Redirige stdout vers le fichier
      proc.stdout.pipe(output);
      
      output.on('error', reject);
      output.on('finish', resolve);
    });

    logger.info(`✅ Database backup created: ${backupPath}`);

    res.json({
      success: true,
      message: 'Database backup created successfully',
      data: {
        backupName,
        backupPath,
        timestamp,
      },
    });
  } catch (error) {
    logger.error('❌ Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating database backup',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/database/backups
 * Liste les sauvegardes disponibles
 */
router.get('/backups', (req: Request, res: Response) => {
  try {
    const backups = readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: join(BACKUP_DIR, f),
        size: require('fs').statSync(join(BACKUP_DIR, f)).size,
        created: require('fs').statSync(join(BACKUP_DIR, f)).birthtime,
      }))
      .sort((a, b) => (b.created as any) - (a.created as any));

    res.json({
      success: true,
      data: backups,
      count: backups.length,
    });
  } catch (error) {
    logger.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing backups',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/database/restore
 * Restaure une sauvegarde
 * Body: { backupName: string }
 */
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { backupName } = req.body;

    if (!backupName) {
      return res.status(400).json({
        success: false,
        message: 'backupName is required',
      });
    }

    const backupPath = join(BACKUP_DIR, backupName);

    if (!existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }

    const dbUser = process.env.DB_USER || 'postgres';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'netadmin';
    const dbPort = process.env.DB_PORT || '5432';
    const dbPassword = process.env.DB_PASSWORD || 'admin';

    logger.warn(`⚠️  Starting database restore from: ${backupName}`);

    // Restaure la sauvegarde
    const command = `PGPASSWORD="${dbPassword}" psql -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName} < "${backupPath}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      shell: '/bin/bash',
      env: { ...process.env, PGPASSWORD: dbPassword },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    logger.info(`✅ Database restored successfully from: ${backupName}`);

    res.json({
      success: true,
      message: 'Database restored successfully',
      data: {
        backupName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('❌ Error restoring backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring database backup',
      error: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/database/backups/:name
 * Supprime une sauvegarde
 */
router.delete('/backups/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const backupPath = join(BACKUP_DIR, name);

    if (!existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }

    require('fs').unlinkSync(backupPath);

    logger.info(`✅ Backup deleted: ${name}`);

    res.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting backup',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/database/status
 * Récupère le statut de la base de données
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        datname as database,
        (pg_database_size(datname) / 1024 / 1024)::int as size_mb,
        numbackends as active_connections
      FROM pg_stat_database
      WHERE datname = $1;
    `;

    const result = await DatabaseService.query(query, [process.env.DB_NAME || 'netadmin']);
    const history = await MigrationManager.getMigrationHistory();

    res.json({
      success: true,
      data: {
        database: result.rows[0],
        migrations: {
          total: history.length,
          lastMigration: history[0],
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching database status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching database status',
      error: (error as Error).message,
    });
  }
});

export default router;
