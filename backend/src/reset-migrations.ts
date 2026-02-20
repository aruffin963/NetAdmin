import { DatabaseService, pool } from './config/database';

async function resetMigrations() {
  try {
    console.log('🔄 Resetting failed migrations...');

    // Supprimer les migrations qui ont échoué
    const deleteQuery = `DELETE FROM schema_migrations WHERE status = 'failed' OR version IN ('007', '009');`;
    await DatabaseService.query(deleteQuery);
    
    console.log('✅ Failed migrations removed from tracking');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetMigrations();
