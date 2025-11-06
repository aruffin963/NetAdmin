# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Système complet de gestion IP avec organisations, pools et adresses
- Monitoring réseau en temps réel (CPU, RAM, disque, réseau)
- Scanner réseau avec vrais pings
- Dashboard avec statistiques et graphiques interactifs
- Authentification LDAP avec Active Directory
- Générateur de mots de passe sécurisés
- Système de logs d'activité complet (audit trail)
- Visualisation de la topologie réseau avec D3.js
- Outils de subnetting avancés
- Page de gestion des organisations avec CRUD complet
- API RESTful complète avec Express
- Interface utilisateur moderne avec React et styled-components
- Système de monitoring des équipements réseau
- Métriques système en temps réel
- Workflows GitHub Actions (CI/CD, tests, sécurité)

### Modifié
- Optimisation des requêtes SQL pour les statistiques
- Amélioration de la gestion des erreurs TypeScript
- Refactorisation des hooks React Query
- Mise à jour des types pour la compatibilité

### Corrigé
- Problème d'affichage des organisations après création
- Erreur de mapping des types d'équipements dans la topologie
- Erreurs TypeScript dans Logs.tsx et TopologyPage.tsx
- Problème de transformation des données (camelCase vs snake_case) dans l'API monitoring
- Requêtes SQL utilisant des tables inexistantes (vlans)
- Interpolation des keyframes styled-components v4+

### Sécurité
- Ajout de la validation des entrées utilisateur
- Protection contre les injections SQL avec requêtes paramétrées
- Chiffrement des mots de passe stockés
- Sessions sécurisées avec store PostgreSQL
- Logs d'audit pour toutes les actions sensibles

## [1.0.0] - YYYY-MM-DD

### Ajouté
- Version initiale de NetAdmin Pro
- Architecture complète backend (Node.js + TypeScript + PostgreSQL)
- Application frontend (React + TypeScript + Vite)
- Documentation API
- Tests unitaires
- Configuration CI/CD

---

## Types de changements

- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements aux fonctionnalités existantes
- `Déprécié` pour les fonctionnalités qui seront bientôt supprimées
- `Retiré` pour les fonctionnalités supprimées
- `Corrigé` pour les corrections de bugs
- `Sécurité` pour les vulnérabilités corrigées
