import { DatabaseService } from './config/database';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger';

async function runMigrations() {
  try {
    logger.info('Démarrage des migrations...');

    // Migration 006: Table passwords
    const migration006 = readFileSync(join(__dirname, '../migrations/006_create_passwords_table.sql'), 'utf8');
    await DatabaseService.query(migration006);
    logger.info('✅ Migration 006 appliquée: table passwords créée');

    // Migration 007: Tables auth (users, sessions, auto_saves)
    const migration007 = readFileSync(join(__dirname, '../migrations/007_create_auth_tables.sql'), 'utf8');
    await DatabaseService.query(migration007);
    logger.info('✅ Migration 007 appliquée: tables users, sessions, auto_saves créées');

    logger.info('✨ Toutes les migrations ont été appliquées avec succès!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur lors de l\'application des migrations:', error);
    process.exit(1);
  }
}

runMigrations();
