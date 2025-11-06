# Shared - Code Partagé

## 🎯 Description
Types TypeScript, utilitaires et constantes partagés entre le frontend et le backend.

## 🏗️ Structure
```
shared/
├── types/               # Types TypeScript communs
│   ├── api.ts          # Types pour les réponses API
│   ├── network.ts      # Types liés au réseau
│   ├── user.ts         # Types utilisateur
│   └── index.ts        # Export central
├── constants/          # Constantes partagées
│   ├── network.ts      # Constantes réseau
│   ├── api.ts          # Constantes API
│   └── index.ts        # Export central
├── utils/              # Utilitaires partagés
│   ├── network.ts      # Fonctions réseau
│   ├── validation.ts   # Fonctions de validation
│   └── index.ts        # Export central
└── package.json        # Configuration du package
```

## 🚀 Contenu

### 📝 Types TypeScript
- Interfaces pour les entités métier
- Types pour les réponses API
- Enums et unions types

### 🔧 Utilitaires
- Fonctions de calcul réseau
- Validateurs communs
- Helpers pour les IP et sous-réseaux

### 📊 Constantes
- Codes d'erreur API
- Constantes réseau (ports, protocoles)
- Messages d'erreur standardisés

## 🛠️ Usage
```typescript
// Dans le frontend ou backend
import { IPAddress, SubnetMask } from '@netadmin/shared/types';
import { validateIP } from '@netadmin/shared/utils';
```

*Configuration et installation à venir*