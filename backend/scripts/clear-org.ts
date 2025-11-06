#!/usr/bin/env node
/**
 * Vider les organisations pour tester
 */

import { Client } from 'pg';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: 'netadmin'
};

async function clearOrganizations() {
  console.log('🗑️ Suppression des organisations...');

  let client: Client | null = null;

  try {
    client = new Client(DB_CONFIG);
    await client.connect();

    await client.query('DELETE FROM organizations');
    console.log('✅ Organisations supprimées');

  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

if (require.main === module) {
  clearOrganizations().catch(console.error);
}