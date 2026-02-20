import MigrationManager from './services/migrationManager';
import { logger } from './utils/logger';

async function runMigrations() {
  try {
    const result = await MigrationManager.runPendingMigrations();
    
    if (result.failed === 0) {
      logger.info(`✨ All migrations completed successfully!`);
      process.exit(0);
    } else {
      logger.error(`❌ ${result.failed} migration(s) failed!`);
      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ Fatal error during migrations:', error);
    process.exit(1);
  }
}

runMigrations();
