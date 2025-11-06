# NetAdmin Pro - Guide de Démarrage Rapide

## 🎯 Installation Locale (Développement)

### Prérequis
- Node.js 18.x ou 20.x
- PostgreSQL 14+
- Git

### 1. Cloner le Projet
```bash
git clone https://github.com/votre-username/netadmin-pro.git
cd netadmin-pro
```

### 2. Configuration Base de Données

#### Windows (PowerShell)
```powershell
# Créer la base de données
psql -U postgres
```

#### macOS/Linux (Bash)
```bash
sudo -u postgres psql
```

Puis dans PostgreSQL :
```sql
CREATE DATABASE netadmin;
CREATE USER netadmin WITH ENCRYPTED PASSWORD 'netadmin123';
GRANT ALL PRIVILEGES ON DATABASE netadmin TO netadmin;
\q
```

### 3. Configuration Backend

```bash
cd backend
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres (DB, JWT, etc.)

# Construire le projet
npm run build

# Exécuter les migrations
npm run migrate

# Démarrer le serveur
npm run dev
```

Le backend sera accessible sur `http://localhost:5000`

### 4. Configuration Frontend

```bash
cd ../frontend
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Vérifier que VITE_API_URL=http://localhost:5000/api

# Démarrer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## 🚀 Commandes Utiles

### Backend
```bash
npm run dev          # Mode développement avec hot-reload
npm run build        # Compiler TypeScript
npm start            # Démarrer en production
npm run migrate      # Exécuter les migrations
npm run migrate:down # Annuler la dernière migration
npm test             # Exécuter les tests
npm run lint         # Vérifier le code
```

### Frontend
```bash
npm run dev      # Mode développement avec hot-reload
npm run build    # Compiler pour production
npm run preview  # Prévisualiser le build de production
npm run lint     # Vérifier le code
npm test         # Exécuter les tests
```

## 📝 Premiers Pas

### 1. Connexion Initiale
- URL: `http://localhost:5173`
- Utilisez l'authentification LDAP ou locale selon votre configuration

### 2. Créer une Organisation
1. Aller dans **Organisations**
2. Cliquer sur **Ajouter une Organisation**
3. Remplir le formulaire (nom, domaine, site)

### 3. Gérer les Pools IP
1. Aller dans **Gestion IP**
2. Cliquer sur **Créer un Pool**
3. Définir le réseau (ex: `192.168.1.0/24`)

### 4. Ajouter des Équipements
1. Aller dans **Monitoring**
2. Cliquer sur **Ajouter un Équipement**
3. Renseigner l'IP, type, et informations

### 5. Utiliser le Scanner Réseau
1. Aller dans **Scanner**
2. Entrer une plage d'IP (ex: `192.168.1.1-192.168.1.254`)
3. Cliquer sur **Scanner**

## 🔧 Configuration Avancée

### Variables d'Environnement Backend

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netadmin
DB_USER=netadmin
DB_PASSWORD=netadmin123

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_securise
JWT_EXPIRES_IN=24h

# Serveur
PORT=5000
NODE_ENV=development

# LDAP (Optionnel)
LDAP_URL=ldap://votre-serveur-ldap:389
LDAP_BASE_DN=dc=example,dc=com
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=password
```

### Variables d'Environnement Frontend

```env
# API URL
VITE_API_URL=http://localhost:5000/api

# Configuration App
VITE_APP_NAME=NetAdmin Pro
VITE_APP_VERSION=1.0.0

# Fonctionnalités
VITE_ENABLE_MONITORING=true
VITE_ENABLE_TOPOLOGY=true
VITE_ENABLE_LDAP_AUTH=true

# Mode Debug
VITE_DEBUG_MODE=true
```

## 🐳 Docker (Alternative)

### Avec Docker Compose
```bash
# Construire et démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

Les services seront disponibles :
- Frontend: `http://localhost:80`
- Backend: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

## 🧪 Tests

### Backend
```bash
cd backend
npm test                    # Tous les tests
npm test -- --coverage      # Avec couverture
npm test -- auth.test.ts    # Test spécifique
```

### Frontend
```bash
cd frontend
npm test                    # Tests unitaires
npm run test:e2e           # Tests end-to-end (si configuré)
```

## 📊 Fonctionnalités Principales

### ✅ Gestion IP
- Création et gestion de pools IP
- Attribution/libération d'adresses
- Vue d'ensemble des réseaux
- Calcul de subnetting

### ✅ Monitoring Réseau
- Surveillance d'équipements
- Métriques système (CPU, RAM, réseau)
- Statut en temps réel
- Alertes et notifications

### ✅ Scanner Réseau
- Scan de plages IP
- Détection d'équipements
- Ping et disponibilité
- Import automatique

### ✅ Topologie Réseau
- Vue graphique du réseau
- Relations entre équipements
- Types de connexions
- Visualisation interactive

### ✅ Organisations
- Multi-tenant
- Gestion des sites
- Statistiques par organisation
- Configuration isolée

### ✅ Authentification
- Authentification locale
- Intégration LDAP
- JWT tokens
- Gestion des sessions

### ✅ Logs d'Audit
- Traçabilité complète
- Historique des actions
- Filtres et recherche
- Export de logs

## 🆘 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier la base de données
psql -U netadmin -d netadmin -h localhost

# Vérifier les variables d'environnement
cd backend
cat .env

# Voir les logs
npm run dev
```

### Le frontend ne se connecte pas au backend
1. Vérifier que le backend fonctionne: `curl http://localhost:5000/api/health`
2. Vérifier `VITE_API_URL` dans `frontend/.env`
3. Vérifier la console du navigateur (F12)

### Erreur de migration
```bash
cd backend
# Réinitialiser la base de données
npm run migrate:down
npm run migrate
```

### Port déjà utilisé
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

## 📚 Documentation

- [Guide de Déploiement](DEPLOYMENT.md) - Déploiement en production
- [Guide de Contribution](CONTRIBUTING.md) - Comment contribuer
- [Changelog](CHANGELOG.md) - Historique des versions
- [License](LICENSE) - Licence MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

## 📄 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/votre-username/netadmin-pro/issues)
- **Email**: support@votredomaine.com
- **Documentation**: [Wiki](https://github.com/votre-username/netadmin-pro/wiki)

---

**Note**: Ce guide couvre l'installation locale pour le développement. Pour un déploiement en production, consultez [DEPLOYMENT.md](DEPLOYMENT.md).
