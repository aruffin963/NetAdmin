# Git - Guide de Nettoyage et Configuration

## Problème : Les fichiers .gitignore ne prennent pas effet

Si vos fichiers `.gitignore` ne semblent pas fonctionner, c'est probablement parce que les fichiers sont **déjà suivis par Git**. Git continue de suivre les fichiers même s'ils sont ajoutés au `.gitignore` après coup.

## Solution 1 : Nettoyer le cache Git (Recommandé)

Si vous avez **déjà initialisé Git** mais que certains fichiers ne sont pas ignorés :

```powershell
# 1. Sauvegarder vos changements
git add .
git commit -m "chore: save changes before gitignore cleanup"

# 2. Supprimer tous les fichiers du cache Git (sans les supprimer physiquement)
git rm -r --cached .

# 3. Re-ajouter tous les fichiers (cette fois avec .gitignore actif)
git add .

# 4. Commiter le nettoyage
git commit -m "chore: apply .gitignore rules"

# 5. Vérifier le statut
git status
```

## Solution 2 : Démarrage propre (Si Git n'est pas encore initialisé)

Si vous n'avez **pas encore initialisé Git** ou si vous voulez repartir de zéro :

```powershell
# 1. S'assurer que tous les fichiers .gitignore sont en place
# Les fichiers .gitignore sont déjà créés dans :
# - c:\Users\alexr\Netadmin\.gitignore (root)
# - c:\Users\alexr\Netadmin\backend\.gitignore
# - c:\Users\alexr\Netadmin\frontend\.gitignore

# 2. Initialiser Git
cd c:\Users\alexr\Netadmin
git init

# 3. Ajouter tous les fichiers (les .gitignore seront respectés)
git add .

# 4. Vérifier ce qui sera commité
git status

# 5. Premier commit
git commit -m "feat: initial commit - NetAdmin Pro v1.0"
```

## Vérifier que .gitignore fonctionne

### Fichiers qui DOIVENT être ignorés :
```
✅ node_modules/            (dépendances NPM)
✅ dist/                    (build compilé)
✅ build/                   (build compilé)
✅ .vite/                   (cache Vite)
✅ .env                     (variables d'environnement)
✅ .env.local               
✅ .env.production          
✅ *.log                    (fichiers de log)
✅ logs/                    (dossier logs)
✅ *.db                     (bases de données)
✅ *.sqlite                 
✅ database.db              
✅ uploads/                 (fichiers uploadés)
✅ tmp/                     (fichiers temporaires)
✅ coverage/                (couverture de tests)
✅ *.tsbuildinfo            (cache TypeScript)
✅ .DS_Store                (macOS)
✅ Thumbs.db                (Windows)
```

### Fichiers qui DOIVENT être commités :
```
✅ package.json             (dépendances)
✅ package-lock.json        (lock file - optionnel)
✅ .env.example             (template)
✅ .env.production          (template - si pas de secrets)
✅ tsconfig.json            (config TypeScript)
✅ vite.config.ts           (config Vite)
✅ src/                     (code source)
✅ public/                  (assets statiques)
✅ migrations/              (migrations DB)
✅ README.md                
✅ .gitignore               
✅ .github/workflows/       (CI/CD)
```

### Commande pour vérifier ce qui sera ignoré :

```powershell
# Voir tous les fichiers ignorés
git status --ignored

# Vérifier si un fichier spécifique sera ignoré
git check-ignore -v node_modules
git check-ignore -v backend/dist
git check-ignore -v frontend/node_modules
git check-ignore -v .env

# Lister tous les fichiers qui seront commités
git ls-files
```

## Nettoyer des fichiers spécifiques déjà suivis

Si seulement certains fichiers posent problème :

```powershell
# Supprimer un fichier spécifique du suivi Git
git rm --cached backend/dist -r
git rm --cached frontend/dist -r
git rm --cached node_modules -r
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env
git rm --cached "*.log"
git rm --cached backend/logs -r
git rm --cached backend/database.db

# Commiter les changements
git commit -m "chore: remove ignored files from Git tracking"
```

## Fichiers sensibles déjà commités

