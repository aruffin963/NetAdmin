/**
 * Script de test de connexion à la base de données
 */

import { testConnection, DatabaseService } from './config/database';
import { logger } from './utils/logger';

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données NetAdmin Pro...\n');

  try {
    // Test 1: Connexion de base
    console.log('1️⃣ Test de connexion basique...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.log('❌ Échec de la connexion de base');
      process.exit(1);
    }

    // Test 2: Vérification des tables
    console.log('2️⃣ Vérification des tables...');
    const tables = await DatabaseService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('   Tables trouvées:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

    // Test 3: Compter les données
    console.log('3️⃣ Comptage des données...');
    const counts = await Promise.all([
      DatabaseService.query('SELECT COUNT(*) FROM organizations'),
      DatabaseService.query('SELECT COUNT(*) FROM users'),
      DatabaseService.query('SELECT COUNT(*) FROM ip_pools'),
      DatabaseService.query('SELECT COUNT(*) FROM ip_addresses'),
      DatabaseService.query('SELECT COUNT(*) FROM subnets'),
      DatabaseService.query('SELECT COUNT(*) FROM system_logs')
    ]);

    console.log('   Données présentes:');
    console.log(`   • Organizations: ${counts[0].rows[0].count}`);
    console.log(`   • Users: ${counts[1].rows[0].count}`);
    console.log(`   • IP Pools: ${counts[2].rows[0].count}`);
    console.log(`   • IP Addresses: ${counts[3].rows[0].count}`);
    console.log(`   • Subnets: ${counts[4].rows[0].count}`);
    console.log(`   • System Logs: ${counts[5].rows[0].count}`);

    // Test 4: Requête d'exemple
    console.log('4️⃣ Test requête d\'exemple...');
    const sampleOrg = await DatabaseService.query('SELECT name, domain FROM organizations LIMIT 1');
    if (sampleOrg.rows.length > 0) {
      console.log(`   Organisation exemple: ${sampleOrg.rows[0].name} (${sampleOrg.rows[0].domain})`);
    }

    console.log('\n✅ Tous les tests de connexion ont réussi !');
    console.log('🚀 La base de données NetAdmin Pro est opérationnelle.\n');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Exécuter le test si c'est le fichier principal
if (require.main === module) {
  testDatabaseConnection().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default testDatabaseConnection;