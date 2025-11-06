# Backend - API Node.js

## 🎯 Description
API RESTful de Netadmin construite avec Node.js et Express.

## 🏗️ Structure
```
backend/
├── src/
│   ├── controllers/      # Contrôleurs des routes
│   ├── middleware/       # Middlewares Express
│   ├── models/          # Modèles de données
│   ├── routes/          # Définition des routes
│   ├── services/        # Logique métier
│   ├── utils/           # Utilitaires
│   ├── config/          # Configuration
│   └── app.js           # Point d'entrée de l'application
├── tests/               # Tests unitaires et d'intégration
└── package.json         # Dépendances et scripts
```

## 🚀 Fonctionnalités

### 🔌 API Endpoints
- **Authentication** : Gestion des utilisateurs et sessions
- **IP Management** : CRUD des adresses IP et pools
- **Network Monitoring** : APIs de monitoring temps réel
- **Subnetting** : Calculs et gestion des sous-réseaux
- **Logs** : Collecte et requête des logs système

### 🛡️ Sécurité
- Authentification JWT
- Validation des données d'entrée
- Rate limiting
- CORS configuré

### 🗄️ Base de Données
- PostgreSQL pour les données principales
- Redis pour le cache et sessions
- Migrations et seeders

## 🛠️ Technologies
- Node.js
- Express.js
- PostgreSQL
- Redis
- JWT pour l'authentification
- Joi pour la validation

*Configuration et installation à venir*