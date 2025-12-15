#!/usr/bin/env node

/**
 * Script pour générer un hash bcrypt pour le super admin
 * Usage: npx ts-node scripts/generate-admin-hash.ts "votre-mot-de-passe"
 */

import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('❌ Erreur: Veuillez fournir un mot de passe');
  console.error('Usage: npx ts-node scripts/generate-admin-hash.ts "votre-mot-de-passe"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ Erreur: Le mot de passe doit contenir au moins 8 caractères');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n✅ Hash généré avec succès:\n');
console.log(`SUPER_ADMIN_PASSWORD_HASH=${hash}\n`);
console.log('📝 Ajoutez cette ligne à votre fichier .env\n');

// Vérifier le hash
const isMatch = bcrypt.compareSync(password, hash);
console.log(`✓ Vérification: ${isMatch ? '✅ OK' : '❌ Erreur'}`);
console.log('');
