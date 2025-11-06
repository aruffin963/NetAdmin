# Guide de Contribution

Merci de votre intérêt pour contribuer à NetAdmin Pro ! 🎉

## Code de Conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite. Soyez respectueux et professionnel dans toutes vos interactions.

## Comment Contribuer

### Signaler des Bugs

Si vous trouvez un bug, veuillez créer une issue avec :
- Une description claire du problème
- Les étapes pour reproduire le bug
- Le comportement attendu vs le comportement actuel
- Des captures d'écran si applicable
- Votre environnement (OS, Node version, navigateur)

### Proposer des Fonctionnalités

Pour proposer une nouvelle fonctionnalité :
1. Vérifiez qu'elle n'est pas déjà proposée dans les issues
2. Créez une issue détaillant :
   - Le problème que cela résout
   - Votre solution proposée
   - Des alternatives considérées
   - L'impact sur le code existant

### Pull Requests

#### Processus

1. **Fork** le projet
2. **Créez une branche** depuis `develop` :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/mon-correctif
   ```

3. **Développez** en suivant les standards du projet

4. **Testez** vos changements :
   ```bash
   # Backend
   cd backend
   npm test
   npm run lint
   
   # Frontend
   cd frontend
   npm test
   npm run lint
   ```

5. **Commitez** avec des messages clairs :
   ```bash
   git commit -m "feat: ajout du monitoring SNMP"
   git commit -m "fix: correction du scan réseau"
   git commit -m "docs: mise à jour du README"
   ```

6. **Push** vers votre fork :
   ```bash
   git push origin feature/ma-fonctionnalite
   ```

7. **Ouvrez une Pull Request** avec :
   - Un titre descriptif
   - Une description détaillée des changements
   - Les issues liées (si applicable)
   - Des captures d'écran (si UI)

#### Convention de Commits

Nous utilisons les [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, point-virgules manquants, etc.
- `refactor:` Refactorisation de code
- `test:` Ajout de tests
- `chore:` Maintenance, dépendances, etc.
- `perf:` Amélioration de performance

Exemples :
```
feat(monitoring): ajout du support SNMP v3
fix(scanner): correction du timeout sur gros sous-réseaux
docs(api): documentation des endpoints de monitoring
refactor(auth): simplification du middleware LDAP
```

## Standards de Code

### TypeScript

- Utilisez des types explicites, évitez `any`
- Documentez les fonctions complexes avec JSDoc
- Suivez les conventions de nommage :
  - `camelCase` pour variables et fonctions
  - `PascalCase` pour classes et types
  - `UPPER_SNAKE_CASE` pour constantes

### React

- Composants fonctionnels avec hooks
- Props typées avec TypeScript
- Styled-components pour le CSS
- Commentaires pour la logique complexe

### Node.js/Express

- Routes organisées par domaine
- Services pour la logique métier
- Middleware pour les concerns transversaux
- Gestion d'erreurs centralisée

### Base de Données

- Migrations versionnées pour les schémas
- Requêtes paramétrées (jamais de string interpolation)
- Indexes pour les requêtes fréquentes
- Transactions pour les opérations critiques

## Structure du Code

```
backend/
├── src/
│   ├── config/       # Configuration
│   ├── middleware/   # Middlewares Express
│   ├── routes/       # Routes API
│   ├── services/     # Logique métier
│   ├── types/        # Types TypeScript
│   └── utils/        # Utilitaires

frontend/
├── src/
│   ├── components/   # Composants réutilisables
│   ├── pages/        # Pages/vues
│   ├── hooks/        # Hooks personnalisés
│   ├── types/        # Types TypeScript
│   └── utils/        # Utilitaires
```

## Tests

### Backend

```bash
cd backend
npm test                  # Tous les tests
npm test -- --watch      # Mode watch
npm run test:coverage    # Avec couverture
```

### Frontend

```bash
cd frontend
npm test                  # Tous les tests
npm test -- --watch      # Mode watch
npm run test:coverage    # Avec couverture
```

### Écrire des Tests

- Tests unitaires pour la logique métier
- Tests d'intégration pour les routes API
- Tests de composants pour le frontend
- Minimum 80% de couverture pour les PR

## Documentation

- Commentez le code complexe
- Mettez à jour le README si nécessaire
- Documentez les nouvelles APIs dans Swagger
- Ajoutez des exemples d'utilisation

## Revue de Code

Tous les PRs seront revus. Attendez-vous à :
- Des suggestions d'amélioration
- Des questions sur vos choix
- Des demandes de tests supplémentaires
- Des discussions constructives

## Questions ?

- 💬 Ouvrez une [Discussion](https://github.com/aruffin963/netadmin-pro/discussions)
- 📧 Email : adononalex@gmail.com
- 🐛 [Issues](https://github.com/aruffin963/netadmin-pro/issues)

## Licence

En contribuant, vous acceptez que vos contributions soient sous la même licence MIT que le projet.

---

Merci pour votre contribution ! 🙏
