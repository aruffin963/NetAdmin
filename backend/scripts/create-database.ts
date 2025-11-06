#!/usr/bin/env node
/**
 * Script simple de création de base de données NetAdmin Pro
 * 
 * Crée juste la base et les tables, sans aucune donnée
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: 'postgres'
};

const TARGET_DB = 'netadmin';

async function createDatabase() {
  console.log('🔨 Création de la base de données NetAdmin...');

  let client: Client | null = null;

  try {
    // Connexion à postgres
    client = new Client(DB_CONFIG);
    await client.connect();
    console.log('✅ Connexion PostgreSQL établie');

    // Créer la base netadmin
    try {
      await client.query(`CREATE DATABASE ${TARGET_DB}`);
      console.log('✅ Base de données netadmin créée');
    } catch (error: any) {
      if (error.code === '42P04') {
        console.log('⚠️  Base netadmin existe déjà');
      } else {
        throw error;
      }
    }

    // Se connecter à la base netadmin
    await client.end();
    client = new Client({ ...DB_CONFIG, database: TARGET_DB });
    await client.connect();

    // Lire et exécuter le schéma
    const schemaPath = path.join(__dirname, '..', 'database.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Fichier database.sql non trouvé: ${schemaPath}`);
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Nettoyer le SQL
    const cleanSQL = schemaSQL
      .replace(/\\c\s+\w+;?\s*/g, '')
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/--.*$/gm, '')
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    // Nettoyer la base avant de recréer les tables
    try {
      await client.query(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
      `);
      console.log('✅ Base nettoyée');
    } catch (error) {
      console.log('⚠️  Nettoyage de base non nécessaire');
    }

    if (cleanSQL) {
      await client.query(cleanSQL);
      console.log('✅ Tables créées');
    }

    // Vérifier les tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Tables créées:');
    result.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

    console.log('\n✅ Base de données prête !');
    console.log('📊 0 données - Tables vides');
    console.log('🚀 Prêt pour vos vraies données');

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
  createDatabase().catch(console.error);
}