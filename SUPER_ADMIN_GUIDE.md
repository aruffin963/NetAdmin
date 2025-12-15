# Super Admin - Configuration et Utilisation

## 🔐 Vue d'ensemble

NetAdmin Pro supporte un utilisateur **Super Admin** qui peut se connecter sans LDAP. Cela fournit un accès de secours en cas de problème avec le serveur LDAP.

## 📋 Cas d'utilisation

- ✅ Accès de secours si LDAP est indisponible
- ✅ Configuration initiale du système
- ✅ Maintenance d'urgence
- ✅ Tests et développement
- ✅ Environnements sans LDAP

## 🚀 Installation

### 1. Générer le hash du mot de passe

```bash
# Option 1: Avec npm ts-node
npx ts-node backend/scripts/generate-admin-hash.ts "votreMotDePasseSecurise"

# Option 2: Avec bcrypt-cli
npx bcrypt-cli hash "votreMotDePasseSecurise"

# Le script retournera quelque chose comme:
# SUPER_ADMIN_PASSWORD_HASH=$2b$10$abc123def456ghi789jklmnop
```

⚠️ **Important**: Utilisez un mot de passe fort d'au moins 8 caractères !

### 2. Configurer les variables d'environnement

Ajouter à votre fichier `.env`:

```env
# Super Admin Configuration
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD_HASH=$2b$10$[votre-hash-bcrypt-ici]

# Si vous avez LDAP configuré, le super admin agit comme fallback
# Si vous n'avez pas LDAP, le super admin est la seule méthode d'auth
```

## 🔑 Utilisation

### Connexion en tant que Super Admin

1. Aller sur la page de connexion
2. Entrer les identifiants:
   - **Username**: admin (ou votre `SUPER_ADMIN_USERNAME`)
   - **Password**: Votre mot de passe
3. Cliquer sur "Se connecter"

### Exemple avec curl

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "votreMotDePasse"
  }'
```

**Réponse succès**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "admin",
    "isAdmin": true,
    "isSuperAdmin": true
  }
}
```

## 🔄 Comportement selon la configuration

### Cas 1: Avec LDAP configuré
```
Login attempt
    ↓
Super Admin credentials OK?
    ↓ Oui → ✅ Se connecter comme super admin
    ↓ Non
    ↓
LDAP authentication
```

### Cas 2: Sans LDAP
```
Login attempt
    ↓
Super Admin credentials OK?
    ↓ Oui → ✅ Se connecter
    ↓ Non → ❌ Erreur: "Authentication not configured"
```

### Cas 3: Super Admin désactivé (pas de SUPER_ADMIN_PASSWORD_HASH)
```
Login attempt
    ↓
Pas de super admin hash configuré
    ↓
LDAP authentication (si disponible)
    ↓ Sinon → ❌ Erreur
```

## 🛡️ Sécurité

### Bonnes pratiques

✅ **À faire**:
- Utiliser un mot de passe fort (16+ caractères)
- Inclure majuscules, minuscules, chiffres et symboles
- Ne pas partager le mot de passe
- Changer le mot de passe régulièrement
- Stocker le hash en sécurité dans `.env`
- Utiliser HTTPS en production

❌ **À éviter**:
- Ne jamais utiliser le mot de passe dans le code source
- Ne jamais commiter le fichier `.env` avec le vrai hash
- Ne pas utiliser les mêmes identifiants que LDAP
- Ne pas transmettre le hash sans chiffrement
- Ne pas utiliser des mots de passe simples

### Fichiers à protéger

```bash
# Le fichier .env ne doit JAMAIS être commité
.env
.env.local
.env.production

# Vérifiez votre .gitignore
cat .gitignore | grep -E "^\.env"
```

## 🔑 Regénérer le mot de passe

Si vous avez oublié le mot de passe du super admin:

```bash
# 1. Générer un nouveau hash
npx ts-node backend/scripts/generate-admin-hash.ts "nouveauMotDePasse"

# 2. Mettre à jour .env
SUPER_ADMIN_PASSWORD_HASH=$2b$10$[nouveau-hash]

# 3. Redémarrer le serveur
npm run dev
```

## 📝 Logs d'audit

Les connexions super admin sont enregistrées dans les logs d'audit:

```
{
  "username": "admin",
  "action": "LOGIN_SUCCESS",
  "details": {
    "method": "SuperAdmin",
    "isAdmin": true
  },
  "timestamp": "2025-12-15T10:30:00Z"
}
```

## 🚨 Dépannage

### "Invalid credentials"
```
✓ Vérifiez le mot de passe
✓ Vérifiez le hash dans .env
✓ Assurez-vous que SUPER_ADMIN_USERNAME est correct
```

### "Authentication not configured"
```
✓ Vérifiez que LDAP_URL n'est pas défini
✓ Ou vérifiez que SUPER_ADMIN_PASSWORD_HASH est défini
✓ Vérifiez les logs du serveur
```

### Super admin ne fonctionne pas
```bash
# Vérifier la configuration
echo $SUPER_ADMIN_USERNAME
echo $SUPER_ADMIN_PASSWORD_HASH

# Vérifier les logs
npm run dev 2>&1 | grep -i "super\|admin"

# Tester avec curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}'
```

## 🔐 Variables d'environnement

| Variable | Type | Défaut | Description |
|----------|------|--------|-------------|
| `SUPER_ADMIN_USERNAME` | string | `admin` | Nom d'utilisateur du super admin |
| `SUPER_ADMIN_PASSWORD_HASH` | string | aucun | Hash bcrypt du mot de passe |
| `LDAP_URL` | string | aucun | URL du serveur LDAP (optionnel) |

## 📚 Références

- [bcryptjs documentation](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Expression régulière mot de passe fort](https://owasp.org/www-community/password-requirements_cheat_sheet)

## ❓ Questions fréquentes

**Q: Puis-je avoir plusieurs super admins?**
A: Non, actuellement le système supporte un seul super admin. Pour plusieurs administrateurs, utilisez LDAP.

**Q: Le super admin peut-il créer d'autres utilisateurs?**
A: Oui, une fois connecté en tant que super admin, vous avez tous les droits d'administration.

**Q: Comment désactiver le super admin?**
A: Supprimez la variable `SUPER_ADMIN_PASSWORD_HASH` de votre `.env` ou ne la définissez pas.

**Q: Le mot de passe du super admin doit-il être changé?**
A: Oui, régulièrement (tous les 90 jours est recommandé).

**Q: Puis-je utiliser le super admin avec LDAP?**
A: Oui, le super admin agit comme fallback si LDAP échoue.

---

**Dernière mise à jour**: 15 décembre 2025
**Version**: 1.0.0