Si vous avez **accidentellement commité des fichiers sensibles** (mots de passe, clés API, etc.) :

⚠️ **ATTENTION** : Les supprimer du dernier commit ne suffit pas ! Ils restent dans l'historique Git.

### Solution temporaire (commit récent) :
```powershell
# Supprimer le fichier du dernier commit
git rm --cached backend/.env
git commit --amend --no-edit

# Force push (ATTENTION : ne jamais faire sur une branche partagée)
git push --force
```

### Solution complète (nettoyage historique) :
```powershell
# Utiliser git-filter-repo (recommandé) ou BFG Repo-Cleaner
# Installation de git-filter-repo :
pip install git-filter-repo

# Supprimer un fichier de tout l'historique
git filter-repo --path backend/.env --invert-paths

# Ou utiliser BFG (plus simple pour les débutants)
# https://rtyley.github.io/bfg-repo-cleaner/
```

Après nettoyage, **CHANGER IMMÉDIATEMENT** :
- Tous les mots de passe
- Toutes les clés API
- Tous les secrets JWT
- Toutes les clés de certificats

## Configuration Git recommandée

```powershell
# Configurer votre identité
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"

# Utiliser LF comme fin de ligne (important pour la collaboration)
git config --global core.autocrlf input

# Couleurs dans le terminal
git config --global color.ui auto

# Editor par défaut (VS Code)
git config --global core.editor "code --wait"

# Afficher les branches dans le statut
git config --global status.branch true
git config --global status.showUntrackedFiles all
```

## Workflow Git recommandé

```powershell
# 1. Créer une branche pour une nouvelle fonctionnalité
git checkout -b feature/ma-nouvelle-fonctionnalite

# 2. Faire vos modifications
# ... éditer des fichiers ...

# 3. Vérifier les changements
git status
git diff

# 4. Ajouter les fichiers
git add .
# Ou ajouter sélectivement
git add backend/src/routes/nouvelle-route.ts

# 5. Commiter avec un message conventionnel
git commit -m "feat: ajouter nouvelle fonctionnalité"

# 6. Pousser vers GitHub
git push -u origin feature/ma-nouvelle-fonctionnalite

# 7. Créer une Pull Request sur GitHub
```

## Commandes Git utiles

```powershell
# Voir l'historique
git log --oneline --graph --all

# Annuler des changements non commités
git restore fichier.ts
git restore .

# Annuler un commit (en gardant les changements)
git reset --soft HEAD~1

# Annuler un commit (en supprimant les changements)
git reset --hard HEAD~1

# Voir les différences
git diff                    # Changements non stagés
git diff --staged           # Changements stagés
git diff HEAD               # Tous les changements

# Stash (mettre de côté temporairement)
git stash                   # Sauvegarder les changements
git stash list              # Voir les stash
git stash pop               # Récupérer le dernier stash
git stash drop              # Supprimer le dernier stash

# Branches
git branch                  # Lister les branches
git branch -d nom-branche   # Supprimer une branche
git checkout main           # Changer de branche
git merge feature/branch    # Merger une branche
```

## Problèmes courants

### "fatal: not a git repository"
➡️ Vous n'êtes pas dans un dépôt Git. Exécutez `git init` d'abord.

### "nothing to commit, working tree clean" mais des fichiers sont modifiés
➡️ Les fichiers sont probablement ignorés par `.gitignore`. Vérifiez avec `git status --ignored`.

### "Permission denied" lors du push
➡️ Configurez l'authentification SSH ou utilisez un token d'accès personnel (PAT) pour HTTPS.

### Les fins de ligne changent constamment
➡️ Configurez `core.autocrlf` : `git config --global core.autocrlf input`

### Fichiers binaires considérés comme texte
➡️ Vérifiez le fichier `.gitattributes` (déjà créé dans le projet)

## Ressources

- [Documentation Git officielle](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git ignore patterns](https://git-scm.com/docs/gitignore)
- [Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials)

---

Pour toute question, consultez la [documentation du projet](README.md) ou ouvrez une [issue sur GitHub](https://github.com/votre-username/netadmin-pro/issues).
