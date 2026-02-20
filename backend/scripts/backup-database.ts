#!/usr/bin/env node
/**
 * Script de sauvegarde de base de données NetAdmin via Node.js/PostgreSQL
 * Ne dépend pas de pg_dump (qui doit être installé)
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'admin';
const DB_NAME = process.env.DB_NAME || 'netadmin';
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Créer le dossier backups s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
  let client: Client | null = null;
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);
    
    console.log('🔄 Démarrage de la sauvegarde...');
    console.log(`📁 Fichier de destination: ${backupFile}`);
    console.log(`🔐 Connexion: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    
    // Créer la connexion
    client = new Client({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });
    
    await client.connect();
    console.log('✅ Connexion établie');
    
    // Récupérer le schéma et les données
    console.log('⏳ Extraction des données...');
    
    let backupSQL = '-- Backup NetAdmin Pro\n';
    backupSQL += `-- Date: ${new Date().toISOString()}\n`;
    backupSQL += `-- Database: ${DB_NAME}\n`;
    backupSQL += '-- -------------------------------------------\n\n';
    
    // 1. Récupérer les noms de toutes les tables
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tableResult.rows.map(r => r.table_name);
    console.log(`📋 ${tables.length} tables trouvées`);
    
    // 2. Dumper chaque table
    for (const table of tables) {
      try {
        // Récupérer la structure
        const structureResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        // Créer la table
        backupSQL += `-- Table: ${table}\n`;
        backupSQL += `DROP TABLE IF EXISTS ${table} CASCADE;\n`;
        
        let createTableSQL = `CREATE TABLE ${table} (`;
        const columns = structureResult.rows;
        
        createTableSQL += columns.map((col: any) => {
          let def = `${col.column_name} ${col.data_type}`;
          if (col.column_default) {
            def += ` DEFAULT ${col.column_default}`;
          }
          if (col.is_nullable === 'NO') {
            def += ` NOT NULL`;
          }
          return def;
        }).join(', ');
        
        createTableSQL += ');\n';
        backupSQL += createTableSQL;
        
        // Récupérer les données
        const dataResult = await client.query(`SELECT * FROM ${table}`);
        
        if (dataResult.rows.length > 0) {
          const columnNames = Object.keys(dataResult.rows[0]);
          
          for (const row of dataResult.rows) {
            const values = columnNames.map((col) => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            });
            
            backupSQL += `INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }
        
        backupSQL += '\n';
        console.log(`  ✓ ${table} (${dataResult.rows.length} lignes)`);
        
      } catch (error: any) {
        console.error(`  ✗ Erreur table ${table}:`, error.message);
      }
    }
    
    // Écrire le fichier
    fs.writeFileSync(backupFile, backupSQL, 'utf8');
    
    // Vérifier la taille
    const stats = fs.statSync(backupFile);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    if (stats.size === 0) {
      console.error('❌ ERREUR: Le fichier de backup est vide!');
      fs.unlinkSync(backupFile);
      process.exit(1);
    }
    
    await client.end();
    
    console.log(`\n✅ Sauvegarde réussie!`);
    console.log(`📊 Taille: ${sizeInKB} KB (${sizeInMB} MB)`);
    console.log(`📁 Chemin: ${backupFile}`);
    
    // Afficher les 5 derniers backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_'))
      .sort()
      .reverse()
      .slice(0, 5);
    
    if (files.length > 0) {
      console.log('\n📋 5 derniers backups:');
      files.forEach(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const fileStats = fs.statSync(filePath);
        const sizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
        console.log(`   • ${file} (${sizeMB} MB)`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ ERREUR BACKUP:');
    console.error(error.message);
    
    if (error.message.includes('password')) {
      console.error('\n💡 Problème de mot de passe:');
      console.error('   • Vérifiez DB_PASSWORD dans .env');
      console.error('   • Vérifiez l\'utilisateur PostgreSQL');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Connexion impossible:');
      console.error('   • PostgreSQL est-il en cours d\'exécution?');
      console.error('   • Vérifiez DB_HOST et DB_PORT dans .env');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {}
    }
  }
}

async function restoreDatabase(backupFile: string) {
  let client: Client | null = null;
  
  try {
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Fichier non trouvé: ${backupFile}`);
      process.exit(1);
    }
    
    console.log(`🔄 Restauration depuis: ${backupFile}`);
    const fileStats = fs.statSync(backupFile);
    const sizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Taille du fichier: ${sizeMB} MB`);
    
    if (!process.argv.includes('--force')) {
      console.warn('⚠️  ATTENTION: Cette opération va écraser la base de données!');
      console.warn('   Utilisez --force pour confirmer');
      process.exit(1);
    }
    
    const sql = fs.readFileSync(backupFile, 'utf8');
    
    client = new Client({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });
    
    await client.connect();
    console.log('✅ Connexion établie');
    console.log('⏳ Restauration en cours...');
    
    // Diviser en statements et exécuter
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r⏳ ${i + 1}/${statements.length} statements`);
        }
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error(`\n✗ Erreur statement ${i}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Restauration réussie! (${statements.length} statements)`);
    
    await client.end();
    
  } catch (error: any) {
    console.error('❌ ERREUR RESTAURATION:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (e) {}
    }
  }
}

// Main
const command = process.argv[2];

if (command === 'restore') {
  const backupFileArg = process.argv[3];
  if (!backupFileArg) {
    console.error('❌ Veuillez spécifier le fichier de backup');
    console.error('Usage: npm run backup:restore -- backup_2024-01-15T10-30-45.sql --force');
    process.exit(1);
  }
  
  const fullPath = path.isAbsolute(backupFileArg) 
    ? backupFileArg 
    : path.join(BACKUP_DIR, backupFileArg);
  
  restoreDatabase(fullPath);
} else {
  backupDatabase();
}
