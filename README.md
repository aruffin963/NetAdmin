# NetAdmin Pro 🌐

<div align="center">

![NetAdmin Pro](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-18.x%20|%2020.x-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)

**Plateforme complète de gestion réseau et d'administration IP**

[Démarrage Rapide](#-démarrage-rapide) • [Fonctionnalités](#-fonctionnalités) • [Documentation](#-documentation) • [Contribution](#-contribution)

</div>

---

## 🎯 Description

**NetAdmin Pro** est une plateforme moderne et complète de gestion réseau conçue pour les ingénieurs et administrateurs réseau. Elle offre une suite d'outils professionnels pour la gestion d'adresses IP, le monitoring d'équipements, la surveillance système, et la visualisation de topologie réseau.

### ✨ Points Forts

- 🎨 **Interface moderne** avec Material-UI et design responsive
- 🔐 **Authentification flexible** (locale + LDAP)
- 🏢 **Multi-tenant** avec gestion d'organisations
- 📊 **Dashboard temps réel** avec métriques système
- 🔍 **Scanner réseau** avec détection automatique
- 📈 **Monitoring équipements** avec alertes
- 🗺️ **Topologie réseau** interactive
- 📝 **Logs d'audit** complets et traçables
- 🔧 **API REST** complète et documentée

## 🏗️ Architecture

### Stack Technique

#### Backend
- **Runtime** : Node.js 18.x / 20.x
- **Framework** : Express.js avec TypeScript
- **Base de données** : PostgreSQL 14+
- **Cache** : Redis (optionnel)
- **Authentification** : JWT + Passport.js (LDAP)
- **ORM** : Native SQL avec migrations
- **Monitoring** : systeminformation
- **Network** : ping library pour tests réseau

#### Frontend
- **Framework** : React 18 avec TypeScript
- **UI Library** : Material-UI (MUI)
- **State Management** : React Query + Context API
- **Routing** : React Router v6
- **Build Tool** : Vite
- **Charts** : Recharts
- **Network Viz** : React Flow

#### DevOps
- **CI/CD** : GitHub Actions
- **Process Manager** : PM2
- **Reverse Proxy** : Nginx
- **Containerization** : Docker (optionnel)
- **Testing** : Jest + React Testing Library

### Structure du Projet

```
NetAdmin/
├── backend/                    # API Node.js/Express
│   ├── src/
│   │   ├── config/            # Configuration (DB, LDAP, JWT)
│   │   ├── middleware/        # Auth, logging, error handling
│   │   ├── routes/            # Routes API REST
│   │   ├── services/          # Business logic
│   │   ├── types/             # Types TypeScript
│   │   └── index.ts           # Entry point
│   ├── migrations/            # Database migrations
│   ├── dist/                  # Compiled JavaScript
│   └── package.json
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   ├── pages/             # Pages principales
│   │   ├── hooks/             # Custom hooks (API, auth)
│   │   ├── context/           # Context providers
│   │   ├── types/             # Types TypeScript
│   │   └── App.tsx            # Root component
│   ├── dist/                  # Build de production
│   └── package.json
│
├── .github/
│   └── workflows/             # GitHub Actions CI/CD
│       ├── ci.yml             # Build, test, quality
│       ├── deploy.yml         # Production deployment
│       └── dependency-check.yml
│
├── DEPLOYMENT.md              # Guide de déploiement
├── QUICKSTART.md              # Guide de démarrage
├── CONTRIBUTING.md            # Guide de contribution
├── CHANGELOG.md               # Historique des versions
├── deploy.sh                  # Script de déploiement
└── README.md                  # Ce fichier
```

## 🚀 Fonctionnalités

### 📍 Gestion IP
- ✅ Création et gestion de pools IP
- ✅ Attribution/libération d'adresses
- ✅ Vue d'ensemble des réseaux
- ✅ Calcul de subnetting avec CIDR
- ✅ Historique des allocations
- ✅ Import/Export de plages

### �️ Monitoring Réseau
- ✅ Surveillance d'équipements en temps réel
- ✅ Métriques système (CPU, RAM, disque, réseau)
- ✅ Statut de disponibilité (ping)
- ✅ Alertes dynamiques basées sur les métriques
- ✅ Graphiques de performance
- ✅ Historique des métriques

### 🚨 Système d'Alertes Avancé
- ✅ Alertes temps réel depuis logs d'activité et métriques
- ✅ Niveaux de sévérité (Urgence, Critique, Avertissement, Info)
- ✅ Filtrage avancé (par sévérité et statut)
- ✅ Recherche full-text (titre, message, équipement)
- ✅ Seuils d'alerte intelligents :
  - CPU > 80% (Avertissement), > 95% (Critique)
  - Mémoire > 85% (Avertissement), > 95% (Critique)
  - Disque > 90% (Critique)
  - Erreurs d'activité automatiquement détectées
  - Actions de suppression marquées comme avertissements
- ✅ Actions sur alertes (Acquitter, Supprimer)
- ✅ Export CSV des alertes filtrées
- ✅ Interface moderne et responsive

### 🔍 Scanner Réseau
- ✅ Scan de plages IP configurables
- ✅ Détection automatique d'équipements
- ✅ Ping et tests de disponibilité
- ✅ Import automatique dans le monitoring
- ✅ Rapport de découverte
- ✅ Planification de scans

### 🗺️ Topologie Réseau
- ✅ Visualisation graphique interactive
- ✅ Relations entre équipements
- ✅ Types de connexions (fibre, cuivre, wifi)
- ✅ Statuts visuels (actif, inactif, erreur)
- ✅ Drag & drop pour organisation
- ✅ Export de diagrammes

### 🏢 Gestion d'Organisations
- ✅ Architecture multi-tenant
- ✅ Gestion des sites
- ✅ Statistiques par organisation
- ✅ Configuration isolée
- ✅ Utilisateurs et rôles
- ✅ Personnalisation par organisation

### 🔐 Authentification & Sécurité
- ✅ Authentification locale sécurisée
- ✅ Intégration LDAP/Active Directory
- ✅ JWT tokens avec refresh
- ✅ Gestion des sessions
- ✅ Générateur de mots de passe (CNIL)
- ✅ Rate limiting et protection CSRF

### 📝 Logs d'Audit
- ✅ Traçabilité complète des actions
- ✅ Historique détaillé par utilisateur
- ✅ Filtres et recherche avancée
- ✅ Export de logs
- ✅ Conformité audit
- ✅ Rétention configurable

### 📊 Dashboard
- ✅ Vue d'ensemble temps réel
- ✅ Métriques système du serveur
- ✅ Statistiques réseau globales
- ✅ Alertes et événements récents
- ✅ Graphiques de performance
- ✅ Widgets configurables

### 🔧 Outils Réseau
- ✅ Calculateur de sous-réseaux
- ✅ Convertisseur CIDR/masque
- ✅ Génération de mots de passe
- ✅ Tests de connectivité
- ✅ Utilitaires IP (validation, conversion)
- ✅ Documentation intégrée

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18.x ou 20.x
- PostgreSQL 14+
- Git
- npm ou yarn

### Installation Locale

```bash
# 1. Cloner le projet
git clone https://github.com/aruffin963/netadmin.git
cd NetAdmin

# 2. Configurer la base de données
psql -U postgres
CREATE DATABASE netadmin;
CREATE USER netadmin WITH ENCRYPTED PASSWORD 'netadmin123';
GRANT ALL PRIVILEGES ON DATABASE netadmin TO netadmin;
\q

# 3. Configurer et démarrer le backend
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos paramètres
npm run build
npm run migrate
npm run dev

# 4. Configurer et démarrer le frontend (nouveau terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

**Accès** :
- Frontend : http://localhost:5173
- Backend API : http://localhost:5000
- API Health : http://localhost:5000/api/health

### Installation avec Docker

```bash
docker-compose up -d
```

Voir [QUICKSTART.md](QUICKSTART.md) pour plus de détails.

## 📚 Documentation

Pour des informations détaillées sur l'utilisation et le déploiement du projet, consultez :

### Guides Disponibles

- **Frontend** : `frontend/` - Application React avec composants et pages
- **Backend** : `backend/` - API Node.js/Express
- **Documentation de Code** : Commentaires inline dans les fichiers source

### API Documentation

L'API REST est accessible et bien documentée :

**Endpoints principaux** :
- `GET /api/health` - Health check
- `POST /api/auth/login` - Authentification
- `GET /api/ip/pools` - Liste des pools IP
- `GET /api/agentless/devices` - Équipements monitorés
- `GET /api/agentless/metrics/{device_id}` - Métriques d'un équipement
- `GET /api/activity-logs` - Logs d'activité
- `GET /api/alerts` - Alertes générées
- `POST /api/alerts/{id}/acknowledge` - Acquitter une alerte
- `DELETE /api/alerts/{id}` - Supprimer une alerte

## 🛠️ Développement

### Commandes Backend

```bash
npm run dev          # Mode développement avec hot-reload
npm run build        # Compiler TypeScript
npm start            # Démarrer en production
npm run migrate      # Exécuter les migrations
npm run migrate:down # Annuler la dernière migration
npm test             # Exécuter les tests
npm run lint         # Vérifier le code
```

### Commandes Frontend

```bash
npm run dev      # Mode développement avec hot-reload
npm run build    # Compiler pour production
npm run preview  # Prévisualiser le build
npm run lint     # Vérifier le code
npm test         # Exécuter les tests
```

### Pages Principales

#### **Dashboard** (`frontend/src/pages/Dashboard.tsx`)
Vue d'ensemble temps réel avec:
- Métriques système globales
- Statistiques réseau
- Équipements récemment monitorés
- Alertes critiques

#### **Alertes** (`frontend/src/pages/Alerts.tsx`)
Page complète de gestion des alertes avec:
- Tableau interactif des alertes temps réel
- Filtrage par sévérité (Urgence, Critique, Avertissement, Info)
- Filtrage par statut (Actif, Acquitté, Résolu)
- Recherche full-text
- Actions par alerte (Acquitter, Supprimer)
- Export CSV
- Interface responsive (desktop & mobile)
- Intégration directe aux API de logs et métriques

#### **Équipements** (`frontend/src/pages/DevicesPage.tsx`)
Gestion des équipements avec:
- Liste de tous les équipements
- Métriques temps réel
- Statut de chaque équipement
- Historique des métriques

#### **Logs d'Activité** (`frontend/src/pages/ActivityLogsPage.tsx`)
Audit complet avec:
- Historique de toutes les actions
- Filtrage et recherche
- Détails des modifications
- Traçabilité utilisateur

### Variables d'Environnement

#### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netadmin
DB_USER=netadmin
DB_PASSWORD=netadmin123
JWT_SECRET=votre_secret_jwt_tres_long
PORT=5000
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENABLE_MONITORING=true
VITE_ENABLE_TOPOLOGY=true
VITE_ENABLE_LDAP_AUTH=true
```

## 🧪 Tests

### Exécuter les tests

```bash
# Backend
cd backend
npm test                    # Tous les tests
npm test -- --coverage      # Avec couverture

# Frontend
cd frontend
npm test                    # Tests unitaires
```

### CI/CD

Le projet utilise GitHub Actions pour :
- ✅ Build automatique (Node.js 18.x et 20.x)
- ✅ Tests unitaires et d'intégration
- ✅ Vérification qualité de code (ESLint, TypeScript)
- ✅ Audit de sécurité (npm audit)
- ✅ Déploiement automatique en production
- ✅ Vérification hebdomadaire des dépendances

## 📊 État du Projet

### ✅ Fonctionnalités Complètement Réalisées

#### Alertes et Monitoring
- ✅ **Système d'alertes complet** - Page Alerts.tsx avec UI moderne
  - Intégration aux logs d'activité (`/api/activity-logs`)
  - Intégration aux métriques système (`/api/agentless/metrics/{device_id}`)
  - Génération automatique d'alertes basée sur les seuils
  - Filtrage avancé et recherche full-text
  - Actions (Acquitter, Supprimer)
  - Export CSV
  - Interface responsive et ergonomique

#### Architecture & Code Quality
- ✅ **TypeScript** - Typage fort partout dans le projet
- ✅ **Styled Components** - CSS-in-JS moderne et scoped
- ✅ **API REST** - Endpoints bien structurés et documentés
- ✅ **Gestion d'erreurs** - Complète et cohérente
- ✅ **Nettoyage du projet** - Suppression des fichiers inutiles et documentation obsolète

### 🔄 Intégrations API Actives

- `GET /api/activity-logs` - Récupère les logs d'activité
- `GET /api/agentless/devices` - Liste tous les équipements
- `GET /api/agentless/metrics/{device_id}` - Métriques d'un équipement
- `POST /api/alerts/{id}/acknowledge` - Marque une alerte comme acquittée
- `DELETE /api/alerts/{id}` - Supprime une alerte

## 🤝 Contribution

Les contributions sont les bienvenues ! Avant de contribuer, veuillez :

1. 🍴 Fork le projet
2. 🌿 Créer une branche (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit les changements (`git commit -m 'feat: Add AmazingFeature'`)
4. 📤 Push vers la branche (`git push origin feature/AmazingFeature`)
5. 🔀 Ouvrir une Pull Request

### Convention de Commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

## 🔐 Sécurité

### Bonnes Pratiques Implémentées

- ✅ Authentification JWT sécurisée
- ✅ Validation des entrées utilisateur
- ✅ Protection contre les injections SQL
- ✅ Rate limiting sur les endpoints sensibles
- ✅ CORS configuré
- ✅ Headers de sécurité (Helmet.js)
- ✅ Mots de passe hashés (bcrypt)
- ✅ Sessions sécurisées
- ✅ Audit logging complet

### Signaler une Vulnérabilité

Si vous découvrez une faille de sécurité, merci de nous contacter directement à `security@votredomaine.com` plutôt que d'ouvrir une issue publique.

##  Roadmap

### Version 1.1 (Q1 2026)
- [ ] Dashboard personnalisable
- [ ] Notifications par email/SMS
- [ ] Export PDF des rapports
- [ ] API GraphQL
- [ ] Mobile app (React Native)

### Version 1.2 (Q2 2026)
- [ ] Intégration avec outils externes (Zabbix, Nagios)
- [ ] Machine Learning pour prédictions
- [ ] Automatisation de tâches
- [ ] Multi-langage (i18n)

### Version 2.0 (Q3 2026)
- [ ] Clustering et haute disponibilité
- [ ] Architecture microservices
- [ ] WebSockets pour temps réel
- [ ] Plugin system

## 🏆 Crédits

Développé avec ❤️ par l'équipe NetAdmin

### Technologies Clés

- [React 18](https://reactjs.org/) - Interface utilisateur moderne
- [TypeScript](https://www.typescriptlang.org/) - Typage statique robuste
- [Node.js](https://nodejs.org/) - Runtime serveur
- [Express.js](https://expressjs.com/) - Framework web léger
- [PostgreSQL](https://www.postgresql.org/) - Base de données relationnelle
- [Styled Components](https://styled-components.com/) - CSS-in-JS
- [React Icons](https://react-icons.github.io/react-icons/) - Icônes modernes

## � License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2025 NetAdmin Pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## Support & Contact

- **Issues** : [GitHub Issues](https://github.com/aruffin963/NetAdmin/issues)
- **Documentation** : [Wiki](https://github.com/aruffin963/NetAdmin/wiki)
- **Email** : adononalex@gmail.com

---

<div align="center">

**[⬆ Retour en haut](#NetAdmin-)**

Made with ❤️ by Alex Ruffin

</div>