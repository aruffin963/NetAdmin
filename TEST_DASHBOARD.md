# Test du Dashboard avec données mockées

## Instructions de test

1. **Démarrer le serveur backend** (si pas déjà lancé):
   ```powershell
   cd backend
   npm run dev
   ```

2. **Démarrer le serveur frontend** (nouveau terminal):
   ```powershell
   cd frontend
   npm start
   ```

3. **Tester l'endpoint mockée dans le navigateur**:
   - Ouvrez: `http://localhost:5000/api/zabbix/test`
   - Vous devriez voir:
     ```json
     {
       "success": true,
       "data": [
         {
           "hostId": "10001",
           "hostName": "Web Server 01",
           "status": 0,
           "available": 1,
           "cpu": 45.2,
           "memory": 62.8,
           "disk": 72.5,
           "uptime": 2592000
         },
         ...
       ]
     }
     ```

4. **Ouvrir DevTools du navigateur** (F12):
   - Allez à l'onglet **Console**
   - Allez à l'onglet **Network**

5. **Naviguer au Dashboard** (http://localhost:3000/dashboard):
   - Observez les logs en Console:
     - `✅ Checking Zabbix status...`
     - `✅ Zabbix Status: {"connected":false,"auth":null}`
     - Si Zabbix n'est pas connecté: Un message d'avertissement s'affichera
   
6. **Si vous voyez "Zabbix not connected"**:
   - C'est NORMAL au démarrage
   - Cela ne devrait PAS afficher d'erreur rouge
   - Les onglets doivent être accessibles

7. **Vérifier que le Dashboard charge les données**:
   - Dans l'onglet Network, cherchez les requêtes:
     - `GET /api/zabbix/status` → 200
     - `GET /api/zabbix/hosts` → 401 (normal si pas connecté)
     - `GET /api/zabbix/metrics` → 401 (normal si pas connecté)

## Si vous voulez forcer les données mockées:

**Modifiez le Dashboard temporairement pour tester** (frontend/src/pages/Dashboard.tsx):

```typescript
// Remplacez loadZabbixData() par :
const loadZabbixDataMocked = async () => {
  setLoading(true);
  try {
    const mockHosts = [
      {
        hostId: '10001',
        hostName: 'Web Server 01',
        status: 0,
        available: 1,
        cpu: 45.2,
        memory: 62.8,
        disk: 72.5,
        uptime: 2592000,
      },
      {
        hostId: '10002',
        hostName: 'Database Server',
        status: 0,
        available: 1,
        cpu: 78.5,
        memory: 88.3,
        disk: 65.2,
        uptime: 3456000,
      },
      {
        hostId: '10003',
        hostName: 'Mail Server',
        status: 0,
        available: 1,
        cpu: 92.1,
        memory: 96.5,
        disk: 89.7,
        uptime: 1728000,
      },
    ];
    
    setHosts(mockHosts);
    setMetrics(mockHosts);
    setZabbixConnected(true);
  } finally {
    setLoading(false);
  }
};
```

Puis changez dans useEffect:
```typescript
useEffect(() => {
  loadZabbixDataMocked(); // Utilisez les données mockées
}, []);
```

## Diagnostic si ça ne marche pas:

1. **Console (F12) → Console tab**:
   - Cherchez les logs en rouge (erreurs)
   - Cherchez les logs avec les emojis (✅, ❌, 📊, 📈, ⚠️)

2. **Network tab (F12)**:
   - Cherchez les requêtes vers `/api/zabbix/`
   - Vérifiez le statut HTTP (200, 401, 500, etc.)
   - Cliquez sur la requête et allez à "Response" pour voir les données

3. **Si 500 error**:
   - Le serveur backend crash ou erreur
   - Vérifiez le terminal backend pour les logs d'erreur

4. **Si 401 error**:
   - Zabbix n'est pas connecté (c'est normal)
   - Allez à http://localhost:3000/monitoring pour configurer
   - Rentrez les crédentiels Zabbix réels (ou laissez par défaut)
   - Cliquez "Connect to Zabbix"

## Données attendues après connexion Zabbix:

Les endpoints devraient retourner:

**GET /api/zabbix/hosts**:
```json
{
  "success": true,
  "data": [
    {
      "hostId": "10001",
      "hostName": "Server Name",
      "status": 0,
      "available": 1
    }
  ]
}
```

**GET /api/zabbix/metrics**:
```json
{
  "success": true,
  "data": [
    {
      "hostId": "10001",
      "hostName": "Server Name",
      "cpu": 45.2,
      "memory": 62.8,
      "disk": 72.5,
      "uptime": 2592000,
      ...
    }
  ]
}
```

Tous les onglets du dashboard devraient alors afficher les données réelles.
