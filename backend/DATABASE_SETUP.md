# Configuration de la Base de Données NetAdmin Pro

Ce guide explique comment configurer et initialiser la base de données PostgreSQL pour NetAdmin Pro.

## 📋 Prérequis

- **PostgreSQL 13+** installé et en cours d'exécution
- **Node.js 18+** pour les scripts d'initialisation
- **npm/yarn** pour les dépendances

## 🚀 Installation Rapide

### 1. Installation PostgreSQL

#### Windows (avec Chocolatey)
```powershell
choco install postgresql
```

#### Windows (téléchargement direct)
- Télécharger depuis [postgresql.org](https://www.postgresql.org/download/windows/)
- Installer avec les paramètres par défaut
- Noter le mot de passe de l'utilisateur `postgres`

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Configuration des Variables d'Environnement

Créer un fichier `.env` dans le dossier `backend/` :

```env
# Configuration Base de Données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netadmin
DB_USER=postgres
DB_PASSWORD=admin
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# Configuration Redis (optionnel)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

### 3. Initialisation de la Base de Données

#### Option 1: Script Automatique (Recommandé)
```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances si pas déjà fait
npm install

# Initialiser la base de données avec données de test
npm run db:init
```

#### Option 2: Manuel
```bash
# 1. Créer la base de données
psql -U postgres -c "CREATE DATABASE netadmin;"

# 2. Créer les tables
psql -U postgres -d netadmin -f database.sql

# 3. Insérer les données de test
psql -U postgres -d netadmin -f scripts/seed-database.sql
```

## 📊 Données de Démonstration

Après l'initialisation, la base contient :

### 🏢 **3 Organisations**
- **Acme Corporation** (acme.netadmin.pro)
- **TechCorp Solutions** (techcorp.netadmin.pro)  
- **Global Systems Inc** (global.netadmin.pro)

### 👥 **7 Utilisateurs de Test**
- `admin@acme.com` / `admin123` (Admin Acme)
- `network@acme.com` / `admin123` (Network Admin)
- `support@acme.com` / `admin123` (Support)
- `admin@techcorp.com` / `admin123` (Admin TechCorp)
- `tech@techcorp.com` / `admin123` (User)
- `admin@global.com` / `admin123` (Admin Global)
- `ops@global.com` / `admin123` (Network Admin)

### 🌐 **9 Pools IP Configurés**
- **Acme Corp**: LAN Principal (192.168.1.0/24), DMZ (10.0.1.0/24), Management (172.16.0.0/24), Guest WiFi (192.168.100.0/24)
- **TechCorp**: Office Network (192.168.10.0/24), Lab Network (192.168.20.0/24)
- **Global**: Corporate LAN (10.1.0.0/22), Server Farm (10.2.0.0/24), VPN (10.100.0.0/24)

### 📍 **50+ Adresses IP Allouées**
Incluant serveurs, équipements réseau, postes de travail, imprimantes

### 🏷️ **10 Sous-réseaux VLAN**
Configuration VLAN pour différents départements et usages

## 🔧 Scripts Disponibles

```bash
# Initialiser/Réinitialiser la base complète
npm run db:init

# Réinsérer seulement les données de test
npm run db:seed

# Alias pour réinitialisation complète
npm run db:reset
```

## 🗂️ Structure de la Base de Données

### Tables Principales

| Table | Description |
|-------|-------------|
| `organizations` | Organisations multi-tenant |
| `users` | Utilisateurs du système |
| `ip_pools` | Pools d'adresses IP |
| `ip_addresses` | Adresses IP individuelles |
| `subnets` | Sous-réseaux et VLANs |
| `system_logs` | Logs système et audit |

### Relations

```
organizations (1) ←→ (N) users
organizations (1) ←→ (N) ip_pools  
organizations (1) ←→ (N) subnets
ip_pools (1) ←→ (N) ip_addresses
users (1) ←→ (N) system_logs
```

## 🧪 Test de Connexion

Pour tester la connexion à la base de données :

```bash
# Depuis le dossier backend
node -e "
const { testConnection } = require('./dist/config/database.js');
testConnection().then(success => {
  console.log(success ? '✅ Connexion OK' : '❌ Connexion KO');
  process.exit(success ? 0 : 1);
});
"
```

## 🐛 Dépannage

### Erreur de Connexion
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Vérifier que PostgreSQL est démarré
```bash
# Windows
net start postgresql-x64-13

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Erreur d'Authentification
```bash
Error: password authentication failed for user "postgres"
```
**Solutions**:
1. Vérifier le mot de passe dans `.env`
2. Réinitialiser le mot de passe PostgreSQL
3. Modifier `pg_hba.conf` pour autoriser les connexions locales

### Base de Données Non Trouvée
```bash
Error: database "netadmin" does not exist
```
**Solution**: Créer manuellement la base
```bash
psql -U postgres -c "CREATE DATABASE netadmin;"
```

### Permission Denied
```bash
Error: permission denied for relation
```
**Solution**: Vérifier les permissions utilisateur PostgreSQL

## 📈 Monitoring

### Vérifier l'État de la Base
```sql
-- Connexions actives
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'netadmin';

-- Taille de la base
SELECT pg_size_pretty(pg_database_size('netadmin'));

-- Tables et leurs tailles  
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals
FROM pg_stats 
WHERE schemaname = 'public';
```

### Statistiques des Données
```sql
-- Comptage par table
SELECT 'organizations' as table_name, COUNT(*) FROM organizations
UNION ALL SELECT 'users', COUNT(*) FROM users  
UNION ALL SELECT 'ip_pools', COUNT(*) FROM ip_pools
UNION ALL SELECT 'ip_addresses', COUNT(*) FROM ip_addresses
UNION ALL SELECT 'subnets', COUNT(*) FROM subnets
UNION ALL SELECT 'system_logs', COUNT(*) FROM system_logs;
```

## 🔄 Migration et Sauvegarde

### Sauvegarde
```bash
# Sauvegarde complète
pg_dump -U postgres -h localhost netadmin > backup.sql

# Sauvegarde données seulement
pg_dump -U postgres -h localhost --data-only netadmin > data-backup.sql
```

### Restauration
```bash
# Restauration complète
psql -U postgres -h localhost netadmin < backup.sql

# Restauration données seulement
psql -U postgres -h localhost netadmin < data-backup.sql
```

## 🚀 Prêt pour la Production

Pour passer en production :

1. **Modifier les variables d'environnement**
2. **Configurer SSL** pour PostgreSQL
3. **Mettre en place les sauvegardes automatiques**
4. **Configurer la monitoring** des performances
5. **Activer les logs d'audit**

La base de données NetAdmin Pro est maintenant prête pour servir des données réelles ! 🎉